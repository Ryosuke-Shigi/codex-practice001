<?php

namespace App\Actions\DanceShortsRadar\Commands;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelBuildInputDTO;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelBuildResultDTO;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelSortKey;
use App\Factories\DanceShortsRadar\DanceShortRankingReadModelStrategyFactory;
use App\Models\DanceShortRegion;
use App\Repositories\DanceShortsRadar\DanceShortRankingReadModelRepositoryInterface;
use App\Repositories\DanceShortsRadar\DanceShortSearchTargetRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortSnapshotMetricService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Str;
use Throwable;

/**
 * DanceShortsRadar のランキング read model を全パターン一括生成する Command Action です。
 */
class BuildDanceShortRankingReadModelsAction
{
    public function __construct(
        private readonly DanceShortSearchTargetRepositoryInterface $searchTargetRepository,
        private readonly DanceShortSnapshotMetricService $snapshotMetricService,
        private readonly DanceShortRankingReadModelStrategyFactory $strategyFactory,
        private readonly DanceShortRankingReadModelRepositoryInterface $readModelRepository,
    ) {}

    public function execute(): RankingReadModelBuildResultDTO
    {
        $buildId = (string) Str::uuid();
        $calculatedAt = CarbonImmutable::now((string) config('app.timezone', 'Asia/Tokyo'));
        $normalPatternCount = 0;
        $risingPatternCount = 0;
        $insertedRowCount = 0;

        $this->readModelRepository->beginBuild($buildId, $calculatedAt);

        try {
            /*
             * page/API は active read model だけを読むため、ここで表示可能な全条件を先に固定します。
             * リクエストごとに snapshot 履歴を再集計しないことが、この Action の主目的です。
             */
            $activeRegionCodes = $this->activeRegionCodes();
            $comparisonDaysList = $this->snapshotMetricService->allowedComparisonDays();
            $sortKeys = $this->snapshotMetricService->allowedSortKeys();
            $normalScopes = array_merge(
                [DanceShortVideoRankingPageInputDTO::ALL_TAB_CODE],
                $activeRegionCodes,
            );

            /*
             * 通常ランキングは UI の並び替えと1対1に対応するため、sort_key を持つ全patternを生成します。
             */
            foreach ($normalScopes as $scope) {
                foreach ($comparisonDaysList as $comparisonDays) {
                    foreach ($sortKeys as $sortKey) {
                        $insertedRowCount += $this->buildPattern(new RankingReadModelBuildInputDTO(
                            buildId: $buildId,
                            scope: $scope,
                            comparisonDays: $comparisonDays,
                            sortKey: $sortKey,
                            activeRegionCodes: $activeRegionCodes,
                            calculatedAt: $calculatedAt,
                        ));
                        $normalPatternCount++;
                    }
                }
            }

            /*
             * RISING は固定順の表示専用タブなので、UIに出さない内部sort_keyでpatternを区別します。
             * NULLを避けることで、同build内の重複rankを unique index で確実に検知できます。
             */
            foreach ($comparisonDaysList as $comparisonDays) {
                $insertedRowCount += $this->buildPattern(new RankingReadModelBuildInputDTO(
                    buildId: $buildId,
                    scope: DanceShortVideoRankingPageInputDTO::RISING_TAB_CODE,
                    comparisonDays: $comparisonDays,
                    sortKey: RankingReadModelSortKey::RISING,
                    activeRegionCodes: $activeRegionCodes,
                    calculatedAt: $calculatedAt,
                ));
                $risingPatternCount++;
            }

            /*
             * すべてのpattern生成が終わってから active に切り替えます。
             * 途中失敗した build は表示側から参照されず、旧 active build が残ります。
             */
            $this->readModelRepository->activateBuild($buildId);

            return new RankingReadModelBuildResultDTO(
                buildId: $buildId,
                normalPatternCount: $normalPatternCount,
                risingPatternCount: $risingPatternCount,
                insertedRowCount: $insertedRowCount,
                calculatedAt: $calculatedAt,
            );
        } catch (Throwable $exception) {
            /*
             * 部分生成された rows を掃除し、失敗buildを active にしないまま例外を上位へ返します。
             */
            $this->readModelRepository->markBuildFailed($buildId);

            throw $exception;
        }
    }

    private function buildPattern(RankingReadModelBuildInputDTO $input): int
    {
        $rows = $this->strategyFactory
            ->make($input->scope)
            ->build($input);

        $this->readModelRepository->bulkInsertRows($rows);

        return count($rows);
    }

    /**
     * @return array<int, string>
     */
    private function activeRegionCodes(): array
    {
        return $this->searchTargetRepository
            ->activeRegions()
            ->map(fn (DanceShortRegion $region): string => (string) $region->code)
            ->values()
            ->all();
    }
}
