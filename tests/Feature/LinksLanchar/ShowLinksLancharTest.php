<?php

namespace Tests\Feature\LinksLanchar;

use App\Models\Link;
use App\Models\LinkPage;
use App\Models\LinksLanchar;
use App\Responders\LinksLanchar\LinksLancharResponder;
use App\Support\Portfolio\PortfolioLinksLancharDefinition;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ShowLinksLancharTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // HTTPテストのfixtureは作業用DBから隔離し、対象Migrationだけ適用する。
        config(['database.connections.links_lanchar_feature_test' => [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'foreign_key_constraints' => true,
        ]]);
        DB::setDefaultConnection('links_lanchar_feature_test');
        Schema::clearResolvedInstance('db.schema');

        $migration = require database_path('migrations/2026_11_23_000000_create_links_lanchar_tables.php');
        $migration->up();
    }

    public function test_both_public_entries_supply_the_site_top_even_for_an_empty_untitled_launcher(): void
    {
        $launcher = LinksLanchar::query()->create([
            'links_lanchar_key' => PortfolioLinksLancharDefinition::LINKS_LANCHAR_KEY,
        ]);

        foreach (['/portfolio/links-lanchar', '/links-lanchars/'.$launcher->links_lanchar_key] as $url) {
            $this->get($url.'?topUrl=https%3A%2F%2Fexample.invalid')
                ->assertOk()
                ->assertInertia(fn (Assert $props) => $props
                    ->where('navigation.topUrl', '/')
                    ->where('linksLanchar.title', null)
                    ->where('linksLanchar.description', null)
                    ->has('linkList.links', 0)
                    ->etc()
                );
        }
    }

    public function test_the_host_binding_can_supply_a_different_top_without_changing_common_code(): void
    {
        $this->app->when(LinksLancharResponder::class)
            ->needs('$topUrl')
            ->give(static fn (): string => '/fixture-site/top');
        $launcher = LinksLanchar::query()->create();

        $this->get('/links-lanchars/'.$launcher->links_lanchar_key)
            ->assertOk()
            ->assertInertia(fn (Assert $props) => $props
                ->where('navigation.topUrl', '/fixture-site/top')
                ->etc()
            );
    }

    public function test_a_visible_link_exposes_its_saved_page_url(): void
    {
        $launcher = LinksLanchar::query()->create(['title' => '作品一覧']);
        $page = LinkPage::query()->create([
            'url' => '/projects?project=api-discovery-hub&view=stages',
        ]);
        $link = Link::query()->create([
            'owner_links_lanchar_key' => $launcher->links_lanchar_key,
            'title' => 'API Discovery Hub',
            'destination_page_id' => $page->getKey(),
        ]);

        $this->get('/links-lanchars/'.$launcher->links_lanchar_key)
            ->assertOk()
            ->assertInertia(fn (Assert $props) => $props
                ->component('LinksLanchar/Show', false)
                ->where('linksLanchar.linksLancharKey', $launcher->links_lanchar_key)
                ->where('selectedLinkKey', $link->link_key)
                ->has('linkList.links', 1)
                ->where('linkList.links.0.linkKey', $link->link_key)
                ->where('linkList.links.0.destinationUrl', $page->url)
                ->etc()
            );
    }

    public function test_selectable_links_are_scoped_and_ordered_before_selection_is_resolved(): void
    {
        $launcher = LinksLanchar::query()->create();
        $otherLauncher = LinksLanchar::query()->create();

        $unrankedOlder = $this->createLink($launcher, null, '2026-11-21 12:00:00');
        $unrankedNewer = $this->createLink($launcher, null, '2026-11-22 12:00:00');
        $zeroOlder = $this->createLink($launcher, 0, '2026-11-21 12:00:00');
        $zeroNewer = $this->createLink($launcher, 0, '2026-11-22 12:00:00');
        $negative = $this->createLink($launcher, -2);
        $positive = $this->createLink($launcher, 2);
        $foreignLink = $this->createLink($otherLauncher, -5);
        $hiddenLink = Link::query()->create([
            'owner_links_lanchar_key' => $launcher->links_lanchar_key,
            'priority' => -6,
            'is_visible' => false,
        ]);
        $deletedLink = $this->createLink($launcher, -7);
        $deletedLink->delete();

        $expectedLinkKeys = [
            $negative->link_key,
            $zeroNewer->link_key,
            $zeroOlder->link_key,
            $positive->link_key,
            $unrankedNewer->link_key,
            $unrankedOlder->link_key,
        ];
        $url = '/links-lanchars/'.$launcher->links_lanchar_key;

        $this->get($url.'?selectedLinkKey='.$zeroOlder->link_key)
            ->assertOk()
            ->assertInertia(fn (Assert $props) => $props
                ->where('selectedLinkKey', $zeroOlder->link_key)
                ->where('linkList.links', fn ($links): bool => array_column($links->all(), 'linkKey') === $expectedLinkKeys)
                ->etc()
            );

        foreach (['invalid', $foreignLink->link_key, $hiddenLink->link_key, $deletedLink->link_key] as $invalidKey) {
            $this->get($url.'?selectedLinkKey='.$invalidKey)
                ->assertOk()
                ->assertInertia(fn (Assert $props) => $props
                    ->where('selectedLinkKey', $negative->link_key)
                    ->etc()
                );
        }
    }

    public function test_a_public_empty_launcher_is_distinct_from_a_missing_launcher(): void
    {
        $launcher = LinksLanchar::query()->create();

        $this->get('/links-lanchars/'.$launcher->links_lanchar_key)
            ->assertOk()
            ->assertInertia(fn (Assert $props) => $props
                ->component('LinksLanchar/Show', false)
                ->where('linksLanchar.title', null)
                ->where('linksLanchar.description', null)
                ->where('selectedLinkKey', null)
                ->has('linkList.links', 0)
                ->etc()
            );

        foreach (['not-a-uuid', (string) Str::uuid()] as $invalidKey) {
            $this->get('/links-lanchars/'.$invalidKey)
                ->assertNotFound()
                ->assertDontSee('LinksLanchar/Unavailable');
        }
    }

    public function test_a_non_public_launcher_does_not_expose_its_content(): void
    {
        $launcher = LinksLanchar::query()->create([
            'title' => 'private-launcher-title',
            'description' => 'private-launcher-description',
        ]);
        Link::query()->create([
            'owner_links_lanchar_key' => $launcher->links_lanchar_key,
            'title' => 'private-link-title',
            'selection_image_reference' => '/images/private-selection.gif',
        ]);
        $launcher->delete();

        $this->get('/links-lanchars/'.$launcher->links_lanchar_key)
            ->assertNotFound()
            ->assertDontSee(['private-launcher-title', 'private-launcher-description', 'private-link-title', 'private-selection.gif'])
            ->assertInertia(fn (Assert $props) => $props
                ->component('LinksLanchar/Unavailable', false)
                ->missing('linksLanchar')
                ->missing('selectedLinkKey')
                ->missing('linkList')
                ->missing('navigation')
                ->etc()
            );
    }

    public function test_a_link_can_open_another_launcher_and_its_url_is_removed_after_soft_deletion(): void
    {
        $launcher = LinksLanchar::query()->create(['title' => '入口']);
        $destination = LinksLanchar::query()->create(['title' => '次の一覧']);
        $destinationLink = $this->createLink($destination);
        $link = Link::query()->create([
            'owner_links_lanchar_key' => $launcher->links_lanchar_key,
            'destination_links_lanchar_key' => $destination->links_lanchar_key,
        ]);
        $launcherUrl = '/links-lanchars/'.$launcher->links_lanchar_key;
        $destinationUrl = '/links-lanchars/'.$destination->links_lanchar_key;

        $this->get($launcherUrl)
            ->assertOk()
            ->assertInertia(fn (Assert $props) => $props
                ->where('linkList.links.0.destinationUrl', fn (string $url): bool => parse_url($url, PHP_URL_PATH) === $destinationUrl)
                ->etc()
            );

        $this->get($destinationUrl)
            ->assertOk()
            ->assertInertia(fn (Assert $props) => $props
                ->where('linkList.links.0.linkKey', $destinationLink->link_key)
                ->where('linkList.links.0.destinationUrl', null)
                ->etc()
            );

        $destination->delete();
        $this->get($launcherUrl)
            ->assertOk()
            ->assertInertia(fn (Assert $props) => $props
                ->where('linkList.links.0.linkKey', $link->link_key)
                ->where('linkList.links.0.destinationUrl', null)
                ->etc()
            );
    }

    public function test_saved_page_urls_can_be_external_and_rejected_urls_keep_the_link_visible(): void
    {
        $launcher = LinksLanchar::query()->create();
        $page = LinkPage::query()->create(['url' => 'https://example.test/stage']);
        $link = Link::query()->create([
            'owner_links_lanchar_key' => $launcher->links_lanchar_key,
            'destination_page_id' => $page->getKey(),
        ]);
        $url = '/links-lanchars/'.$launcher->links_lanchar_key;

        $this->get($url)
            ->assertOk()
            ->assertInertia(fn (Assert $props) => $props
                ->where('linkList.links.0.destinationUrl', $page->url)
                ->etc()
            );

        foreach (['javascript:blocked', '//example.test/stage', "/projects\t", '/projects\\stage'] as $invalidUrl) {
            $page->update(['url' => $invalidUrl]);
            $this->get($url)
                ->assertOk()
                ->assertInertia(fn (Assert $props) => $props
                    ->has('linkList.links', 1)
                    ->where('linkList.links.0.linkKey', $link->link_key)
                    ->where('linkList.links.0.destinationUrl', null)
                    ->etc()
                );
        }

        $page->delete();
        $this->get($url)
            ->assertOk()
            ->assertInertia(fn (Assert $props) => $props
                ->where('linkList.links.0.linkKey', $link->link_key)
                ->where('linkList.links.0.destinationUrl', null)
                ->etc()
            );
    }

    public function test_display_props_resolve_image_priority_and_sphere_fallback_without_changing_saved_values(): void
    {
        $launcher = LinksLanchar::query()->create();
        $assetRoot = '/images/links-lanchar/portfolio/api-discovery-hub/';
        $imageLink = Link::query()->create([
            'owner_links_lanchar_key' => $launcher->links_lanchar_key,
            'title' => '画像付き',
            'selection_image_reference' => $assetRoot.'selection-v1.gif',
            'selection_image_poster_reference' => $assetRoot.'selection-poster-v1.png',
            'icon_image_reference' => $assetRoot.'icon-globe-search-v1.png',
            'lucide_icon_name' => 'Globe2',
            'background_image_reference' => $assetRoot.'background-v1.gif',
            'background_image_poster_reference' => $assetRoot.'background-poster-v1.png',
            'priority' => 0,
        ]);
        $sphereLink = Link::query()->create([
            'owner_links_lanchar_key' => $launcher->links_lanchar_key,
            'sphere_color' => '#4ade80',
            'selection_image_poster_reference' => $assetRoot.'selection-poster-v1.png',
            'background_image_poster_reference' => $assetRoot.'background-poster-v1.png',
            'priority' => 1,
        ]);
        $sphereLink->forceFill(['updated_at' => '2026-11-23 00:15:00'])->save();

        $this->get('/links-lanchars/'.$launcher->links_lanchar_key)
            ->assertOk()
            ->assertInertia(fn (Assert $props) => $props
                ->where('linkList.links.0.linkKey', $imageLink->link_key)
                ->where('linkList.links.0.displayValues.selectionDisplayType', 'image')
                ->where('linkList.links.0.displayValues.selectionImageSource', fn (string $url): bool => parse_url($url, PHP_URL_PATH) === $assetRoot.'selection-v1.gif')
                ->where('linkList.links.0.displayValues.selectionImagePosterSource', fn (string $url): bool => parse_url($url, PHP_URL_PATH) === $assetRoot.'selection-poster-v1.png')
                ->where('linkList.links.0.displayValues.backgroundImageSource', fn (string $url): bool => parse_url($url, PHP_URL_PATH) === $assetRoot.'background-v1.gif')
                ->where('linkList.links.0.displayValues.backgroundImagePosterSource', fn (string $url): bool => parse_url($url, PHP_URL_PATH) === $assetRoot.'background-poster-v1.png')
                ->where('linkList.links.0.displayValues.sphereColor', null)
                ->where('linkList.links.0.displayValues.sphereShadowColor', null)
                ->where('linkList.links.0.displayValues.iconImageSource', null)
                ->where('linkList.links.0.displayValues.lucideIconName', null)
                ->missing('linkList.links.0.isVisible')
                ->missing('linkList.links.0.ownerLinksLancharKey')
                ->where('linkList.links.1.linkKey', $sphereLink->link_key)
                ->where('linkList.links.1.displayValues.title', 'NO_NAME：2026-11-23 00:15')
                ->where('linkList.links.1.displayValues.selectionDisplayType', 'sphere')
                ->where('linkList.links.1.displayValues.sphereColor', '#4ade80')
                ->where('linkList.links.1.displayValues.lucideIconName', 'Link')
                ->where('linkList.links.1.displayValues.selectionImageSource', null)
                ->where('linkList.links.1.displayValues.selectionImagePosterSource', null)
                ->where('linkList.links.1.displayValues.backgroundImageSource', null)
                ->where('linkList.links.1.displayValues.backgroundImagePosterSource', null)
                ->etc()
            );

        $this->assertDatabaseHas('links', [
            'link_key' => $sphereLink->link_key,
            'title' => null,
            'selection_image_reference' => null,
            'selection_image_poster_reference' => $assetRoot.'selection-poster-v1.png',
            'updated_at' => '2026-11-23 00:15:00',
        ]);
    }

    private function createLink(LinksLanchar $launcher, ?int $priority = null, ?string $updatedAt = null): Link
    {
        $link = new Link([
            'owner_links_lanchar_key' => $launcher->links_lanchar_key,
            'priority' => $priority,
        ]);
        if ($updatedAt !== null) {
            $link->updated_at = $updatedAt;
        }
        $link->save();

        return $link;
    }
}
