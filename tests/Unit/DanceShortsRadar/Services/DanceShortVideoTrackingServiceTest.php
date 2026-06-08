<?php

namespace Tests\Unit\DanceShortsRadar\Services;

use App\Services\DanceShortsRadar\DanceShortVideoTrackingService;
use PHPUnit\Framework\TestCase;

class DanceShortVideoTrackingServiceTest extends TestCase
{
    public function test_only_active_videos_are_snapshot_save_targets(): void
    {
        $service = new DanceShortVideoTrackingService();

        $this->assertTrue($service->isSnapshotSaveTarget(DanceShortVideoTrackingService::STATUS_ACTIVE));
        $this->assertFalse($service->isSnapshotSaveTarget(DanceShortVideoTrackingService::STATUS_INACTIVE));
        $this->assertFalse($service->isSnapshotSaveTarget(DanceShortVideoTrackingService::STATUS_ARCHIVED));
        $this->assertFalse($service->isSnapshotSaveTarget(null));
        $this->assertFalse($service->isSnapshotSaveTarget('unknown'));
    }

    public function test_tracking_status_candidates_are_fixed(): void
    {
        $service = new DanceShortVideoTrackingService();

        $this->assertSame([
            DanceShortVideoTrackingService::STATUS_ACTIVE,
            DanceShortVideoTrackingService::STATUS_INACTIVE,
            DanceShortVideoTrackingService::STATUS_ARCHIVED,
        ], $service->allowedStatuses());
    }

    public function test_snapshot_refresh_target_status_is_active(): void
    {
        $this->assertSame(
            DanceShortVideoTrackingService::STATUS_ACTIVE,
            (new DanceShortVideoTrackingService())->snapshotRefreshTargetStatus(),
        );
    }
}
