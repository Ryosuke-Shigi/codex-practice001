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
use App\Services\DanceShortsRadar\DanceShortRankingReadModelBuildLifecycleService;
use App\Services\DanceShortsRadar\DanceShortSnapshotMetricService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;
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
        private readonly DanceShortRankingReadModelBuildLifecycleService $lifecycleService,
    ) {}

    public function execute(): RankingReadModelBuildResultDTO
    {
        $startedAt = CarbonImmutable::now((string) config('app.timezone', 'Asia/Tokyo'));
        $lock = Cache::lock($this->lifecycleService->lockName(), $this->lifecycleService->lockTtlSeconds());

        if (! $lock->get()) {
            Log::warning('DanceShortsRadar ranking read model build skipped.', [
                'process' => 'dance_shorts_radar_ranking_read_model_build',
                'result' => 'skipped',
                'reason' => DanceShortRankingReadModelBuildLifecycleService::SKIP_REASON_LOCK_UNAVAILABLE,
            ]);

            return RankingReadModelBuildResultDTO::skipped(
                calculatedAt: $startedAt,
                skipReason: DanceShortRankingReadModelBuildLifecycleService::SKIP_REASON_LOCK_UNAVAILABLE,
            );
        }

        try {
            return $this->executeWithLock($startedAt);
        } finally {
            try {
                $lock->release();
            } catch (Throwable $exception) {
                Log::warning('DanceShortsRadar ranking read model build lock release failed.', [
                    'process' => 'dance_shorts_radar_ranking_read_model_build',
                    'exception' => $exception::class,
                    'message' => $exception->getMessage(),
                ]);
            }
        }
    }

    private function executeWithLock(CarbonImmutable $calculatedAt): RankingReadModelBuildResultDTO
    {
        $buildId = (string) Str::uuid();
        $normalPatternCount = 0;
        $risingPatternCount = 0;
        $insertedRowCount = 0;
        $cleanupChunkSize = $this->lifecycleService->cleanupChunkSize();
        $staleCleanupResult = $this->readModelRepository->markStaleBuildingBuildsFailed(
            staleBefore: $this->lifecycleService->staleBuildingCutoff($calculatedAt),
            failedAt: $calculatedAt,
            chunkSize: $cleanupChunkSize,
        );

        if ($staleCleanupResult['buildCount'] > 0) {
            Log::warning('DanceShortsRadar stale ranking read model builds marked failed.', [
                'process' => 'dance_shorts_radar_ranking_read_model_build',
                'result' => 'stale_failed',
                'failed_count' => $staleCleanupResult['buildCount'],
                'deleted_row_count' => $staleCleanupResult['deletedRowCount'],
            ]);
        }

        if ($this->readModelRepository->hasBuildingBuild()) {
            Log::warning('DanceShortsRadar ranking read model build skipped.', [
                'process' => 'dance_shorts_radar_ranking_read_model_build',
                'result' => 'skipped',
                'reason' => DanceShortRankingReadModelBuildLifecycleService::SKIP_REASON_BUILDING_IN_PROGRESS,
                'stale_failed_count' => $staleCleanupResult['buildCount'],
                'stale_deleted_row_count' => $staleCleanupResult['deletedRowCount'],
            ]);

            return RankingReadModelBuildResultDTO::skipped(
                calculatedAt: $calculatedAt,
                skipReason: DanceShortRankingReadModelBuildLifecycleService::SKIP_REASON_BUILDING_IN_PROGRESS,
                staleFailedBuildCount: $staleCleanupResult['buildCount'],
                staleDeletedRowCount: $staleCleanupResult['deletedRowCount'],
            );
        }

        $this->readModelRepository->beginBuild($buildId, $calculatedAt);

        Log::info('DanceShortsRadar ranking read model build started.', [
            'process' => 'dance_shorts_radar_ranking_read_model_build',
            'build_id' => $buildId,
        ]);

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
            $persistedRowCount = $this->readModelRepository->rowCountForBuild($buildId);

            if (! $this->lifecycleService->hasActivatableRows($persistedRowCount)) {
                throw new RuntimeException('Ranking read model build produced no rows.');
            }

            $this->readModelRepository->activateBuild($buildId);
            $cleanupDeletedRowCount = $this->readModelRepository->cleanupRowsExceptBuildIds(
                retainedBuildIds: $this->lifecycleService->retainedBuildIdsAfterActivation($buildId),
                chunkSize: $cleanupChunkSize,
            );

            Log::info('DanceShortsRadar ranking read model build completed.', [
                'process' => 'dance_shorts_radar_ranking_read_model_build',
                'result' => 'success',
                'build_id' => $buildId,
                'normal_pattern_count' => $normalPatternCount,
                'rising_pattern_count' => $risingPatternCount,
                'inserted_row_count' => $insertedRowCount,
                'cleanup_deleted_row_count' => $cleanupDeletedRowCount,
                'stale_failed_count' => $staleCleanupResult['buildCount'],
            ]);

            return new RankingReadModelBuildResultDTO(
                buildId: $buildId,
                normalPatternCount: $normalPatternCount,
                risingPatternCount: $risingPatternCount,
                insertedRowCount: $insertedRowCount,
                calculatedAt: $calculatedAt,
                cleanupDeletedRowCount: $cleanupDeletedRowCount,
                staleFailedBuildCount: $staleCleanupResult['buildCount'],
                staleDeletedRowCount: $staleCleanupResult['deletedRowCount'],
            );
        } catch (Throwable $exception) {
            /*
             * 部分生成された rows を掃除し、失敗buildを active にしないまま例外を上位へ返します。
             */
            try {
                $deletedRowCount = $this->readModelRepository->markBuildFailed($buildId, $cleanupChunkSize);

                Log::error('DanceShortsRadar ranking read model build failed.', [
                    'process' => 'dance_shorts_radar_ranking_read_model_build',
                    'result' => 'failed',
                    'build_id' => $buildId,
                    'deleted_row_count' => $deletedRowCount,
                    'exception' => $exception::class,
                    'message' => $exception->getMessage(),
                ]);
            } catch (Throwable $failureException) {
                Log::error('DanceShortsRadar ranking read model build failed and failed-state update also failed.', [
                    'process' => 'dance_shorts_radar_ranking_read_model_build',
                    'result' => 'failed_state_update_failed',
                    'build_id' => $buildId,
                    'exception' => $failureException::class,
                    'message' => $failureException->getMessage(),
                    'original_exception' => $exception::class,
                    'original_message' => $exception->getMessage(),
                ]);
            }

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
