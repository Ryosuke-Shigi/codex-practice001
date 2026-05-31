<?php

namespace Tests\Unit\DanceShortsRadar\DTO;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSnapshotCreateDTO;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class DanceShortVideoSnapshotCreateDTOTest extends TestCase
{
    public function test_to_array_returns_snapshot_columns_without_derived_growth_values(): void
    {
        $dto = new DanceShortVideoSnapshotCreateDTO(
            video_id: 10,
            region_id: 20,
            view_count: 123456,
            like_count: 789,
            comment_count: 12,
            collected_at: CarbonImmutable::parse('2026-05-31 12:00:00', 'UTC'),
        );

        $this->assertSame([
            'video_id' => 10,
            'region_id' => 20,
            'view_count' => 123456,
            'like_count' => 789,
            'comment_count' => 12,
            'collected_at' => '2026-05-31 12:00:00',
        ], $dto->toArray());

        $this->assertArrayNotHasKey('view_count_delta', $dto->toArray());
        $this->assertArrayNotHasKey('view_growth_rate', $dto->toArray());
        $this->assertArrayNotHasKey('views_per_hour', $dto->toArray());
        $this->assertArrayNotHasKey('raw_payload', $dto->toArray());
    }
}
