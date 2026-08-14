<?php

namespace App\Services\Earthquake;

use App\DTO\Earthquake\Preview\EarthquakeExtractedEntryDTO;
use App\DTO\Earthquake\Preview\EarthquakeExtractedEntryListDTO;
use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncResultDTO;
use App\Events\ApplicationLog\ApplicationErrorOccurred;
use App\Repositories\Earthquake\EarthquakeFeedEntryRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeXmlRepositoryInterface;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use RuntimeException;
use Throwable;

/**
 * JMA Atom feed entry を保存済みデータへ同期する Service です。
 *
 * 外部XML取得、Atom entryの表層解析、地震系entry抽出、DB upsert の手順をまとめます。
 * HTTP入口、Queue状態更新、React props生成は扱わず、保存可否の細かなDB境界は Repository に委譲します。
 */
class EarthquakeFeedEntrySyncService
{
    public function __construct(
        private readonly EarthquakeXmlRepositoryInterface $xmlRepository,
        private readonly EarthquakeXmlPreviewService $xmlPreviewService,
        private readonly EarthquakeEntryExtractService $entryExtractService,
        private readonly EarthquakeFeedEntryRepositoryInterface $feedEntryRepository,
    ) {}

    public function sync(int $syncRunId): EarthquakeFeedEntrySyncResultDTO
    {
        /*
         * この Service は同期本体の業務手順だけを担当します。
         * HTTP入口、Queue状態更新、React用JSON整形は Controller / Job / Responder に残します。
         *
         * 現段階の同期範囲は Atom feed entry の保存までです。
         * 個別 XML 電文の Report / Control / Head / Body 解析や map pin 生成はまだ行わず、
         * 後続処理が参照できる entry_id / title / xml_url / feed時刻だけを永続化します。
         */
        $startedAt = CarbonImmutable::now();
        $cutoff = $this->feedEntryRepository->latestUpdatedAtFromFeed();
        $transport = $this->xmlRepository->fetchHighFrequencyFeed();

        if (! ($transport['success'] ?? false)) {
            $message = $this->safeErrorMessage($transport['error_message'] ?? null);
            $this->dispatchErrorLog(
                message: $message,
                errorCode: 'earthquake.jma.feed_fetch_failed',
                url: $this->transportString($transport, 'endpoint'),
                method: $this->transportString($transport, 'method'),
            );

            throw new RuntimeException($message);
        }

        try {
            $feed = $this->xmlPreviewService->parseHighFrequencyFeedBody((string) ($transport['body'] ?? ''));
        } catch (Throwable $exception) {
            $this->dispatchErrorLog(
                message: '気象庁 高頻度フィードのXMLを解析できませんでした。',
                errorCode: 'earthquake.jma.feed_xml_parse_failed',
                exception: $exception,
                url: $this->transportString($transport, 'endpoint'),
                method: $this->transportString($transport, 'method'),
            );

            throw new RuntimeException('気象庁 高頻度フィードのXMLを解析できませんでした。', 0, $exception);
        }

        $extractedEntries = $this->entriesAtOrAfterCutoff(
            $this->entryExtractService->extractAll($feed->entries),
            $cutoff,
        );
        /*
         * 抽出済み DTO をそのまま Repository に渡します。
         * 同じ feed を何度取り込んでも entry_id unique を基準に insert / update / skip へ分かれるため、
         * 手動ボタンの連打や worker の再実行でも重複 insert にならない前提です。
         */
        $result = $this->feedEntryRepository->upsertFromExtractedEntries($extractedEntries);

        return new EarthquakeFeedEntrySyncResultDTO(
            syncRunId: $syncRunId,
            status: EarthquakeFeedEntrySyncResultDTO::STATUS_COMPLETED,
            totalCount: $result['totalCount'],
            insertedCount: $result['insertedCount'],
            updatedCount: $result['updatedCount'],
            skippedCount: $result['skippedCount'],
            failedCount: $result['failedCount'],
            errorMessage: null,
            startedAt: $startedAt,
            finishedAt: CarbonImmutable::now(),
            changedEntryIds: $result['changedEntryIds'],
        );
    }

    private function entriesAtOrAfterCutoff(
        EarthquakeExtractedEntryListDTO $entries,
        ?CarbonInterface $cutoff,
    ): EarthquakeExtractedEntryListDTO {
        if ($cutoff === null) {
            return $entries;
        }

        return new EarthquakeExtractedEntryListDTO(array_values(array_filter(
            $entries->items,
            function (EarthquakeExtractedEntryDTO $entry) use ($cutoff): bool {
                if ($entry->updatedAt === null || trim($entry->updatedAt) === '') {
                    return true;
                }

                try {
                    return CarbonImmutable::parse($entry->updatedAt)->greaterThanOrEqualTo($cutoff);
                } catch (Throwable) {
                    return true;
                }
            },
        )));
    }

    private function safeErrorMessage(mixed $message): string
    {
        $message = is_string($message) ? trim($message) : '';

        if ($message === '') {
            return '気象庁 高頻度フィードを取得できませんでした。';
        }

        return mb_strimwidth($message, 0, 180, '...');
    }

    private function dispatchErrorLog(
        string $message,
        string $errorCode,
        ?Throwable $exception = null,
        ?string $url = null,
        ?string $method = null,
    ): void {
        event(new ApplicationErrorOccurred(
            level: 'error',
            message: $message,
            errorCode: $errorCode,
            exception: $exception,
            url: $url,
            method: $method,
        ));
    }

    /**
     * @param  array<string, mixed>  $transport
     */
    private function transportString(array $transport, string $key): ?string
    {
        return is_string($transport[$key] ?? null) ? $transport[$key] : null;
    }
}
