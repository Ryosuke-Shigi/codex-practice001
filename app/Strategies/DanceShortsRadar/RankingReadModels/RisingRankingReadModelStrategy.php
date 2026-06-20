<?php

namespace App\Strategies\DanceShortsRadar\RankingReadModels;

use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelBuildInputDTO;
use App\Factories\DanceShortsRadar\DanceShortRankingReadModelRowDTOFactory;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;

/**
 * RISING タブ用の上昇候補 read model を生成する Strategy です。
 */
final readonly class RisingRankingReadModelStrategy implements DanceShortRankingReadModelStrategyInterface
{
    /**
     * @var array<int, string>
     */
    private const SOURCE_REGION_CODES = ['US', 'KR'];

    public function __construct(
        private DanceShortVideoSnapshotRepositoryInterface $snapshotRepository,
        private DanceShortRankingReadModelRowDTOFactory $rowFactory,
    ) {}

    public function build(RankingReadModelBuildInputDTO $input): array
    {
        $sourceRegionCodes = array_values(array_intersect(
            self::SOURCE_REGION_CODES,
            $input->activeRegionCodes,
        ));
        $rows = $this->snapshotRepository->risingRows(
            sourceRegionCodes: $sourceRegionCodes,
            comparisonDays: $input->comparisonDays,
        );
        $readModelRows = [];

        foreach ($rows as $index => $row) {
            $readModelRow = $this->rowFactory->fromRisingRow(
                row: $row,
                input: $input,
                rank: $index + 1,
            );

            if ($readModelRow !== null) {
                $readModelRows[] = $readModelRow;
            }
        }

        return $readModelRows;
    }
}
