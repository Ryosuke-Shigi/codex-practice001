<?php

namespace App\Actions\DanceShortsRadar\Commands;

use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelBuildInputDTO;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelPatternBuildResultDTO;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelPatternDefinitionDTO;
use App\Factories\DanceShortsRadar\DanceShortRankingReadModelStrategyFactory;
use App\Models\DanceShortRegion;
use App\Repositories\DanceShortsRadar\DanceShortRankingReadModelRepositoryInterface;
use App\Repositories\DanceShortsRadar\DanceShortSearchTargetRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortRankingReadModelBuildLifecycleService;
use App\Services\DanceShortsRadar\DanceShortRankingReadModelPatternService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

/**
 * DanceShortsRadar のランキング read model を1 pattern だけ生成する Command Action です。
 */
class BuildDanceShortRankingReadModelPatternAction
{
    public function __construct(
        private readonly DanceShortSearchTargetRepositoryInterface $searchTargetRepository,
        private readonly DanceShortRankingReadModelStrategyFactory $strategyFactory,
        private readonly DanceShortRankingReadModelRepositoryInterface $readModelRepository,
        private readonly DanceShortRankingReadModelBuildLifecycleService $lifecycleService,
        private readonly DanceShortRankingReadModelPatternService $patternService,
    ) {}

    public function execute(string $patternKey): RankingReadModelPatternBuildResultDTO
    {
        $definition = $this->patternService->definitionForKey($patternKey);
        $startedAt = CarbonImmutable::now((string) config('app.timezone', 'Asia/Tokyo'));
        $lock = Cache::lock(
            $this->lifecycleService->lockNameForPattern($definition->patternKey),
            $this->lifecycleService->lockTtlSeconds(),
        );

        if (! $lock->get()) {
            Log::warning('DanceShortsRadar ranking read model pattern build skipped.', [
                'process' => 'dance_shorts_radar_ranking_read_model_pattern_build',
                'result' => 'skipped',
                'reason' => DanceShortRankingReadModelBuildLifecycleService::SKIP_REASON_LOCK_UNAVAILABLE,
                'pattern_key' => $definition->patternKey,
            ]);

            return RankingReadModelPatternBuildResultDTO::skipped(
                definition: $definition,
                calculatedAt: $startedAt,
                skipReason: DanceShortRankingReadModelBuildLifecycleService::SKIP_REASON_LOCK_UNAVAILABLE,
            );
        }

        try {
            return $this->executeWithLock($definition, $startedAt);
        } finally {
            try {
                $lock->release();
            } catch (Throwable $exception) {
                Log::warning('DanceShortsRadar ranking read model pattern build lock release failed.', [
                    'process' => 'dance_shorts_radar_ranking_read_model_pattern_build',
                    'pattern_key' => $definition->patternKey,
                    'exception' => $exception::class,
                    'message' => $exception->getMessage(),
                ]);
            }
        }
    }

    private function executeWithLock(
        RankingReadModelPatternDefinitionDTO $definition,
        CarbonImmutable $calculatedAt,
    ): RankingReadModelPatternBuildResultDTO {
        $patternBuildId = (string) Str::uuid();
        $cleanupChunkSize = $this->lifecycleService->cleanupChunkSize();
        $staleCleanupResult = $this->readModelRepository->markStaleBuildingBuildsFailedForPattern(
            patternKey: $definition->patternKey,
            staleBefore: $this->lifecycleService->staleBuildingCutoff($calculatedAt),
            failedAt: $calculatedAt,
            chunkSize: $cleanupChunkSize,
        );

        if ($staleCleanupResult['buildCount'] > 0) {
            Log::warning('DanceShortsRadar stale ranking read model pattern builds marked failed.', [
                'process' => 'dance_shorts_radar_ranking_read_model_pattern_build',
                'result' => 'stale_failed',
                'pattern_key' => $definition->patternKey,
                'failed_count' => $staleCleanupResult['buildCount'],
                'deleted_row_count' => $staleCleanupResult['deletedRowCount'],
            ]);
        }

        if ($this->readModelRepository->hasBuildingBuildForPattern($definition->patternKey)) {
            Log::warning('DanceShortsRadar ranking read model pattern build skipped.', [
                'process' => 'dance_shorts_radar_ranking_read_model_pattern_build',
                'result' => 'skipped',
                'reason' => DanceShortRankingReadModelBuildLifecycleService::SKIP_REASON_BUILDING_IN_PROGRESS,
                'pattern_key' => $definition->patternKey,
                'stale_failed_count' => $staleCleanupResult['buildCount'],
                'stale_deleted_row_count' => $staleCleanupResult['deletedRowCount'],
            ]);

            return RankingReadModelPatternBuildResultDTO::skipped(
                definition: $definition,
                calculatedAt: $calculatedAt,
                skipReason: DanceShortRankingReadModelBuildLifecycleService::SKIP_REASON_BUILDING_IN_PROGRESS,
                staleFailedBuildCount: $staleCleanupResult['buildCount'],
                staleDeletedRowCount: $staleCleanupResult['deletedRowCount'],
            );
        }

        $this->readModelRepository->beginPatternBuild($definition, $patternBuildId, $calculatedAt);

        Log::info('DanceShortsRadar ranking read model pattern build started.', [
            'process' => 'dance_shorts_radar_ranking_read_model_pattern_build',
            'pattern_key' => $definition->patternKey,
            'pattern_build_id' => $patternBuildId,
        ]);

        try {
            $rows = $this->strategyFactory
                ->make($definition->scope)
                ->build(new RankingReadModelBuildInputDTO(
                    patternBuildId: $patternBuildId,
                    patternKey: $definition->patternKey,
                    rankingType: $definition->rankingType,
                    scope: $definition->scope,
                    comparisonDays: $definition->comparisonDays,
                    sortKey: $definition->sortKey,
                    maxRows: $definition->maxRows,
                    activeRegionCodes: $this->activeRegionCodes(),
                    calculatedAt: $calculatedAt,
                ));

            $this->readModelRepository->bulkInsertRows($rows);
            $insertedRowCount = $this->readModelRepository->rowCountForPatternBuild($patternBuildId);

            if ($insertedRowCount <= 0) {
                throw new RuntimeException('Ranking read model pattern build produced no rows.');
            }

            $this->readModelRepository->activatePatternBuild(
                patternBuildId: $patternBuildId,
                patternKey: $definition->patternKey,
                insertedCount: $insertedRowCount,
            );
            $cleanupDeletedRowCount = $this->readModelRepository->cleanupRowsExceptPatternBuildIds(
                patternKey: $definition->patternKey,
                retainedPatternBuildIds: $this->lifecycleService->retainedPatternBuildIdsAfterActivation($patternBuildId),
                chunkSize: $cleanupChunkSize,
            );

            Log::info('DanceShortsRadar ranking read model pattern build completed.', [
                'process' => 'dance_shorts_radar_ranking_read_model_pattern_build',
                'result' => 'success',
                'pattern_key' => $definition->patternKey,
                'pattern_build_id' => $patternBuildId,
                'inserted_row_count' => $insertedRowCount,
                'max_rows' => $definition->maxRows,
                'cleanup_deleted_row_count' => $cleanupDeletedRowCount,
                'stale_failed_count' => $staleCleanupResult['buildCount'],
            ]);

            return new RankingReadModelPatternBuildResultDTO(
                patternBuildId: $patternBuildId,
                patternKey: $definition->patternKey,
                rankingType: $definition->rankingType,
                scope: $definition->scope,
                comparisonDays: $definition->comparisonDays,
                sortKey: $definition->sortKey,
                maxRows: $definition->maxRows,
                insertedRowCount: $insertedRowCount,
                calculatedAt: $calculatedAt,
                cleanupDeletedRowCount: $cleanupDeletedRowCount,
                staleFailedBuildCount: $staleCleanupResult['buildCount'],
                staleDeletedRowCount: $staleCleanupResult['deletedRowCount'],
            );
        } catch (Throwable $exception) {
            try {
                $deletedRowCount = $this->readModelRepository->markPatternBuildFailed(
                    patternBuildId: $patternBuildId,
                    chunkSize: $cleanupChunkSize,
                    errorMessage: $exception->getMessage(),
                );

                Log::error('DanceShortsRadar ranking read model pattern build failed.', [
                    'process' => 'dance_shorts_radar_ranking_read_model_pattern_build',
                    'result' => 'failed',
                    'pattern_key' => $definition->patternKey,
                    'pattern_build_id' => $patternBuildId,
                    'deleted_row_count' => $deletedRowCount,
                    'exception' => $exception::class,
                    'message' => $exception->getMessage(),
                ]);
            } catch (Throwable $failureException) {
                Log::error('DanceShortsRadar ranking read model pattern build failed and failed-state update also failed.', [
                    'process' => 'dance_shorts_radar_ranking_read_model_pattern_build',
                    'result' => 'failed_state_update_failed',
                    'pattern_key' => $definition->patternKey,
                    'pattern_build_id' => $patternBuildId,
                    'exception' => $failureException::class,
                    'message' => $failureException->getMessage(),
                    'original_exception' => $exception::class,
                    'original_message' => $exception->getMessage(),
                ]);
            }

            throw $exception;
        }
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
