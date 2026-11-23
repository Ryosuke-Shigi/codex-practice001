<?php

namespace Tests\Feature\LinksLanchar;

use App\Models\Link;
use App\Models\LinksLanchar;
use App\Support\Portfolio\PortfolioLinksLancharDefinition;
use Database\Seeders\PortfolioLinksLancharSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PortfolioLinksLancharSeederTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // 実Seederを繰り返すテストは専用のインメモリ接続に限る。
        config(['database.connections.portfolio_lanchar_seeder_test' => [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'foreign_key_constraints' => true,
        ]]);
        DB::setDefaultConnection('portfolio_lanchar_seeder_test');
        Schema::clearResolvedInstance('db.schema');

        $migration = require database_path('migrations/2026_11_23_000000_create_links_lanchar_tables.php');
        $migration->up();
    }

    public function test_portfolio_entry_reuses_the_current_projects_and_destinations_in_order(): void
    {
        $this->seed(PortfolioLinksLancharSeeder::class);

        // 現行ProjectHub/projectData.tsの表示順と既存遷移先を保つ。
        $titles = [
            'API Discovery Hub',
            'DanceShortsRadar',
            'DanceShortsAnalyzer',
            'Japan Quake Wave Map',
            'LumiLab',
            '工事発注管理',
            'イベント・カードカレンダー',
            'アプリログ',
        ];
        $destinations = [
            '/projects?project=api-discovery-hub&view=stages',
            '/projects?project=dance-shorts-radar&view=stages',
            '/projects?project=dance-shorts-analyzer&view=stages',
            '/projects?project=japan-quake-wave-map&view=stages',
            '/projects?project=lumilab&view=stages',
            '/projects?project=construction-order&view=stages',
            '/projects?project=event-card-calendar&view=stages',
            '/projects/logs',
        ];
        $radarLink = Link::query()->where('title', 'DanceShortsRadar')->sole();
        $analyzerLink = Link::query()->where('title', 'DanceShortsAnalyzer')->sole();

        $this->get('/portfolio/links-lanchar?project=dance-shorts-radar')
            ->assertOk()
            ->assertInertia(fn (Assert $props) => $props
                ->component('LinksLanchar/Show', false)
                ->where('linksLanchar.linksLancharKey', PortfolioLinksLancharDefinition::LINKS_LANCHAR_KEY)
                ->where('selectedLinkKey', $radarLink->link_key)
                ->has('linkList.links', count($titles))
                ->where('linkList.links', fn ($links): bool => array_column($links->all(), 'destinationUrl') === $destinations
                    && array_column(array_column($links->all(), 'displayValues'), 'title') === $titles)
                ->where('linkList.links.5.displayValues.selectionDisplayType', 'sphere')
                ->where('linkList.links.5.displayValues.backgroundColor', '#12201c')
                ->where('linkList.links.5.displayValues.sphereColor', '#4ade80')
                ->where('linkList.links.5.displayValues.lucideIconName', 'Building2')
                ->where('linkList.links.5.displayValues.selectionImageSource', null)
                ->where('linkList.links.5.displayValues.backgroundImageSource', null)
                ->etc()
            );

        $this->get('/portfolio/links-lanchar?project=dance-shorts-radar&selectedLinkKey='.$analyzerLink->link_key)
            ->assertOk()
            ->assertInertia(fn (Assert $props) => $props
                ->where('selectedLinkKey', $analyzerLink->link_key)
                ->etc()
            );
    }

    public function test_the_four_image_projects_reference_the_accepted_assets_and_static_posters(): void
    {
        $this->seed(PortfolioLinksLancharSeeder::class);

        $assets = [
            'API Discovery Hub' => [
                'api-discovery-hub',
                'selection-v1.gif',
                'selection-poster-v1.png',
                'background-v1.gif',
                'background-poster-v1.png',
                'icon-globe-search-v1.png',
            ],
            'DanceShortsRadar' => [
                'dance-shorts-radar',
                'selection-v1.gif',
                'selection-v1.png',
                'background-v1.gif',
                'background-v1.png',
                'icon-radar-v1.png',
            ],
            'DanceShortsAnalyzer' => [
                'dance-shorts-analyzer',
                'selection-v2.gif',
                'selection-poster-v2.png',
                'background-v1.gif',
                'background-poster-v1.png',
                'icon-bar-chart-v1.png',
            ],
            'Japan Quake Wave Map' => [
                'japan-quake-wave-map',
                'selection-v1.gif',
                'selection-v1.png',
                'background-v2.gif',
                'background-poster-v1.png',
                'icon-radar-v1.png',
            ],
        ];
        $referenceColumns = [
            'selection_image_reference',
            'selection_image_poster_reference',
            'background_image_reference',
            'background_image_poster_reference',
            'icon_image_reference',
        ];

        foreach ($assets as $title => $files) {
            $projectId = array_shift($files);
            $link = Link::query()->where('title', $title)->sole();
            $assetRoot = 'images/links-lanchar/portfolio/'.$projectId.'/';
            foreach (array_combine($referenceColumns, $files) as $column => $fileName) {
                $this->assertIsString($link->{$column}, $title.' '.$column);
                $this->assertSame($assetRoot.$fileName, ltrim($link->{$column}, '/'), $title.' '.$column);
                $this->assertFileExists(public_path($assetRoot.$fileName));
            }
        }

        $this->assertSame('aquaParticles', Link::query()->where('title', 'API Discovery Hub')->sole()->background_effect_name);
        $this->assertNull(Link::query()->where('title', 'Japan Quake Wave Map')->sole()->background_effect_name);
    }

    public function test_reseeding_preserves_keys_unchanged_timestamps_and_soft_deleted_records(): void
    {
        $this->seed(PortfolioLinksLancharSeeder::class);

        $launcher = LinksLanchar::query()->where('links_lanchar_key', PortfolioLinksLancharDefinition::LINKS_LANCHAR_KEY)->sole();
        $removedLink = $launcher->links()->where('title', 'LumiLab')->sole();
        $removedLink->delete();
        $customLink = $launcher->links()->create(['title' => '初期定義外のLink']);
        $launcher->delete();
        $previousState = $this->linkState($launcher);
        $previousLauncherUpdate = $launcher->getRawOriginal('updated_at');
        $previousLauncherDeletion = $launcher->getRawOriginal('deleted_at');

        $this->travel(1)->hour();
        try {
            $this->seed(PortfolioLinksLancharSeeder::class);
        } finally {
            $this->travelBack();
        }

        $this->assertDatabaseCount('links_lanchars', 1);
        $this->assertDatabaseCount('link_pages', 8);
        $this->assertDatabaseCount('links', 9);
        $this->assertSame($previousState, $this->linkState($launcher));
        $this->assertSame($previousLauncherUpdate, $launcher->refresh()->getRawOriginal('updated_at'));
        $this->assertSame($previousLauncherDeletion, $launcher->getRawOriginal('deleted_at'));
        $this->assertSoftDeleted($launcher);
        $this->assertSoftDeleted($removedLink);
        $this->assertModelExists($customLink);
    }

    public function test_seeder_soft_deletes_only_the_explicit_launcher_and_link_keys(): void
    {
        $this->seed(PortfolioLinksLancharSeeder::class);

        $launcher = LinksLanchar::query()->where('links_lanchar_key', PortfolioLinksLancharDefinition::LINKS_LANCHAR_KEY)->sole();
        $linkToDelete = $launcher->links()->where('title', 'LumiLab')->sole();
        $linkToKeep = $launcher->links()->where('title', '工事発注管理')->sole();
        $seeder = new PortfolioLinksLancharSeeder(
            deletedLinkKeys: [$linkToDelete->link_key],
            deletedLinksLancharKeys: [$launcher->links_lanchar_key],
        );
        $seeder->run();

        $this->assertSoftDeleted($launcher);
        $this->assertSoftDeleted($linkToDelete);
        $this->assertDatabaseHas('links', [
            'id' => $linkToDelete->getKey(),
            'link_key' => $linkToDelete->link_key,
            'owner_links_lanchar_key' => $launcher->links_lanchar_key,
        ]);
        $this->assertDatabaseHas('links', [
            'id' => $linkToKeep->getKey(),
            'link_key' => $linkToKeep->link_key,
            'owner_links_lanchar_key' => $launcher->links_lanchar_key,
            'deleted_at' => null,
        ]);
        $this->assertDatabaseCount('links_lanchars', 1);
        $this->assertDatabaseCount('links', 8);
        $previousState = $this->linkState($launcher);
        $previousLauncherUpdate = $launcher->refresh()->getRawOriginal('updated_at');
        $previousLauncherDeletion = $launcher->getRawOriginal('deleted_at');

        $this->travel(1)->hour();
        try {
            $seeder->run();
        } finally {
            $this->travelBack();
        }

        $this->assertSame($previousState, $this->linkState($launcher));
        $this->assertSame($previousLauncherUpdate, $launcher->refresh()->getRawOriginal('updated_at'));
        $this->assertSame($previousLauncherDeletion, $launcher->getRawOriginal('deleted_at'));
    }

    /** @return array<string, array{id: int, updatedAt: string, deletedAt: ?string}> */
    private function linkState(LinksLanchar $launcher): array
    {
        return $launcher->links()
            ->withTrashed()
            ->orderBy('link_key')
            ->get()
            ->mapWithKeys(fn (Link $link): array => [
                $link->link_key => [
                    'id' => $link->getKey(),
                    'updatedAt' => $link->getRawOriginal('updated_at'),
                    'deletedAt' => $link->getRawOriginal('deleted_at'),
                ],
            ])
            ->all();
    }
}
