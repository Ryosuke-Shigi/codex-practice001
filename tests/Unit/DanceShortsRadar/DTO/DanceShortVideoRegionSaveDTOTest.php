<?php

namespace Tests\Unit\DanceShortsRadar\DTO;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoRegionSaveDTO;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class DanceShortVideoRegionSaveDTOTest extends TestCase
{
    public function test_dto_carries_video_region_and_detected_at(): void
    {
        $detectedAt = CarbonImmutable::parse('2026-06-01 12:00:00', 'UTC');

        $dto = new DanceShortVideoRegionSaveDTO(
            video_id: 10,
            region_id: 20,
            detected_at: $detectedAt,
        );

        $this->assertSame(10, $dto->video_id);
        $this->assertSame(20, $dto->region_id);
        $this->assertTrue($detectedAt->equalTo($dto->detected_at));
    }
}
