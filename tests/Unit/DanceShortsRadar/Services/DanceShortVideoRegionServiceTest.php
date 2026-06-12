<?php

namespace Tests\Unit\DanceShortsRadar\Services;

use App\Services\DanceShortsRadar\DanceShortVideoRegionService;
use PHPUnit\Framework\TestCase;

class DanceShortVideoRegionServiceTest extends TestCase
{
    public function test_video_region_is_saved_only_when_video_and_region_ids_are_positive(): void
    {
        $service = new DanceShortVideoRegionService;

        $this->assertTrue($service->shouldSaveVideoRegion(1, 2));
        $this->assertFalse($service->shouldSaveVideoRegion(0, 2));
        $this->assertFalse($service->shouldSaveVideoRegion(1, 0));
    }
}
