<?php

namespace Tests\Unit\DanceShortsRadar\DTO;

use App\DTO\DanceShortsRadar\Cleanup\DanceShortSnapshotCleanupResultDTO;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class DanceShortSnapshotCleanupResultDTOTest extends TestCase
{
    public function test_to_array_returns_cleanup_result_counts(): void
    {
        $dto = new DanceShortSnapshotCleanupResultDTO(
            executedAt: CarbonImmutable::parse('2026-06-01 12:00:00', 'Asia/Tokyo'),
            cutoffAt: CarbonImmutable::parse('2026-04-27 03:00:00', 'UTC'),
            retentionDays: 35,
            deletedSnapshotCount: 4,
        );

        $this->assertSame([
            'executedAt' => '2026-06-01T12:00:00+09:00',
            'cutoffAt' => '2026-04-27T03:00:00+00:00',
            'retentionDays' => 35,
            'deletedSnapshotCount' => 4,
        ], $dto->toArray());
    }
}
