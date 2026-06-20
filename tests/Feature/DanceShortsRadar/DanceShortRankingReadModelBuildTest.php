<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Commands\BuildDanceShortRankingReadModelsAction;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelSortKey;
use App\Models\DanceShortRegion;
use App\Models\DanceShortVideo;
use App\Models\DanceShortVideoSnapshot;
use App\Repositories\DanceShortsRadar\DanceShortRankingReadModelRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DanceShortRankingReadModelBuildTest extends TestCase
{
    use RefreshDatabase;

    public function test_build_generates_all_patterns_and_uses_internal_rising_sort_key(): void
    {
        $jp = $this->region('JP', '日本', 10);
        $us = $this->region('US', 'アメリカ', 20);
        $this->region('KR', '韓国', 30);

        $this->rankingVideoWithDelta($jp, 'jp-read-model-video', 300);
        $this->rankingVideoWithDelta($us, 'us-rising-read-model-video', 500);

        $result = app(BuildDanceShortRankingReadModelsAction::class)->execute();

        $this->assertSame(80, $result->normalPatternCount);
        $this->assertSame(5, $result->risingPatternCount);
        $this->assertSame(85, $result->patternCount());
        $this->assertNotNull(app(DanceShortRankingReadModelRepositoryInterface::class)->activeBuildId());
        $this->assertDatabaseHas('dance_short_radar_ranking_read_models', [
            'build_id' => $result->buildId,
            'scope' => 'JP',
            'comparison_days' => 1,
            'sort_key' => 'view_count_delta',
            'rank' => 1,
            'youtube_video_id' => 'jp-read-model-video',
            'view_count_delta' => 300,
        ]);
        $this->assertDatabaseHas('dance_short_radar_ranking_read_models', [
            'build_id' => $result->buildId,
            'scope' => 'RISING',
            'comparison_days' => 1,
            'sort_key' => RankingReadModelSortKey::RISING,
            'rank' => 1,
            'youtube_video_id' => 'us-rising-read-model-video',
            'source_region_code' => 'US',
            'view_count_delta' => 500,
            'japan_comparison_status' => 'unobserved',
        ]);
        $this->assertSame(0, DB::table('dance_short_radar_ranking_read_models')
            ->where('scope', 'RISING')
            ->whereNull('sort_key')
            ->count());
    }

    public function test_rising_read_model_duplicate_rank_is_rejected_by_unique_index(): void
    {
        $jp = $this->region('JP', '日本', 10);
        $us = $this->region('US', 'アメリカ', 20);

        $this->rankingVideoWithDelta($jp, 'jp-read-model-video', 300);
        $this->rankingVideoWithDelta($us, 'us-rising-read-model-video', 500);

        app(BuildDanceShortRankingReadModelsAction::class)->execute();

        $row = DB::table('dance_short_radar_ranking_read_models')
            ->where('scope', 'RISING')
            ->where('comparison_days', 1)
            ->where('sort_key', RankingReadModelSortKey::RISING)
            ->first();

        $this->assertNotNull($row);

        $duplicate = (array) $row;
        unset($duplicate['id']);

        $this->expectException(QueryException::class);

        DB::table('dance_short_radar_ranking_read_models')->insert($duplicate);
    }

    public function test_build_command_creates_active_build_and_outputs_result_counts(): void
    {
        $jp = $this->region('JP', '日本', 10);
        $this->rankingVideoWithDelta($jp, 'jp-command-read-model-video', 300);

        $this
            ->artisan('dance-shorts-radar:build-ranking-read-models')
            ->expectsOutput('DanceShortsRadar ranking read models built.')
            ->expectsOutputToContain('build_id: ')
            ->expectsOutputToContain('normal_patterns: ')
            ->expectsOutputToContain('rising_patterns: ')
            ->expectsOutputToContain('inserted_rows: ')
            ->assertExitCode(0);

        $this->assertNotNull(app(DanceShortRankingReadModelRepositoryInterface::class)->activeBuildId());
    }

    public function test_successful_build_switches_active_build_and_removes_old_build_rows(): void
    {
        $jp = $this->region('JP', '日本', 10);
        $this->rankingVideoWithDelta($jp, 'old-active-build-video', 100);

        $firstResult = app(BuildDanceShortRankingReadModelsAction::class)->execute();

        $this->rankingVideoWithDelta($jp, 'new-active-build-video', 500);

        $secondResult = app(BuildDanceShortRankingReadModelsAction::class)->execute();

        $this->assertNotSame($firstResult->buildId, $secondResult->buildId);
        $this->assertSame(
            $secondResult->buildId,
            app(DanceShortRankingReadModelRepositoryInterface::class)->activeBuildId(),
        );
        $this->assertSame(0, DB::table('dance_short_radar_ranking_read_models')
            ->where('build_id', $firstResult->buildId)
            ->count());
        $this->assertDatabaseHas('dance_short_radar_ranking_read_models', [
            'build_id' => $secondResult->buildId,
            'scope' => 'JP',
            'sort_key' => 'view_count_delta',
            'rank' => 1,
            'youtube_video_id' => 'new-active-build-video',
        ]);
    }

    public function test_failed_build_keeps_previous_active_build_and_rows(): void
    {
        $jp = $this->region('JP', '日本', 10);
        $this->rankingVideoWithDelta($jp, 'stable-active-build-video', 100);

        $activeResult = app(BuildDanceShortRankingReadModelsAction::class)->execute();
        $repository = app(DanceShortRankingReadModelRepositoryInterface::class);
        $failedBuildId = '00000000-0000-0000-0000-000000000999';

        $repository->beginBuild(
            buildId: $failedBuildId,
            calculatedAt: CarbonImmutable::parse('2026-06-01 13:00:00', 'Asia/Tokyo'),
        );
        $repository->markBuildFailed($failedBuildId);

        $this->assertSame($activeResult->buildId, $repository->activeBuildId());
        $this->assertGreaterThan(0, DB::table('dance_short_radar_ranking_read_models')
            ->where('build_id', $activeResult->buildId)
            ->count());
        $this->assertSame(0, DB::table('dance_short_radar_ranking_read_models')
            ->where('build_id', $failedBuildId)
            ->count());
    }

    private function region(string $code, string $name, int $sortOrder): DanceShortRegion
    {
        return DanceShortRegion::query()->create([
            'code' => $code,
            'name' => $name,
            'sort_order' => $sortOrder,
            'is_active' => true,
        ]);
    }

    private function video(string $youtubeVideoId): DanceShortVideo
    {
        return DanceShortVideo::query()->create([
            'youtube_video_id' => $youtubeVideoId,
            'title' => $youtubeVideoId,
            'channel_title' => 'Dance Channel',
            'thumbnail_url' => 'https://example.test/thumb.jpg',
            'published_at' => '2026-05-30 09:00:00',
            'url' => 'https://www.youtube.com/shorts/'.$youtubeVideoId,
            'tracking_status' => 'active',
        ]);
    }

    private function rankingVideoWithDelta(
        DanceShortRegion $region,
        string $youtubeVideoId,
        int $delta,
    ): DanceShortVideo {
        $video = $this->video($youtubeVideoId);

        $this->snapshot($video, $region, 1000, '2026-05-31 12:00:00');
        $this->snapshot($video, $region, 1000 + $delta, '2026-06-01 12:00:00');

        return $video;
    }

    private function snapshot(
        DanceShortVideo $video,
        DanceShortRegion $region,
        int $viewCount,
        string $collectedAt,
    ): DanceShortVideoSnapshot {
        return DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => $viewCount,
            'collected_at' => $collectedAt,
        ]);
    }
}
