<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Events\DanceShortsRadar\DanceShortRankingReadModelRefreshRequested;
use App\Jobs\DanceShortsRadar\BuildDanceShortRankingReadModelsJob;
use App\Listeners\DanceShortsRadar\RequestDanceShortRankingReadModelRebuildListener;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class RequestDanceShortRankingReadModelRebuildListenerTest extends TestCase
{
    public function test_listener_dispatches_unique_ranking_read_model_build_job(): void
    {
        Queue::fake();

        (new RequestDanceShortRankingReadModelRebuildListener)->handle(
            new DanceShortRankingReadModelRefreshRequested(
                source: 'video_search_completed',
                requestedAt: CarbonImmutable::parse('2026-06-01 12:00:00', 'Asia/Tokyo'),
            ),
        );

        Queue::assertPushed(BuildDanceShortRankingReadModelsJob::class);
    }
}
