<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Commands\BuildDanceShortRankingReadModelPatternAction;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelBuildStatus;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelPatternDefinitionDTO;
use App\Factories\DanceShortsRadar\DanceShortRankingReadModelStrategyFactory;
use App\Jobs\DanceShortsRadar\BuildDanceShortRankingReadModelPatternJob;
use App\Models\DanceShortRegion;
use App\Models\DanceShortVideo;
use App\Models\DanceShortVideoSnapshot;
use App\Repositories\DanceShortsRadar\DanceShortRankingReadModelRepository;
use App\Repositories\DanceShortsRadar\DanceShortRankingReadModelRepositoryInterface;
use App\Repositories\DanceShortsRadar\DanceShortSearchTargetRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortRankingReadModelBuildLifecycleService;
use App\Services\DanceShortsRadar\DanceShortRankingReadModelPatternService;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use InvalidArgumentException;
use RuntimeException;
use Tests\TestCase;

class DanceShortRankingReadModelBuildTest extends TestCase
{
    use RefreshDatabase;

    private const PATTERN_KEY = 'normal|JP|1|view_count_delta';

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        Cache::flush();

        parent::tearDown();
    }

    public function test_pattern_build_sorts_limits_and_saves_configured_max_rows(): void
    {
        $jp = $this->region('JP', '日本', 10);

        foreach (range(1, 501) as $delta) {
            $this->rankingVideoWithDelta(
                region: $jp,
                youtubeVideoId: sprintf('jp-limit-%03d', $delta),
                delta: $delta,
            );
        }

        $result = app(BuildDanceShortRankingReadModelPatternAction::class)->execute(self::PATTERN_KEY);

        $this->assertFalse($result->skipped);
        $this->assertSame(500, $result->maxRows);
        $this->assertSame(500, $result->insertedRowCount);
        $this->assertDatabaseHas('dance_short_radar_ranking_read_model_builds', [
            'pattern_build_id' => $result->patternBuildId,
            'pattern_key' => self::PATTERN_KEY,
            'max_rows' => 500,
            'status' => RankingReadModelBuildStatus::ACTIVE,
            'inserted_count' => 500,
        ]);
        $this->assertSame(500, DB::table('dance_short_radar_ranking_read_models')
            ->where('pattern_build_id', $result->patternBuildId)
            ->count());
        $this->assertDatabaseHas('dance_short_radar_ranking_read_models', [
            'pattern_build_id' => $result->patternBuildId,
            'rank' => 1,
            'youtube_video_id' => 'jp-limit-501',
            'view_count_delta' => 501,
        ]);
        $this->assertDatabaseHas('dance_short_radar_ranking_read_models', [
            'pattern_build_id' => $result->patternBuildId,
            'rank' => 500,
            'youtube_video_id' => 'jp-limit-002',
            'view_count_delta' => 2,
        ]);
        $this->assertDatabaseMissing('dance_short_radar_ranking_read_models', [
            'pattern_build_id' => $result->patternBuildId,
            'youtube_video_id' => 'jp-limit-001',
        ]);
    }

    public function test_pattern_build_requires_configured_max_rows_without_full_fallback(): void
    {
        $this->region('JP', '日本', 10);
        Config::set('dance_short.ranking_read_model.pattern_max_rows', []);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Undefined ranking read model pattern');

        try {
            app(BuildDanceShortRankingReadModelPatternAction::class)->execute(self::PATTERN_KEY);
        } finally {
            $this->assertSame(0, DB::table('dance_short_radar_ranking_read_model_builds')->count());
            $this->assertSame(0, DB::table('dance_short_radar_ranking_read_models')->count());
        }
    }

    public function test_pattern_build_only_creates_requested_scope_days_and_sort_key(): void
    {
        $jp = $this->region('JP', '日本', 10);
        $us = $this->region('US', 'アメリカ', 20);
        $this->rankingVideoWithDelta($jp, 'jp-single-pattern-video', 300);
        $this->rankingVideoWithDelta($us, 'us-not-requested-pattern-video', 900);

        $result = app(BuildDanceShortRankingReadModelPatternAction::class)->execute(self::PATTERN_KEY);
        $repository = app(DanceShortRankingReadModelRepositoryInterface::class);

        $this->assertSame($result->patternBuildId, $repository->activePatternBuildId('JP', 1, 'view_count_delta'));
        $this->assertNull($repository->activePatternBuildId('US', 1, 'view_count_delta'));
        $this->assertNull($repository->activePatternBuildId('JP', 1, 'views_per_hour'));
        $this->assertSame(1, DB::table('dance_short_radar_ranking_read_model_builds')->count());
        $this->assertSame(1, DB::table('dance_short_radar_ranking_read_models')->count());
        $this->assertDatabaseHas('dance_short_radar_ranking_read_models', [
            'pattern_build_id' => $result->patternBuildId,
            'scope' => 'JP',
            'comparison_days' => 1,
            'sort_key' => 'view_count_delta',
            'youtube_video_id' => 'jp-single-pattern-video',
        ]);
    }

    public function test_dispatch_command_dispatches_enabled_region_patterns_only(): void
    {
        Queue::fake();
        $this->region('JP', '日本', 10);
        $this->region('US', 'アメリカ', 20);
        $this->region('KR', '韓国', 30);

        $this
            ->artisan('dance-shorts-radar:dispatch-ranking-read-model-patterns')
            ->expectsOutput('DanceShortsRadar ranking read model pattern jobs dispatched.')
            ->expectsOutput('normal_patterns: 60')
            ->expectsOutput('dispatched_patterns: 60')
            ->assertExitCode(0);

        Queue::assertPushed(BuildDanceShortRankingReadModelPatternJob::class, 60);
        Queue::assertPushed(
            BuildDanceShortRankingReadModelPatternJob::class,
            fn (BuildDanceShortRankingReadModelPatternJob $job): bool => $job->patternKey === 'normal|JP|1|views_per_hour',
        );
        Queue::assertNotPushed(
            BuildDanceShortRankingReadModelPatternJob::class,
            fn (BuildDanceShortRankingReadModelPatternJob $job): bool => str_contains($job->patternKey, '|ALL|')
                || str_contains($job->patternKey, 'RISING'),
        );
    }

    public function test_legacy_build_command_dispatches_pattern_jobs_without_generating_rows(): void
    {
        Queue::fake();
        $this->region('JP', '日本', 10);

        $this
            ->artisan('dance-shorts-radar:build-ranking-read-models')
            ->expectsOutput('DanceShortsRadar ranking read model pattern jobs dispatched.')
            ->expectsOutput('normal_patterns: 20')
            ->expectsOutput('dispatched_patterns: 20')
            ->assertExitCode(0);

        Queue::assertPushed(BuildDanceShortRankingReadModelPatternJob::class, 20);
        $this->assertSame(0, DB::table('dance_short_radar_ranking_read_model_builds')->count());
        $this->assertSame(0, DB::table('dance_short_radar_ranking_read_models')->count());
    }

    public function test_pattern_command_builds_single_pattern(): void
    {
        $jp = $this->region('JP', '日本', 10);
        $this->rankingVideoWithDelta($jp, 'jp-command-pattern-video', 300);

        $this
            ->artisan('dance-shorts-radar:build-ranking-read-model-pattern', [
                '--type' => 'normal',
                '--scope' => 'JP',
                '--comparison-days' => 1,
                '--sort-key' => 'view_count_delta',
            ])
            ->expectsOutput('DanceShortsRadar ranking read model pattern built.')
            ->expectsOutputToContain('pattern_build_id: ')
            ->expectsOutput('pattern_key: '.self::PATTERN_KEY)
            ->expectsOutput('max_rows: 500')
            ->expectsOutput('inserted_rows: 1')
            ->assertExitCode(0);

        $this->assertNotNull(app(DanceShortRankingReadModelRepositoryInterface::class)
            ->activePatternBuildId('JP', 1, 'view_count_delta'));
    }

    public function test_successful_pattern_build_supersedes_only_same_pattern_and_keeps_other_pattern_active(): void
    {
        $jp = $this->region('JP', '日本', 10);
        $this->rankingVideoWithDelta($jp, 'old-delta-pattern-video', 100);

        $firstDelta = app(BuildDanceShortRankingReadModelPatternAction::class)->execute(self::PATTERN_KEY);
        $otherPattern = app(BuildDanceShortRankingReadModelPatternAction::class)->execute('normal|JP|1|views_per_hour');

        $this->rankingVideoWithDelta($jp, 'new-delta-pattern-video', 500);
        $secondDelta = app(BuildDanceShortRankingReadModelPatternAction::class)->execute(self::PATTERN_KEY);

        $this->assertNotSame($firstDelta->patternBuildId, $secondDelta->patternBuildId);
        $this->assertDatabaseHas('dance_short_radar_ranking_read_model_builds', [
            'pattern_build_id' => $firstDelta->patternBuildId,
            'status' => RankingReadModelBuildStatus::SUPERSEDED,
        ]);
        $this->assertDatabaseHas('dance_short_radar_ranking_read_model_builds', [
            'pattern_build_id' => $secondDelta->patternBuildId,
            'status' => RankingReadModelBuildStatus::ACTIVE,
        ]);
        $this->assertDatabaseHas('dance_short_radar_ranking_read_model_builds', [
            'pattern_build_id' => $otherPattern->patternBuildId,
            'status' => RankingReadModelBuildStatus::ACTIVE,
        ]);
        $this->assertSame(0, DB::table('dance_short_radar_ranking_read_models')
            ->where('pattern_build_id', $firstDelta->patternBuildId)
            ->count());
        $this->assertGreaterThan(0, DB::table('dance_short_radar_ranking_read_models')
            ->where('pattern_build_id', $otherPattern->patternBuildId)
            ->count());
        $this->assertDatabaseHas('dance_short_radar_ranking_read_models', [
            'pattern_build_id' => $secondDelta->patternBuildId,
            'rank' => 1,
            'youtube_video_id' => 'new-delta-pattern-video',
        ]);
    }

    public function test_failed_pattern_build_keeps_previous_active_pattern_and_removes_partial_rows(): void
    {
        $jp = $this->region('JP', '日本', 10);
        $this->rankingVideoWithDelta($jp, 'stable-active-pattern-video', 100);
        $activeResult = app(BuildDanceShortRankingReadModelPatternAction::class)->execute(self::PATTERN_KEY);
        $this->rankingVideoWithDelta($jp, 'partial-failure-pattern-video', 500);

        $failingRepository = new class extends DanceShortRankingReadModelRepository
        {
            public ?string $begunPatternBuildId = null;

            public function beginPatternBuild(
                RankingReadModelPatternDefinitionDTO $definition,
                string $patternBuildId,
                CarbonInterface $calculatedAt,
            ): void {
                $this->begunPatternBuildId = $patternBuildId;

                parent::beginPatternBuild($definition, $patternBuildId, $calculatedAt);
            }

            public function activatePatternBuild(string $patternBuildId, string $patternKey, int $insertedCount): void
            {
                throw new RuntimeException('forced activation failure');
            }
        };

        $this->expectException(RuntimeException::class);

        try {
            $this->buildActionWithRepository($failingRepository)->execute(self::PATTERN_KEY);
        } finally {
            $this->assertNotNull($failingRepository->begunPatternBuildId);
            $this->assertSame(
                $activeResult->patternBuildId,
                app(DanceShortRankingReadModelRepositoryInterface::class)->activePatternBuildId('JP', 1, 'view_count_delta'),
            );
            $this->assertDatabaseHas('dance_short_radar_ranking_read_model_builds', [
                'pattern_build_id' => $failingRepository->begunPatternBuildId,
                'status' => RankingReadModelBuildStatus::FAILED,
            ]);
            $this->assertSame(0, DB::table('dance_short_radar_ranking_read_models')
                ->where('pattern_build_id', $failingRepository->begunPatternBuildId)
                ->count());
        }
    }

    public function test_zero_row_pattern_build_is_not_activated_and_is_marked_failed(): void
    {
        $this->region('JP', '日本', 10);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Ranking read model pattern build produced no rows.');

        try {
            app(BuildDanceShortRankingReadModelPatternAction::class)->execute(self::PATTERN_KEY);
        } finally {
            $this->assertNull(app(DanceShortRankingReadModelRepositoryInterface::class)
                ->activePatternBuildId('JP', 1, 'view_count_delta'));
            $this->assertSame(1, DB::table('dance_short_radar_ranking_read_model_builds')
                ->where('status', RankingReadModelBuildStatus::FAILED)
                ->count());
            $this->assertSame(0, DB::table('dance_short_radar_ranking_read_models')->count());
        }
    }

    public function test_pattern_build_skips_without_creating_build_when_lock_is_unavailable(): void
    {
        $this->region('JP', '日本', 10);
        $lifecycleService = app(DanceShortRankingReadModelBuildLifecycleService::class);
        $lock = Cache::lock($lifecycleService->lockNameForPattern(self::PATTERN_KEY), $lifecycleService->lockTtlSeconds());

        $this->assertTrue($lock->get());

        try {
            $result = app(BuildDanceShortRankingReadModelPatternAction::class)->execute(self::PATTERN_KEY);
        } finally {
            $lock->release();
        }

        $this->assertTrue($result->skipped);
        $this->assertSame(DanceShortRankingReadModelBuildLifecycleService::SKIP_REASON_LOCK_UNAVAILABLE, $result->skipReason);
        $this->assertSame(0, DB::table('dance_short_radar_ranking_read_model_builds')->count());
    }

    public function test_recent_building_pattern_skips_without_touching_other_patterns(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-01 12:10:00', 'Asia/Tokyo'));
        $this->region('JP', '日本', 10);
        $definition = app(DanceShortRankingReadModelPatternService::class)->definitionForKey(self::PATTERN_KEY);

        app(DanceShortRankingReadModelRepositoryInterface::class)->beginPatternBuild(
            definition: $definition,
            patternBuildId: '00000000-0000-0000-0000-000000000101',
            calculatedAt: CarbonImmutable::parse('2026-06-01 12:00:00', 'Asia/Tokyo'),
        );

        $result = app(BuildDanceShortRankingReadModelPatternAction::class)->execute(self::PATTERN_KEY);

        $this->assertTrue($result->skipped);
        $this->assertSame(DanceShortRankingReadModelBuildLifecycleService::SKIP_REASON_BUILDING_IN_PROGRESS, $result->skipReason);
        $this->assertSame(1, DB::table('dance_short_radar_ranking_read_model_builds')
            ->where('status', RankingReadModelBuildStatus::BUILDING)
            ->count());
    }

    public function test_stale_building_pattern_is_failed_before_new_pattern_build_starts(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-01 12:00:00', 'Asia/Tokyo'));
        $jp = $this->region('JP', '日本', 10);
        $this->rankingVideoWithDelta($jp, 'stale-cleanup-new-pattern-video', 300);
        $definition = app(DanceShortRankingReadModelPatternService::class)->definitionForKey(self::PATTERN_KEY);

        app(DanceShortRankingReadModelRepositoryInterface::class)->beginPatternBuild(
            definition: $definition,
            patternBuildId: '00000000-0000-0000-0000-000000000202',
            calculatedAt: CarbonImmutable::parse('2026-06-01 11:29:00', 'Asia/Tokyo'),
        );

        $result = app(BuildDanceShortRankingReadModelPatternAction::class)->execute(self::PATTERN_KEY);

        $this->assertFalse($result->skipped);
        $this->assertSame(1, $result->staleFailedBuildCount);
        $this->assertDatabaseHas('dance_short_radar_ranking_read_model_builds', [
            'pattern_build_id' => '00000000-0000-0000-0000-000000000202',
            'status' => RankingReadModelBuildStatus::FAILED,
        ]);
        $this->assertSame($result->patternBuildId, app(DanceShortRankingReadModelRepositoryInterface::class)
            ->activePatternBuildId('JP', 1, 'view_count_delta'));
    }

    private function buildActionWithRepository(
        DanceShortRankingReadModelRepositoryInterface $repository,
    ): BuildDanceShortRankingReadModelPatternAction {
        return new BuildDanceShortRankingReadModelPatternAction(
            searchTargetRepository: app(DanceShortSearchTargetRepositoryInterface::class),
            strategyFactory: app(DanceShortRankingReadModelStrategyFactory::class),
            readModelRepository: $repository,
            lifecycleService: app(DanceShortRankingReadModelBuildLifecycleService::class),
            patternService: app(DanceShortRankingReadModelPatternService::class),
        );
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
