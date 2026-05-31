<?php

namespace App\Repositories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSnapshotCreateDTO;
use App\Models\DanceShortVideoSnapshot;
use Carbon\CarbonInterface;

interface DanceShortVideoSnapshotRepositoryInterface
{
    public function create(DanceShortVideoSnapshotCreateDTO $dto): DanceShortVideoSnapshot;

    public function latestForVideoAndRegion(int $videoId, int $regionId): ?DanceShortVideoSnapshot;

    public function deleteCollectedBefore(CarbonInterface $cutoffAt): int;
}
