<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Models\DanceShortRegion;
use App\Models\DanceShortSearchKeyword;
use App\Models\DanceShortVideo;
use App\Models\DanceShortVideoCategory;
use App\Models\DanceShortVideoSnapshot;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\DanceShortRegionSeeder;
use Database\Seeders\DanceShortSearchKeywordSeeder;
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
        $this->assertTrue(Schema::hasTable('dance_short_video_snapshots'));

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

        $usRegion = DanceShortRegion::query()->where('code', 'US')->firstOrFail();
        DanceShortSearchKeyword::query()->create([
            'region_id' => $usRegion->getKey(),
            'keyword' => 'dance shorts',
            'sort_order' => 10,
            'is_active' => true,
        ]);

        $this->seed(DanceShortSearchKeywordSeeder::class);

        /*
         * DanceShortSearchKeywordSeeder は地域ごとに既存 keyword を整理してから投入します。
         * 再実行しても古い keyword や重複 keyword が残らないことを固定します。
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
                '踊ってみた shorts',
                '踊ってみた',
                'TikTok 踊ってみた shorts',
            ],
            'US' => [
                'dance cover shorts',
                'dance cover',
                'TikTok dance cover shorts',
            ],
            'KR' => [
                '커버댄스 shorts',
                '커버댄스',
                '틱톡 커버댄스 shorts',
            ],
        ];

        $this->assertSame(9, DanceShortSearchKeyword::query()->count());
        $this->assertDatabaseMissing('dance_short_search_keywords', [
            'keyword' => 'dance shorts',
        ]);

        foreach ($expectedKeywordsByRegionCode as $regionCode => $expectedKeywords) {
            $region = DanceShortRegion::query()->where('code', $regionCode)->firstOrFail();
            $keywords = DanceShortSearchKeyword::query()
                ->where('region_id', $region->getKey())
                ->orderBy('sort_order')
                ->pluck('keyword')
                ->all();

            $this->assertSame($expectedKeywords, $keywords);

            foreach ($expectedKeywords as $index => $keyword) {
                $this->assertDatabaseHas('dance_short_search_keywords', [
                    'region_id' => $region->getKey(),
                    'keyword' => $keyword,
                    'sort_order' => ($index + 1) * 10,
                    'is_active' => true,
                ]);
            }
        }
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
}
