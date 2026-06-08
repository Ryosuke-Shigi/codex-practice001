<?php

namespace Tests\Unit\DanceShortsRadar\Actions;

use App\Actions\DanceShortsRadar\Commands\CleanupDanceShortVideoSnapshotsAction;
use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSnapshotCreateDTO;
use App\Models\DanceShortVideoSnapshot;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortSnapshotRetentionService;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class CleanupDanceShortVideoSnapshotsActionTest extends TestCase
{
    public function test_execute_delegates_cutoff_delete_to_repository_and_returns_result_dto(): void
    {
        $repository = new FakeCleanupDanceShortVideoSnapshotRepository();
        $action = new CleanupDanceShortVideoSnapshotsAction(
            snapshotRepository: $repository,
            retentionService: new DanceShortSnapshotRetentionService(),
        );

        $result = $action->execute(CarbonImmutable::parse('2026-06-01 12:00:00', 'Asia/Tokyo'));

        $this->assertSame(7, $result->deletedSnapshotCount);
        $this->assertSame(35, $result->retentionDays);
        $this->assertSame('2026-04-27 03:00:00', $result->cutoffAt->format('Y-m-d H:i:s'));
        $this->assertSame('2026-04-27 03:00:00', $repository->deletedBefore?->format('Y-m-d H:i:s'));
    }
}

class FakeCleanupDanceShortVideoSnapshotRepository implements DanceShortVideoSnapshotRepositoryInterface
{
    public ?CarbonInterface $deletedBefore = null;

    public function create(DanceShortVideoSnapshotCreateDTO $dto): DanceShortVideoSnapshot
    {
        throw new RuntimeException('Cleanup action should not create snapshots.');
    }

    public function updateLatestInPeriodOrCreate(
        DanceShortVideoSnapshotCreateDTO $dto,
        CarbonInterface $periodStartAt,
        CarbonInterface $periodEndAt,
    ): DanceShortVideoSnapshot {
        throw new RuntimeException('Cleanup action should not save snapshots.');
    }

    public function latestForVideoAndRegion(int $videoId, int $regionId): ?DanceShortVideoSnapshot
    {
        throw new RuntimeException('Cleanup action should not fetch latest snapshots.');
    }

    public function latestRankingSnapshotsByRegionCode(string $regionCode): Collection
    {
        throw new RuntimeException('Cleanup action should not fetch ranking snapshots.');
    }

    public function rankingRowsWindowByRegionCodes(
        array $regionCodes,
        int $comparisonDays,
        string $sortKey,
        int $startRank,
        int $windowSize,
    ): array {
        throw new RuntimeException('Cleanup action should not fetch ranking windows.');
    }

    public function rankingRowsByRegionCodes(
        array $regionCodes,
        int $comparisonDays,
        string $sortKey,
    ): array {
        throw new RuntimeException('Cleanup action should not fetch ranking rows.');
    }

    public function risingRowsWindow(
        array $sourceRegionCodes,
        int $comparisonDays,
        int $startRank,
        int $windowSize,
    ): array {
        throw new RuntimeException('Cleanup action should not fetch rising windows.');
    }

    public function risingRows(
        array $sourceRegionCodes,
        int $comparisonDays,
    ): array {
        throw new RuntimeException('Cleanup action should not fetch rising rows.');
    }

    public function latestSnapshotAtOrBefore(
        int $videoId,
        int $regionId,
        CarbonInterface $cutoffAt,
    ): ?DanceShortVideoSnapshot {
        throw new RuntimeException('Cleanup action should not fetch previous snapshots.');
    }

    public function latestSnapshotBefore(
        int $videoId,
        int $regionId,
        CarbonInterface $currentCollectedAt,
        int $currentSnapshotId,
    ): ?DanceShortVideoSnapshot {
        throw new RuntimeException('Cleanup action should not fetch previous snapshots.');
    }

    public function deleteCollectedBefore(CarbonInterface $cutoffAt): int
    {
        $this->deletedBefore = $cutoffAt;

        return 7;
    }
}
