<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Events\DanceShortsRadar\DanceShortRankingReadModelRefreshRequested;
use App\Jobs\DanceShortsRadar\BuildDanceShortRankingReadModelPatternJob;
use App\Listeners\DanceShortsRadar\RequestDanceShortRankingReadModelRebuildListener;
use App\Models\DanceShortRegion;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class RequestDanceShortRankingReadModelRebuildListenerTest extends TestCase
{
    use RefreshDatabase;

    public function test_listener_dispatches_enabled_ranking_read_model_pattern_jobs(): void
    {
        Queue::fake();
        DanceShortRegion::query()->create([
            'code' => 'JP',
            'name' => '日本',
            'sort_order' => 10,
            'is_active' => true,
        ]);

        app(RequestDanceShortRankingReadModelRebuildListener::class)->handle(
            new DanceShortRankingReadModelRefreshRequested(
                source: 'video_search_completed',
                requestedAt: CarbonImmutable::parse('2026-06-01 12:00:00', 'Asia/Tokyo'),
            ),
        );

        Queue::assertPushed(BuildDanceShortRankingReadModelPatternJob::class, 20);
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
}
