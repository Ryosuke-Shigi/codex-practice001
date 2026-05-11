<?php

namespace App\Services\Earthquake;

use App\DTO\Earthquake\Map\EarthquakeMapPinDTO;
use App\DTO\Earthquake\Map\EarthquakeMapPinListDTO;
use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use App\Repositories\Earthquake\EarthquakeDetailXmlRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeFeedEntryRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinRepositoryInterface;
use Carbon\CarbonImmutable;
use RuntimeException;
use Throwable;

class EarthquakeMapPinBuildService
{
    public function __construct(
        private readonly EarthquakeFeedEntryRepositoryInterface $feedEntryRepository,
        private readonly EarthquakeDetailXmlRepositoryInterface $detailXmlRepository,
        private readonly EarthquakeDetailXmlParseService $detailXmlParseService,
        private readonly EarthquakeMapPinRepositoryInterface $mapPinRepository,
    ) {
    }

    public function sync(int $syncRunId): EarthquakeMapPinSyncResultDTO
    {
        /*
         * この Service は「保存済み feed entry から map pin を作る」業務手順だけを担当します。
         * 同期開始のHTTP入口やQueue状態更新は Action / Job 側へ分け、外部XML取得とDB保存は
         * Repository に閉じ込めます。
         *
         * 第2段階の入力は、すでにDBへ保存された earthquake_feed_entries です。
         * JMA Atom feed をここで再取得しないことで、第1段階の「feed entry 取込」と
         * 第2段階の「個別XML解析・地図ピン生成」を明確に分けています。
         */
        $startedAt = CarbonImmutable::now();
        $sourceEntries = $this->feedEntryRepository->entriesForMapPinBuild();
        $pins = [];
        $skippedCount = 0;
        $failedCount = 0;

        foreach ($sourceEntries as $sourceEntry) {
            $xmlUrl = $sourceEntry['xmlUrl'] ?? null;

            if (! is_string($xmlUrl) || trim($xmlUrl) === '') {
                $skippedCount++;
                continue;
            }

            try {
                /*
                 * 個別XMLの取得は Repository へ任せます。
                 * Service は transport result の成功/失敗を見て、解析へ進めるかだけを判断します。
                 */
                $transport = $this->detailXmlRepository->fetch($xmlUrl);

                if (! ($transport['success'] ?? false)) {
                    $failedCount++;
                    continue;
                }

                $pin = $this->detailXmlParseService->parse(
                    (string) ($transport['body'] ?? ''),
                    (int) $sourceEntry['id'],
                    is_string($sourceEntry['title'] ?? null) ? $sourceEntry['title'] : null,
                );

                /*
                 * 緯度経度が取れない電文は、現段階では地図ピンとして保存しません。
                 * 解析エラーではなく「ピン化対象外」として skipped に数え、後続の詳細解析フェーズに残します。
                 * たとえば震度速報や一部の津波系情報は、地図ピンに必要な震源座標を持たない可能性があります。
                 */
                if (! $this->detailXmlParseService->isMappable($pin)) {
                    $skippedCount++;
                    continue;
                }

                $pins[] = $pin;
            } catch (Throwable) {
                $failedCount++;
            }
        }

        $upsertResult = $this->mapPinRepository->upsertFromMapPins(new EarthquakeMapPinListDTO($pins));

        /*
         * totalCount は「対象として読んだ feed entry 数」です。
         * inserted / updated / skipped / failed は、取得・解析・保存の各段階で分かれるため、
         * Repository の upsert 結果と Service 側の skipped/failed を合算して返します。
         */
        return new EarthquakeMapPinSyncResultDTO(
            syncRunId: $syncRunId,
            status: EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED,
            totalCount: count($sourceEntries),
            insertedCount: $upsertResult['insertedCount'],
            updatedCount: $upsertResult['updatedCount'],
            skippedCount: $skippedCount + $upsertResult['skippedCount'],
            failedCount: $failedCount + $upsertResult['failedCount'],
            errorMessage: null,
            startedAt: $startedAt,
            finishedAt: CarbonImmutable::now(),
        );
    }
}
