<?php

namespace App\Strategies\DanceShortsRadar\RankingReadModels;

use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelBuildInputDTO;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelRowDTO;
use App\Factories\DanceShortsRadar\DanceShortRankingReadModelRowDTOFactory;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;

/**
 * active region ごとの通常ランキング read model を生成する Strategy です。
 */
class RegionRankingReadModelStrategy implements DanceShortRankingReadModelStrategyInterface
{
    public function __construct(
        private readonly DanceShortVideoSnapshotRepositoryInterface $snapshotRepository,
        private readonly DanceShortRankingReadModelRowDTOFactory $rowFactory,
    ) {}

    public function build(RankingReadModelBuildInputDTO $input): array
    {
        if ($input->sortKey === null || ! in_array($input->scope, $input->activeRegionCodes, true)) {
            return [];
        }

        return $this->rowsForRegionCodes($input, [$input->scope]);
    }

    /**
     * @param  array<int, string>  $regionCodes
     * @return array<int, RankingReadModelRowDTO>
     */
    protected function rowsForRegionCodes(RankingReadModelBuildInputDTO $input, array $regionCodes): array
    {
        $rows = $this->snapshotRepository->rankingRowsForReadModelPattern(
            regionCodes: $regionCodes,
            comparisonDays: $input->comparisonDays,
            sortKey: (string) $input->sortKey,
            maxRows: $input->maxRows,
        );
        $readModelRows = [];

        foreach ($rows as $index => $row) {
            $readModelRows[] = $this->rowFactory->fromRankingRow(
                row: $row,
                input: $input,
                rank: $index + 1,
            );
        }

        return $readModelRows;
    }
}
