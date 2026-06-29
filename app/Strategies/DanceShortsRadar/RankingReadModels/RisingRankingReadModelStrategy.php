<?php

namespace App\Strategies\DanceShortsRadar\RankingReadModels;

use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelBuildInputDTO;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelRowDTO;
use App\Factories\DanceShortsRadar\DanceShortRankingReadModelRowDTOFactory;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;

/**
 * US / KR を source とする上昇候補 ranking read model を生成する Strategy です。
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

    /**
     * @return array<int, RankingReadModelRowDTO>
     */
    public function build(RankingReadModelBuildInputDTO $input): array
    {
        $sourceRegionCodes = array_values(array_intersect(self::SOURCE_REGION_CODES, $input->activeRegionCodes));

        if ($sourceRegionCodes === []) {
            return [];
        }

        $rows = $this->snapshotRepository->risingRowsForReadModelPattern(
            sourceRegionCodes: $sourceRegionCodes,
            comparisonDays: $input->comparisonDays,
            maxRows: $input->maxRows,
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
