<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Enums\DanceShortsRadar\DanceShortSearchScope;
use App\Models\DanceShortRegion;
use App\Models\DanceShortSearchKeyword;
use App\Models\DanceShortVideo;
use App\Models\DanceShortVideoCategory;
use App\Models\DanceShortVideoRegion;
use App\Models\DanceShortVideoSnapshot;
use Database\Seeders\DanceShortRegionSeeder;
use Database\Seeders\DanceShortSearchKeywordSeeder;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DanceShortDatabaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_dance_short_tables_exist_without_growth_delta_columns(): void
    {
        $this->assertTrue(Schema::hasTable('dance_short_regions'));
        $this->assertTrue(Schema::hasTable('dance_short_search_keywords'));
        $this->assertTrue(Schema::hasTable('dance_short_video_categories'));
        $this->assertTrue(Schema::hasTable('dance_short_videos'));
        $this->assertTrue(Schema::hasTable('dance_short_video_regions'));
        $this->assertTrue(Schema::hasTable('dance_short_video_snapshots'));

        $this->assertFalse(Schema::hasColumn('dance_short_videos', 'region_id'));
        $this->assertFalse(Schema::hasColumn('dance_short_video_snapshots', 'view_count_delta'));
        $this->assertFalse(Schema::hasColumn('dance_short_video_snapshots', 'view_growth_rate'));
        $this->assertFalse(Schema::hasColumn('dance_short_videos', 'view_count'));
        $this->assertFalse(Schema::hasColumn('dance_short_videos', 'like_count'));
        $this->assertFalse(Schema::hasColumn('dance_short_videos', 'comment_count'));
        $this->assertFalse(Schema::hasColumn('dance_short_videos', 'favorite_count'));
        $this->assertFalse(Schema::hasColumn('dance_short_videos', 'category_name'));
        $this->assertFalse(Schema::hasColumn('dance_short_video_snapshots', 'favorite_count'));
        $this->assertTrue(Schema::hasColumn('dance_short_videos', 'tracking_status'));
        $this->assertTrue(Schema::hasColumn('dance_short_videos', 'tracking_disabled_at'));
        $this->assertTrue(Schema::hasColumn('dance_short_videos', 'archived_at'));
        $this->assertTrue(Schema::hasColumn('dance_short_videos', 'tracking_reason'));
        $this->assertTrue(Schema::hasColumn('dance_short_search_keywords', 'search_scope'));
        $this->assertTrue(Schema::hasColumn('dance_short_search_keywords', 'max_search_pages'));
        $this->assertTrue(Schema::hasColumn('dance_short_video_regions', 'video_id'));
        $this->assertTrue(Schema::hasColumn('dance_short_video_regions', 'region_id'));
        $this->assertTrue(Schema::hasColumn('dance_short_video_regions', 'first_detected_at'));
        $this->assertTrue(Schema::hasColumn('dance_short_video_regions', 'last_detected_at'));
    }

    public function test_ranking_read_model_tables_use_pattern_build_schema(): void
    {
        $this->assertTrue(Schema::hasTable('dance_short_radar_ranking_read_model_builds'));
        $this->assertTrue(Schema::hasTable('dance_short_radar_ranking_read_models'));

        foreach ([
            'pattern_build_id',
            'pattern_key',
            'ranking_type',
            'scope',
            'comparison_days',
            'sort_key',
            'max_rows',
            'status',
            'calculated_at',
            'activated_at',
            'inserted_count',
            'error_message',
        ] as $column) {
            $this->assertTrue(Schema::hasColumn('dance_short_radar_ranking_read_model_builds', $column));
        }

        foreach ([
            'pattern_build_id',
            'pattern_key',
            'ranking_type',
            'scope',
            'comparison_days',
            'sort_key',
            'rank',
            'video_id',
            'current_view_count',
            'previous_view_count',
            'view_count_delta',
            'view_growth_rate',
            'views_per_hour',
            'japan_current_view_count',
            'japan_previous_view_count',
            'japan_view_count_delta',
            'japan_view_growth_rate',
            'japan_views_per_hour',
            'japan_comparison_status',
            'calculated_at',
        ] as $column) {
            $this->assertTrue(Schema::hasColumn('dance_short_radar_ranking_read_models', $column));
        }

        $this->assertFalse(Schema::hasColumn('dance_short_radar_ranking_read_model_builds', 'build_id'));
        $this->assertFalse(Schema::hasColumn('dance_short_radar_ranking_read_models', 'build_id'));
    }

    public function test_region_and_keyword_seeders_create_minimum_observation_data(): void
    {
        $this->seed(DanceShortRegionSeeder::class);

        /*
         * DanceShortRegionSeeder は code unique 制約を前提に updateOrCreate するため、
         * 複数回実行しても JP / US / KR が重複しないことをここで固定します。
         */
        $this->seed(DanceShortRegionSeeder::class);

        $this->assertSame(3, DanceShortRegion::query()->count());

        $this->seed(DanceShortSearchKeywordSeeder::class);

        /*
         * DanceShortSearchKeywordSeeder は region / keyword 単位で updateOrCreate します。
         * 再実行しても9件の標準 keyword が重複しないことを固定します。
         */
        $this->seed(DanceShortSearchKeywordSeeder::class);

        $this->assertDatabaseHas('dance_short_regions', [
            'code' => 'JP',
            'name' => '日本',
            'sort_order' => 10,
            'is_active' => true,
        ]);
        $this->assertDatabaseHas('dance_short_regions', [
            'code' => 'US',
            'name' => 'アメリカ',
            'sort_order' => 20,
            'is_active' => true,
        ]);
        $this->assertDatabaseHas('dance_short_regions', [
            'code' => 'KR',
            'name' => '韓国',
            'sort_order' => 30,
            'is_active' => true,
        ]);
        $this->assertSame(3, DanceShortRegion::query()->count());

        $expectedKeywordsByRegionCode = [
            'JP' => [
                ['keyword' => '踊ってみた shorts', 'scope' => DanceShortSearchScope::Standard, 'pages' => 1],
                ['keyword' => '踊ってみた', 'scope' => DanceShortSearchScope::Expanded, 'pages' => 2],
                ['keyword' => 'TikTok 踊ってみた shorts', 'scope' => DanceShortSearchScope::Standard, 'pages' => 1],
            ],
            'US' => [
                ['keyword' => 'dance cover shorts', 'scope' => DanceShortSearchScope::Standard, 'pages' => 1],
                ['keyword' => 'dance cover', 'scope' => DanceShortSearchScope::Expanded, 'pages' => 2],
                ['keyword' => 'TikTok dance cover shorts', 'scope' => DanceShortSearchScope::Standard, 'pages' => 1],
            ],
            'KR' => [
                ['keyword' => '커버댄스 shorts', 'scope' => DanceShortSearchScope::Standard, 'pages' => 1],
                ['keyword' => '커버댄스', 'scope' => DanceShortSearchScope::Expanded, 'pages' => 2],
                ['keyword' => '틱톡 커버댄스 shorts', 'scope' => DanceShortSearchScope::Standard, 'pages' => 1],
            ],
        ];

        $this->assertSame(9, DanceShortSearchKeyword::query()->count());
        $this->assertSame(3, DanceShortSearchKeyword::query()
            ->where('search_scope', DanceShortSearchScope::Expanded->value)
            ->where('max_search_pages', 2)
            ->count());
        $this->assertSame(6, DanceShortSearchKeyword::query()
            ->where('search_scope', DanceShortSearchScope::Standard->value)
            ->where('max_search_pages', 1)
            ->count());

        foreach ($expectedKeywordsByRegionCode as $regionCode => $expectedKeywordDefinitions) {
            $region = DanceShortRegion::query()->where('code', $regionCode)->firstOrFail();
            $keywords = DanceShortSearchKeyword::query()
                ->where('region_id', $region->getKey())
                ->orderBy('sort_order')
                ->pluck('keyword')
                ->all();

            $this->assertSame(array_column($expectedKeywordDefinitions, 'keyword'), $keywords);

            foreach ($expectedKeywordDefinitions as $index => $keywordDefinition) {
                $this->assertDatabaseHas('dance_short_search_keywords', [
                    'region_id' => $region->getKey(),
                    'keyword' => $keywordDefinition['keyword'],
                    'search_scope' => $keywordDefinition['scope']->value,
                    'max_search_pages' => $keywordDefinition['pages'],
                    'sort_order' => ($index + 1) * 10,
                    'is_active' => true,
                ]);
            }
        }
    }

    public function test_search_keyword_defaults_to_standard_single_page_when_scope_is_not_set(): void
    {
        $region = DanceShortRegion::query()->create([
            'code' => 'JP',
            'name' => '日本',
        ]);

        $keyword = DanceShortSearchKeyword::query()->create([
            'region_id' => $region->getKey(),
            'keyword' => 'default scope keyword',
        ]);

        $keyword->refresh();

        $this->assertSame(DanceShortSearchScope::Standard, $keyword->search_scope);
        $this->assertSame(1, $keyword->max_search_pages);
    }

    public function test_keyword_seeder_updates_existing_keywords_without_deleting_other_rows(): void
    {
        $this->seed(DanceShortRegionSeeder::class);
        $jpRegion = DanceShortRegion::query()->where('code', 'JP')->firstOrFail();
        $existingKeyword = DanceShortSearchKeyword::query()->create([
            'region_id' => $jpRegion->getKey(),
            'keyword' => '踊ってみた',
            'search_scope' => DanceShortSearchScope::Standard->value,
            'max_search_pages' => 1,
            'sort_order' => 99,
            'is_active' => false,
        ]);
        DanceShortSearchKeyword::query()->create([
            'region_id' => $jpRegion->getKey(),
            'keyword' => 'manual keep keyword',
            'search_scope' => DanceShortSearchScope::Standard->value,
            'max_search_pages' => 1,
            'sort_order' => 100,
            'is_active' => false,
        ]);

        $this->seed(DanceShortSearchKeywordSeeder::class);

        $existingKeyword->refresh();

        $this->assertSame(DanceShortSearchScope::Expanded, $existingKeyword->search_scope);
        $this->assertSame(2, $existingKeyword->max_search_pages);
        $this->assertSame(20, $existingKeyword->sort_order);
        $this->assertTrue($existingKeyword->is_active);
        $this->assertDatabaseHas('dance_short_search_keywords', [
            'region_id' => $jpRegion->getKey(),
            'keyword' => 'manual keep keyword',
            'is_active' => false,
        ]);
    }

    public function test_database_seeder_calls_dance_short_region_seeder(): void
    {
        /*
         * README の通常セットアップで DatabaseSeeder を使った場合でも、地域マスタ不足で
         * /dance-shorts-radar の region tab が消えないことを Feature 側から固定します。
         */
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseHas('dance_short_regions', [
            'code' => 'JP',
            'name' => '日本',
            'sort_order' => 10,
            'is_active' => true,
        ]);
        $this->assertDatabaseHas('dance_short_regions', [
            'code' => 'US',
            'name' => 'アメリカ',
            'sort_order' => 20,
            'is_active' => true,
        ]);
        $this->assertDatabaseHas('dance_short_regions', [
            'code' => 'KR',
            'name' => '韓国',
            'sort_order' => 30,
            'is_active' => true,
        ]);
    }

    public function test_youtube_video_id_is_unique(): void
    {
        DanceShortVideo::query()->create([
            'youtube_video_id' => 'short-video-001',
            'title' => 'First saved short',
        ]);

        $this->expectException(QueryException::class);

        DanceShortVideo::query()->create([
            'youtube_video_id' => 'short-video-001',
            'title' => 'Duplicate short',
        ]);
    }

    public function test_video_category_keeps_youtube_category_values_and_is_unique_per_region(): void
    {
        DanceShortVideoCategory::query()->create([
            'youtube_category_id' => '10',
            'region_code' => 'JP',
            'title' => 'Music',
            'is_assignable' => false,
        ]);

        $category = DanceShortVideoCategory::query()->where('youtube_category_id', '10')->firstOrFail();

        $this->assertSame('JP', $category->region_code);
        $this->assertSame('Music', $category->title);
        $this->assertFalse($category->is_assignable);

        $this->expectException(QueryException::class);

        DanceShortVideoCategory::query()->create([
            'youtube_category_id' => '10',
            'region_code' => 'JP',
            'title' => 'Duplicate Music',
        ]);
    }

    public function test_video_keeps_youtube_metadata_fields_without_statistics(): void
    {
        $video = DanceShortVideo::query()->create([
            'youtube_video_id' => 'short-video-metadata',
            'title' => 'Metadata target short',
            'description' => 'Dance challenge description.',
            'channel_id' => 'channel-001',
            'channel_title' => 'Dance Channel',
            'thumbnail_url' => 'https://example.test/thumb.jpg',
            'published_at' => '2026-05-31 09:00:00',
            'url' => 'https://www.youtube.com/shorts/short-video-metadata',
            'category_id' => '10',
            'tags' => ['dance', 'shorts'],
            'duration' => 'PT58S',
            'default_language' => 'ja',
            'default_audio_language' => 'ja',
            'live_broadcast_content' => 'none',
            'embeddable' => true,
        ]);

        $video->refresh();

        $this->assertSame('active', $video->tracking_status);
        $this->assertNull($video->tracking_disabled_at);
        $this->assertNull($video->archived_at);
        $this->assertSame('10', $video->category_id);
        $this->assertSame('PT58S', $video->duration);
        $this->assertSame('Dance challenge description.', $video->description);
        $this->assertSame(['dance', 'shorts'], $video->tags);
        $this->assertSame('ja', $video->default_language);
        $this->assertSame('ja', $video->default_audio_language);
        $this->assertSame('none', $video->live_broadcast_content);
        $this->assertTrue($video->embeddable);
    }

    public function test_snapshot_keeps_video_region_and_collected_time(): void
    {
        $region = DanceShortRegion::query()->create([
            'code' => 'JP',
            'name' => '日本',
        ]);
        $video = DanceShortVideo::query()->create([
            'youtube_video_id' => 'short-video-002',
            'title' => 'Snapshot target short',
        ]);

        $snapshot = DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 123456,
            'like_count' => 789,
            'comment_count' => 12,
            'collected_at' => '2026-05-31 10:30:00',
        ]);

        $this->assertSame((int) $video->getKey(), $snapshot->video_id);
        $this->assertSame((int) $region->getKey(), $snapshot->region_id);
        $this->assertSame('2026-05-31 10:30:00', $snapshot->collected_at->format('Y-m-d H:i:s'));

        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 123456,
            'like_count' => 789,
            'comment_count' => 12,
            'collected_at' => '2026-05-31 10:30:00',
        ]);
    }

    public function test_video_region_keeps_video_and_detected_region_relation(): void
    {
        $region = DanceShortRegion::query()->create([
            'code' => 'JP',
            'name' => '日本',
        ]);
        $video = DanceShortVideo::query()->create([
            'youtube_video_id' => 'short-video-region-001',
            'title' => 'Region relation target short',
        ]);

        $relation = DanceShortVideoRegion::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'first_detected_at' => '2026-05-31 10:30:00',
            'last_detected_at' => '2026-05-31 12:30:00',
        ]);

        $this->assertSame((int) $video->getKey(), $relation->video_id);
        $this->assertSame((int) $region->getKey(), $relation->region_id);
        $this->assertSame('2026-05-31 10:30:00', $relation->first_detected_at->format('Y-m-d H:i:s'));
        $this->assertSame('2026-05-31 12:30:00', $relation->last_detected_at->format('Y-m-d H:i:s'));

        $this->assertDatabaseHas('dance_short_video_regions', [
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'first_detected_at' => '2026-05-31 10:30:00',
            'last_detected_at' => '2026-05-31 12:30:00',
        ]);
    }
}
