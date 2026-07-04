<?php

namespace App\Actions\Earthquake\Commands;

use App\DTO\Earthquake\Sync\EarthquakeMapRefreshStartResultDTO;
use App\Jobs\Earthquake\RefreshEarthquakeMapDataJob;
use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;
use RuntimeException;

/**
 * QuakeWave Map の統合更新Jobを投入する Command Action です。
 *
 * feed entry 取込runと map pin 生成runを作り、Queue へ Job を渡します。
 * XML取得・解析・DB保存の本体は Job / Service / Repository に分け、Action は開始手順だけを扱います。
 */
final readonly class StartEarthquakeMapRefreshAction
{
    public function __construct(
        private EarthquakeFeedEntrySyncRunRepositoryInterface $feedEntrySyncRunRepository,
        private EarthquakeMapPinSyncRunRepositoryInterface $mapPinSyncRunRepository,
        private EarthquakeMapPinRepositoryInterface $mapPinRepository,
    ) {}

    /**
     * @return array{feedEntrySyncRunId: int, mapPinSyncRunId: int}
     */
    public function execute(): array
    {
        /*
         * /quakewave-preview/map の更新ボタンは、画面上では1つでも内部では
         * 「feed entry 取込」と「map pin 生成」の2つの同期runを分けて保存します。
         *
         * これにより既存の status API と履歴テーブルをそのまま使えます。
         * HTTP は「統合更新を Queue に投入した」ことだけを返し、XML取得や解析はJob以降へ渡します。
         */
        if (
            ! $this->feedEntrySyncRunRepository->isStorageReady()
            || ! $this->mapPinSyncRunRepository->isStorageReady()
            || ! $this->mapPinRepository->isStorageReady()
        ) {
            throw new RuntimeException('Earthquake map refresh storage is not ready. Run migrations.');
        }

        $feedEntrySyncRunId = $this->feedEntrySyncRunRepository->createPending();
        $mapPinSyncRunId = $this->mapPinSyncRunRepository->createPending();

        /*
         * Job payload は2つのsyncRunIdだけにします。
         * feed XMLの本文やDB由来のentry配列はQueue投入時点で固定せず、worker実行時に
         * Service / Repository が最新状態を読み直します。
         */
        RefreshEarthquakeMapDataJob::dispatch($feedEntrySyncRunId, $mapPinSyncRunId);

        return [
            'feedEntrySyncRunId' => $feedEntrySyncRunId,
            'mapPinSyncRunId' => $mapPinSyncRunId,
        ];
    }

    /**
     * 統合更新を開始し、開始結果として必要な2つの初期 status もまとめて返します。
     */
    public function executeWithInitialStatus(): EarthquakeMapRefreshStartResultDTO
    {
        $syncRunIds = $this->execute();

        return new EarthquakeMapRefreshStartResultDTO(
            feedEntrySyncRunId: $syncRunIds['feedEntrySyncRunId'],
            mapPinSyncRunId: $syncRunIds['mapPinSyncRunId'],
            feedEntrySyncStatus: $this->feedEntrySyncRunRepository->findResult($syncRunIds['feedEntrySyncRunId']),
            mapPinSyncStatus: $this->mapPinSyncRunRepository->findResult($syncRunIds['mapPinSyncRunId']),
        );
    }
}
