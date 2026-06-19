<?php

namespace App\Services\Earthquake;

use App\DTO\Earthquake\Map\EarthquakeMapPinListDTO;
use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use App\Events\ApplicationLog\ApplicationErrorOccurred;
use App\Repositories\Earthquake\EarthquakeDetailXmlRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeFeedEntryRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinRepositoryInterface;
use Carbon\CarbonImmutable;
use Throwable;

/**
 * 保存済み JMA feed entry から地図pinを生成する Service です。
 *
 * feed entry 取込後の第2段階として、個別XML取得・解析・pin保存の手順をまとめます。
 * HTTP入口、Queue状態更新、Inertia props生成は持たず、外部通信とDB操作は Repository に委譲します。
 */
class EarthquakeMapPinBuildService
{
    private const JMA_DETAIL_XML_URL_REJECTED_MESSAGE = '気象庁XML以外のURLは取得できません。';

    public function __construct(
        private readonly EarthquakeFeedEntryRepositoryInterface $feedEntryRepository,
        private readonly EarthquakeDetailXmlRepositoryInterface $detailXmlRepository,
        private readonly EarthquakeDetailXmlParseService $detailXmlParseService,
        private readonly EarthquakeMapPinRepositoryInterface $mapPinRepository,
    ) {}

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
                    if (($transport['error_message'] ?? null) === self::JMA_DETAIL_XML_URL_REJECTED_MESSAGE) {
                        $this->dispatchErrorLog(
                            message: '気象庁XML以外のURLのため、地図ピンに追加できませんでした。',
                            errorCode: 'earthquake.jma.detail_xml_url_rejected',
                            sourceEntry: $sourceEntry,
                            url: $xmlUrl,
                            method: $this->transportString($transport, 'method'),
                        );
                    }

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
            } catch (Throwable $exception) {
                $this->dispatchErrorLog(
                    message: '気象庁 個別XMLを解析できず、地図ピンに追加できませんでした。',
                    errorCode: 'earthquake.jma.detail_xml_parse_failed',
                    exception: $exception,
                    sourceEntry: $sourceEntry,
                    url: is_string($xmlUrl) ? $xmlUrl : null,
                    method: 'GET',
                );
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

    /**
     * @param  array<string, mixed>  $sourceEntry
     */
    private function dispatchErrorLog(
        string $message,
        string $errorCode,
        array $sourceEntry,
        ?Throwable $exception = null,
        ?string $url = null,
        ?string $method = null,
    ): void {
        event(new ApplicationErrorOccurred(
            level: 'error',
            message: $this->sourceEntryMessage($message, $sourceEntry),
            errorCode: $errorCode,
            exception: $exception,
            url: $url,
            method: $method,
        ));
    }

    /**
     * @param  array<string, mixed>  $sourceEntry
     */
    private function sourceEntryMessage(string $message, array $sourceEntry): string
    {
        /*
         * XML本文や気象庁レスポンス全文はログへ入れません。
         * 追跡に必要な最小情報として、どの保存済みフィードから地図ピン化できなかったかだけを残します。
         */
        $sourceEntryId = $sourceEntry['id'] ?? null;

        return is_int($sourceEntryId)
            ? sprintf('%s 対象フィードID: %d', $message, $sourceEntryId)
            : $message;
    }

    /**
     * @param  array<string, mixed>  $transport
     */
    private function transportString(array $transport, string $key): ?string
    {
        return is_string($transport[$key] ?? null) ? $transport[$key] : null;
    }
}
