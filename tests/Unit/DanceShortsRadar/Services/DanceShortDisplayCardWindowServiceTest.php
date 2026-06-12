<?php

namespace Tests\Unit\DanceShortsRadar\Services;

use App\Services\DanceShortsRadar\DanceShortDisplayCardWindowService;
use Tests\TestCase;

class DanceShortDisplayCardWindowServiceTest extends TestCase
{
    public function test_start_rank_is_normalized_to_five_card_window_start(): void
    {
        $service = new DanceShortDisplayCardWindowService;

        $this->assertSame(1, $service->normalizeStartRank(null, 5));
        $this->assertSame(1, $service->normalizeStartRank(0, 5));
        $this->assertSame(1, $service->normalizeStartRank(5, 5));
        $this->assertSame(6, $service->normalizeStartRank(6, 5));
        $this->assertSame(6, $service->normalizeStartRank(8, 5));
        $this->assertSame(11, $service->normalizeStartRank(11, 5));
    }

    public function test_window_size_defaults_to_five_and_rejects_oversized_values(): void
    {
        $service = new DanceShortDisplayCardWindowService;

        $this->assertSame(5, $service->normalizeWindowSize(null));
        $this->assertSame(5, $service->normalizeWindowSize(0));
        $this->assertSame(3, $service->normalizeWindowSize(3));
        $this->assertSame(5, $service->normalizeWindowSize(999));
    }

    public function test_build_window_uses_one_item_lookahead_for_pagination(): void
    {
        $service = new DanceShortDisplayCardWindowService;

        $window = $service->buildWindow(range(1, 11), 6, 5);

        $this->assertSame([6, 7, 8, 9, 10], $window['visibleItems']);
        $this->assertSame(6, $window['pagination']->startRank);
        $this->assertSame(5, $window['pagination']->windowSize);
        $this->assertTrue($window['pagination']->hasPrev);
        $this->assertTrue($window['pagination']->hasNext);
        $this->assertSame(1, $window['pagination']->prevStartRank);
        $this->assertSame(11, $window['pagination']->nextStartRank);
    }

    public function test_build_window_from_lookahead_keeps_repository_window_start_rank(): void
    {
        $service = new DanceShortDisplayCardWindowService;

        $window = $service->buildWindowFromLookahead(range(6, 11), 6, 5);

        $this->assertSame([6, 7, 8, 9, 10], $window['visibleItems']);
        $this->assertSame(6, $window['pagination']->startRank);
        $this->assertSame(5, $window['pagination']->windowSize);
        $this->assertTrue($window['pagination']->hasPrev);
        $this->assertTrue($window['pagination']->hasNext);
        $this->assertSame(1, $window['pagination']->prevStartRank);
        $this->assertSame(11, $window['pagination']->nextStartRank);
    }

    public function test_build_window_around_selected_video_centers_middle_rank(): void
    {
        $service = new DanceShortDisplayCardWindowService;

        $window = $service->buildWindowAroundSelectedVideo(
            items: range(1, 10),
            selectedVideoId: 5,
            windowSize: 5,
            videoIdResolver: fn (int $videoId): int => $videoId,
        );

        $this->assertSame([3, 4, 5, 6, 7], $window['visibleItems']);
        $this->assertSame(3, $window['pagination']->startRank);
        $this->assertSame(2, $window['activeIndex']);
        $this->assertSame(5, $window['activeRank']);
    }

    public function test_build_window_around_selected_video_keeps_head_window_for_first_rank(): void
    {
        $service = new DanceShortDisplayCardWindowService;

        $window = $service->buildWindowAroundSelectedVideo(
            items: range(1, 10),
            selectedVideoId: 1,
            windowSize: 5,
            videoIdResolver: fn (int $videoId): int => $videoId,
        );

        $this->assertSame([1, 2, 3, 4, 5], $window['visibleItems']);
        $this->assertSame(1, $window['pagination']->startRank);
        $this->assertSame(0, $window['activeIndex']);
        $this->assertSame(1, $window['activeRank']);
    }

    public function test_build_window_around_selected_video_keeps_tail_window_for_last_rank(): void
    {
        $service = new DanceShortDisplayCardWindowService;

        $window = $service->buildWindowAroundSelectedVideo(
            items: range(1, 10),
            selectedVideoId: 10,
            windowSize: 5,
            videoIdResolver: fn (int $videoId): int => $videoId,
        );

        $this->assertSame([6, 7, 8, 9, 10], $window['visibleItems']);
        $this->assertSame(6, $window['pagination']->startRank);
        $this->assertSame(4, $window['activeIndex']);
        $this->assertSame(10, $window['activeRank']);
    }

    public function test_active_rank_uses_start_rank_and_active_index_when_card_exists(): void
    {
        $service = new DanceShortDisplayCardWindowService;

        $this->assertSame(8, $service->activeRankFor(6, 2, true));
        $this->assertNull($service->activeRankFor(6, 2, false));
    }
}
