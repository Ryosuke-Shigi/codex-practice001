<?php

namespace App\Actions\Earthquake\Commands;

use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;
use App\Services\Earthquake\EarthquakeMapPinBuildService;
use Throwable;

/**
 * Queue 上で map pin 同期 run を実行する Command Action です。
 *
 * Job から呼ばれ、run 状態更新と生成 Service の結果反映を担当します。
 * 個別XML取得、解析、pin生成可否、DB保存条件は Service / Repository 側へ残します。
 */
final readonly class RunEarthquakeMapPinSyncAction
{
    public function __construct(
        private EarthquakeMapPinSyncRunRepositoryInterface $syncRunRepository,
        private EarthquakeMapPinBuildService $buildService,
    ) {}

    public function execute(int $syncRunId): EarthquakeMapPinSyncResultDTO
    {
        return $this->executeBuild(
            $syncRunId,
            fn (): EarthquakeMapPinSyncResultDTO => $this->buildService->sync($syncRunId),
        );
    }

    /**
     * @param  array<int, int>  $sourceEntryIds
     */
    public function executeEntries(int $syncRunId, array $sourceEntryIds): EarthquakeMapPinSyncResultDTO
    {
        return $this->executeBuild(
            $syncRunId,
            fn (): EarthquakeMapPinSyncResultDTO => $this->buildService->syncEntries($syncRunId, $sourceEntryIds),
        );
    }

    /** @param callable(): EarthquakeMapPinSyncResultDTO $build */
    private function executeBuild(int $syncRunId, callable $build): EarthquakeMapPinSyncResultDTO
    {
        $this->syncRunRepository->markRunning($syncRunId);

        try {
            $result = $build();
        } catch (Throwable $exception) {
            $this->syncRunRepository->markFailed($syncRunId, $exception->getMessage());

            throw $exception;
        }

        $this->syncRunRepository->markCompleted($syncRunId, $result);

        return $result;
    }
}
