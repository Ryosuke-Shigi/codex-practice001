<?php

namespace Tests\Feature\LinksLauncher;

use App\Models\Link;
use App\Models\LinkPage;
use App\Models\LinksLauncher;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\QueryException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use LogicException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class LinksLauncherSchemaTest extends TestCase
{
    private const MIGRATION = 'migrations/2026_11_23_000000_create_links_lanchar_tables.php';

    private ?Migration $migration = null;

    protected function setUp(): void
    {
        parent::setUp();

        // テストのup/downは専用のインメモリ接続だけで行う。
        config(['database.connections.links_launcher_schema_test' => [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'foreign_key_constraints' => true,
        ]]);
        DB::setDefaultConnection('links_launcher_schema_test');
        Schema::clearResolvedInstance('db.schema');

        Schema::create('existing_rows', function (Blueprint $table) {
            $table->id();
            $table->string('value');
        });
        DB::table('existing_rows')->insert(['value' => 'preserved']);

        $path = database_path(self::MIGRATION);
        if (is_file($path)) {
            $this->migration = require $path;
            $this->migration->up();
        }
    }

    public function test_migration_can_be_reversed_without_touching_existing_data(): void
    {
        foreach (['links_launchers', 'link_pages', 'links'] as $table) {
            $this->assertTrue(Schema::hasTable($table), "{$table} が作成されていません。");
        }
        $this->assertNotNull($this->migration);

        $launcher = LinksLauncher::query()->create();
        $destination = LinkPage::query()->create(['url' => '/projects?project=api-discovery-hub&view=stages']);
        Link::query()->create([
            'owner_links_launcher_key' => $launcher->links_launcher_key,
            'destination_page_id' => $destination->id,
        ]);

        $this->migration->down();

        foreach (['links', 'link_pages', 'links_launchers'] as $table) {
            $this->assertFalse(Schema::hasTable($table));
        }
        $this->assertSame('preserved', DB::table('existing_rows')->value('value'));

        $this->migration->up();
        foreach (['links_launchers', 'link_pages', 'links'] as $table) {
            $this->assertTrue(Schema::hasTable($table), "{$table} が作成されていません。");
        }
    }

    public function test_signed_nullable_priorities_and_explicit_visibility_blank_are_preserved(): void
    {
        $owner = LinksLauncher::query()->create();
        $visible = Link::query()->create([
            'owner_links_launcher_key' => $owner->links_launcher_key,
            'priority' => -2,
        ]);
        $blank = Link::query()->create([
            'owner_links_launcher_key' => $owner->links_launcher_key,
            'priority' => 0,
            'is_visible' => '',
        ]);
        $null = Link::query()->create([
            'owner_links_launcher_key' => $owner->links_launcher_key,
            'is_visible' => null,
        ]);
        $false = Link::query()->create([
            'owner_links_launcher_key' => $owner->links_launcher_key,
            'is_visible' => false,
        ]);

        $this->assertSame(-2, $visible->refresh()->priority);
        $this->assertTrue($visible->is_visible);
        $this->assertSame(0, $blank->refresh()->priority);
        $this->assertFalse($blank->is_visible);
        $this->assertNull($null->refresh()->priority);
        $this->assertFalse($null->is_visible);
        $this->assertFalse($false->refresh()->is_visible);
    }

    public function test_soft_deletion_keeps_owned_links_and_reserves_the_public_key(): void
    {
        $owner = LinksLauncher::query()->create();
        $link = Link::query()->create(['owner_links_launcher_key' => $owner->links_launcher_key]);

        $owner->delete();

        $this->assertNull(LinksLauncher::query()->find($owner->id));
        $this->assertSame($owner->links_launcher_key, $link->refresh()->owner_links_launcher_key);
        $this->assertNull($link->deleted_at);

        $this->expectException(QueryException::class);
        LinksLauncher::query()->create(['links_launcher_key' => $owner->links_launcher_key]);
    }

    public function test_link_key_is_unique_across_owners_and_soft_deleted_rows(): void
    {
        $owner = LinksLauncher::query()->create();
        $otherOwner = LinksLauncher::query()->create();
        $link = Link::query()->create(['owner_links_launcher_key' => $owner->links_launcher_key]);
        $link->delete();

        $this->expectException(QueryException::class);
        Link::query()->create([
            'owner_links_launcher_key' => $otherOwner->links_launcher_key,
            'link_key' => $link->link_key,
        ]);
    }

    public function test_foreign_keys_keep_owned_links_and_clear_deleted_destinations(): void
    {
        $owner = LinksLauncher::query()->create();
        $destination = LinksLauncher::query()->create();
        $page = LinkPage::query()->create(['url' => '/projects/logs']);
        $launcherLink = Link::query()->create([
            'owner_links_launcher_key' => $owner->links_launcher_key,
            'destination_links_launcher_key' => $destination->links_launcher_key,
        ]);
        $pageLink = Link::query()->create([
            'owner_links_launcher_key' => $owner->links_launcher_key,
            'destination_page_id' => $page->id,
        ]);

        $page->delete();
        $destination->forceDelete();
        $this->assertNull($pageLink->refresh()->destination_page_id);
        $this->assertNull($launcherLink->refresh()->destination_links_launcher_key);
        $this->assertDatabaseCount('links', 2);

        $this->expectException(QueryException::class);
        $owner->forceDelete();
    }

    public function test_database_rejects_dual_destinations_on_insert_and_update(): void
    {
        $owner = LinksLauncher::query()->create();
        $page = LinkPage::query()->create(['url' => 'https://example.com/']);
        $attributes = [
            'owner_links_launcher_key' => $owner->links_launcher_key,
            'destination_links_launcher_key' => $owner->links_launcher_key,
            'destination_page_id' => $page->id,
        ];

        try {
            DB::table('links')->insert(['link_key' => (string) Str::uuid(), 'updated_at' => now(), ...$attributes]);
            $this->fail('2種類の行き先を同時に登録できました。');
        } catch (QueryException $error) {
            $this->assertStringContainsString('links_at_most_one_destination', $error->getMessage());
        }

        $link = Link::query()->create(['owner_links_launcher_key' => $owner->links_launcher_key]);
        $this->expectException(QueryException::class);
        $this->expectExceptionMessage('links_at_most_one_destination');
        DB::table('links')->where('id', $link->id)->update($attributes);
    }

    #[DataProvider('publicKeyColumns')]
    public function test_model_generates_uuid_v4_and_keeps_public_keys_on_update(string $model, string $column): void
    {
        $attributes = $model === Link::class
            ? ['owner_links_launcher_key' => LinksLauncher::query()->create()->links_launcher_key]
            : [];
        $record = $model::query()->create($attributes);
        $key = $record->{$column};
        $this->assertMatchesRegularExpression('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/', $key);

        $record->update(['title' => 'updated']);
        $this->assertSame($key, $record->refresh()->{$column});

        $this->expectException(LogicException::class);
        $record->update([$column => (string) Str::uuid()]);
    }

    /**
     * @return array<string, array{class-string, string}>
     */
    public static function publicKeyColumns(): array
    {
        return [
            'launcher' => [LinksLauncher::class, 'links_launcher_key'],
            'link' => [Link::class, 'link_key'],
        ];
    }
}
