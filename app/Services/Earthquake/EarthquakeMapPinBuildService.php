<?php

namespace App\Services\Earthquake;

use App\DTO\Earthquake\Map\EarthquakeMapPinListDTO;
use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use App\Events\ApplicationLog\ApplicationErrorOccurred;
use App\Exceptions\Earthquake\EarthquakeDetailXmlNotMappableException;
use App\Repositories\Earthquake\EarthquakeDetailXmlRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeFeedEntryRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinRepositoryInterface;
use App\Services\ApplicationLog\ApplicationLogSummaryCollector;
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

    private const TRANSPORT_OUTCOME_SUCCESS = 'success';

    private const TRANSPORT_OUTCOME_SKIPPED = 'skipped';

    private const TRANSPORT_OUTCOME_FAILED = 'failed';

    private const ERROR_CODE_DETAIL_XML_RATE_LIMITED = 'earthquake.jma.detail_xml_rate_limited';

    private const ERROR_CODE_DETAIL_XML_SERVER_ERROR = 'earthquake.jma.detail_xml_server_error';

    private const ERROR_CODE_DETAIL_XML_CONNECTION_FAILED = 'earthquake.jma.detail_xml_connection_failed';

    private const ERROR_CODE_DETAIL_XML_FETCH_FAILED = 'earthquake.jma.detail_xml_fetch_failed';

    private const ERROR_CODE_DETAIL_XML_PARSE_FAILED = 'earthquake.jma.detail_xml_parse_failed';

    private const FAILURE_SAMPLE_SOURCE_ENTRY_LIMIT = 5;

    public function __construct(
        private readonly EarthquakeFeedEntryRepositoryInterface $feedEntryRepository,
        private readonly EarthquakeDetailXmlRepositoryInterface $detailXmlRepository,
        private readonly EarthquakeDetailXmlParseService $detailXmlParseService,
        private readonly EarthquakeMapPinRepositoryInterface $mapPinRepository,
    ) {}

    public function sync(int $syncRunId): EarthquakeMapPinSyncResultDTO
    {
        return $this->syncSourceEntries(
            $syncRunId,
            $this->feedEntryRepository->entriesForMapPinBuild(),
        );
    }

    /**
     * @param  array<int, int>  $sourceEntryIds
     */
    public function syncEntries(int $syncRunId, array $sourceEntryIds): EarthquakeMapPinSyncResultDTO
    {
        if ($sourceEntryIds === []) {
            $now = CarbonImmutable::now();

            return new EarthquakeMapPinSyncResultDTO(
                syncRunId: $syncRunId,
                status: EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED,
                totalCount: 0,
                insertedCount: 0,
                updatedCount: 0,
                skippedCount: 0,
                failedCount: 0,
                errorMessage: null,
                startedAt: $now,
                finishedAt: $now,
            );
        }

        return $this->syncSourceEntries(
            $syncRunId,
            $this->feedEntryRepository->entriesForMapPinBuildByIds($sourceEntryIds),
        );
    }

    /**
     * @param  array<int, array<string, mixed>>  $sourceEntries
     */
    private function syncSourceEntries(int $syncRunId, array $sourceEntries): EarthquakeMapPinSyncResultDTO
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
        $pins = [];
        $skippedCount = 0;
        $failedCount = 0;
        $failureSummaries = [];
        /*
         * 個別XML取得は run 内で多数発生するため、Repository では発火せず、
         * map pin 生成の文脈で成功 / skipped / failed 分類へまとめて最後に flush します。
         */
        $integrationSummaries = new ApplicationLogSummaryCollector;

        foreach ($sourceEntries as $sourceEntry) {
            $xmlUrl = $sourceEntry['xmlUrl'] ?? null;

            if (! is_string($xmlUrl) || trim($xmlUrl) === '') {
                $this->mapPinRepository->deleteBySourceEntryId((int) $sourceEntry['id']);
                $skippedCount++;

                continue;
            }

            try {
                /*
                 * 個別XMLの取得は Repository へ任せます。
                 * Service は transport result を map pin 生成ユースケースの skipped / failed へ分類します。
                 */
                $transport = $this->detailXmlRepository->fetch($xmlUrl);
            } catch (Throwable $exception) {
                $this->recordDetailXmlIntegrationSummary(
                    collector: $integrationSummaries,
                    status: 'failed',
                    classification: 'connection_failed',
                    statusCode: null,
                    url: $xmlUrl,
                    method: 'GET',
                );

                $this->addFailureSummary(
                    failureSummaries: $failureSummaries,
                    message: '気象庁 個別XMLを取得できず、地図ピンに追加できませんでした。',
                    errorCode: self::ERROR_CODE_DETAIL_XML_CONNECTION_FAILED,
                    classification: 'connection_failed',
                    statusCode: null,
                    reason: $exception::class,
                    sourceEntry: $sourceEntry,
                    url: $xmlUrl,
                    method: 'GET',
                    exception: $exception,
                );
                $failedCount++;

                continue;
            }

            $transportClassification = $this->classifyTransportResult($transport);

            if ($transportClassification['outcome'] === self::TRANSPORT_OUTCOME_SKIPPED) {
                $this->recordDetailXmlIntegrationSummary(
                    collector: $integrationSummaries,
                    status: 'skipped',
                    classification: (string) $transportClassification['classification'],
                    statusCode: $this->nullableInt($transportClassification['statusCode'] ?? null),
                    url: $xmlUrl,
                    method: $this->transportString($transport, 'method'),
                );
                $skippedCount++;

                continue;
            }

            if ($transportClassification['outcome'] === self::TRANSPORT_OUTCOME_FAILED) {
                $this->recordDetailXmlIntegrationSummary(
                    collector: $integrationSummaries,
                    status: 'failed',
                    classification: (string) $transportClassification['classification'],
                    statusCode: $this->nullableInt($transportClassification['statusCode'] ?? null),
                    url: $xmlUrl,
                    method: $this->transportString($transport, 'method'),
                );

                $this->addFailureSummary(
                    failureSummaries: $failureSummaries,
                    message: '気象庁 個別XMLを取得できず、地図ピンに追加できませんでした。',
                    errorCode: (string) $transportClassification['errorCode'],
                    classification: (string) $transportClassification['classification'],
                    statusCode: $this->nullableInt($transportClassification['statusCode'] ?? null),
                    reason: (string) $transportClassification['reason'],
                    sourceEntry: $sourceEntry,
                    url: $xmlUrl,
                    method: $this->transportString($transport, 'method'),
                );
                $failedCount++;

                continue;
            }

            $this->recordDetailXmlIntegrationSummary(
                collector: $integrationSummaries,
                status: 'success',
                classification: 'success',
                statusCode: $this->nullableInt($transportClassification['statusCode'] ?? null),
                url: $xmlUrl,
                method: $this->transportString($transport, 'method'),
            );

            try {
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
                    $this->mapPinRepository->deleteBySourceEntryId((int) $sourceEntry['id']);
                    $skippedCount++;

                    continue;
                }

                $pins[] = $pin;
            } catch (EarthquakeDetailXmlNotMappableException) {
                $this->mapPinRepository->deleteBySourceEntryId((int) $sourceEntry['id']);
                $skippedCount++;
            } catch (Throwable $exception) {
                $this->addFailureSummary(
                    failureSummaries: $failureSummaries,
                    message: '気象庁 個別XMLを解析できず、地図ピンに追加できませんでした。',
                    errorCode: self::ERROR_CODE_DETAIL_XML_PARSE_FAILED,
                    classification: 'parse_failed',
                    statusCode: null,
                    reason: $exception::class.': '.$exception->getMessage(),
                    sourceEntry: $sourceEntry,
                    url: is_string($xmlUrl) ? $xmlUrl : null,
                    method: 'GET',
                    exception: $exception,
                );
                $failedCount++;
            }
        }

        $integrationSummaries->flushIntegrationLogs();
        $this->dispatchFailureSummaries($failureSummaries);

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
     * @param  array<string, mixed>  $transport
     * @return array<string, mixed>
     */
    private function classifyTransportResult(array $transport): array
    {
        $errorMessage = $this->transportString($transport, 'error_message');

        if ($errorMessage === self::JMA_DETAIL_XML_URL_REJECTED_MESSAGE) {
            return [
                'outcome' => self::TRANSPORT_OUTCOME_SKIPPED,
                'classification' => 'url_rejected',
                'statusCode' => null,
                'reason' => self::JMA_DETAIL_XML_URL_REJECTED_MESSAGE,
            ];
        }

        $statusCode = $this->transportInt($transport, 'status_code');
        $body = $this->transportString($transport, 'body');
        $hasBody = $body !== null && trim($body) !== '';

        if (($transport['success'] ?? false) === true && $hasBody && $statusCode !== null && $statusCode >= 200 && $statusCode < 300) {
            return [
                'outcome' => self::TRANSPORT_OUTCOME_SUCCESS,
                'classification' => 'success',
                'statusCode' => $statusCode,
                'reason' => 'success',
            ];
        }

        if ($statusCode === 404) {
            return [
                'outcome' => self::TRANSPORT_OUTCOME_SKIPPED,
                'classification' => '404',
                'statusCode' => $statusCode,
                'reason' => $this->failureReason($errorMessage, '404'),
            ];
        }

        if ($statusCode !== null && $statusCode >= 200 && $statusCode < 300 && ! $hasBody) {
            return [
                'outcome' => self::TRANSPORT_OUTCOME_SKIPPED,
                'classification' => 'empty_body',
                'statusCode' => $statusCode,
                'reason' => $this->failureReason($errorMessage, 'empty_body'),
            ];
        }

        if ($statusCode === 429) {
            return $this->failedTransportClassification(
                errorCode: self::ERROR_CODE_DETAIL_XML_RATE_LIMITED,
                classification: '429',
                statusCode: $statusCode,
                reason: $errorMessage,
            );
        }

        if ($statusCode !== null && $statusCode >= 500) {
            return $this->failedTransportClassification(
                errorCode: self::ERROR_CODE_DETAIL_XML_SERVER_ERROR,
                classification: '5xx',
                statusCode: $statusCode,
                reason: $errorMessage,
            );
        }

        if ($statusCode === null) {
            return $this->failedTransportClassification(
                errorCode: self::ERROR_CODE_DETAIL_XML_CONNECTION_FAILED,
                classification: 'connection_failed',
                statusCode: null,
                reason: $errorMessage,
            );
        }

        return $this->failedTransportClassification(
            errorCode: self::ERROR_CODE_DETAIL_XML_FETCH_FAILED,
            classification: 'http_error',
            statusCode: $statusCode,
            reason: $errorMessage,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function failedTransportClassification(
        string $errorCode,
        string $classification,
        ?int $statusCode,
        ?string $reason,
    ): array {
        return [
            'outcome' => self::TRANSPORT_OUTCOME_FAILED,
            'errorCode' => $errorCode,
            'classification' => $classification,
            'statusCode' => $statusCode,
            'reason' => $this->failureReason($reason, $classification),
        ];
    }

    /**
     * 個別XML取得の transport 結果を API 連携ログの要約候補として記録します。
     *
     * XML解析失敗は外部取得自体は成功しているため、ERROR側の解析失敗要約へ分けます。
     */
    private function recordDetailXmlIntegrationSummary(
        ApplicationLogSummaryCollector $collector,
        string $status,
        string $classification,
        ?int $statusCode,
        ?string $url,
        ?string $method,
    ): void {
        $message = match ($status) {
            'success' => '気象庁 個別XML取得に成功しました。',
            'skipped' => sprintf('気象庁 個別XML取得をskipしました。分類: %s', $classification),
            default => sprintf('気象庁 個別XML取得に失敗しました。分類: %s', $classification),
        };

        $collector->recordIntegration(
            integrationType: 'external_api',
            serviceName: '気象庁XML',
            action: '個別XML取得',
            status: $status,
            message: $message,
            targetType: 'jma_xml_endpoint',
            targetId: 'document',
            url: $url,
            method: $method,
            responseStatus: $statusCode,
        );
    }

    /**
     * @param  array<string, array<string, mixed>>  $failureSummaries
     * @param  array<string, mixed>  $sourceEntry
     */
    private function addFailureSummary(
        array &$failureSummaries,
        string $message,
        string $errorCode,
        string $classification,
        ?int $statusCode,
        string $reason,
        array $sourceEntry,
        ?string $url,
        ?string $method,
        ?Throwable $exception = null,
    ): void {
        $normalizedReason = $this->failureReason($reason, $classification);
        $key = $this->failureSummaryKey($errorCode, $statusCode, $normalizedReason);

        if (! isset($failureSummaries[$key])) {
            $failureSummaries[$key] = [
                'message' => $message,
                'errorCode' => $errorCode,
                'classification' => $classification,
                'statusCode' => $statusCode,
                'reason' => $normalizedReason,
                'count' => 0,
                'sourceEntryIds' => [],
                'url' => $url,
                'method' => $method,
                'exception' => $exception,
            ];
        }

        $failureSummaries[$key]['count']++;

        if (($failureSummaries[$key]['url'] ?? null) === null && $url !== null) {
            $failureSummaries[$key]['url'] = $url;
        }

        if (($failureSummaries[$key]['method'] ?? null) === null && $method !== null) {
            $failureSummaries[$key]['method'] = $method;
        }

        $sourceEntryId = $sourceEntry['id'] ?? null;

        if (! is_int($sourceEntryId)) {
            return;
        }

        if (count($failureSummaries[$key]['sourceEntryIds']) >= self::FAILURE_SAMPLE_SOURCE_ENTRY_LIMIT) {
            return;
        }

        if (in_array($sourceEntryId, $failureSummaries[$key]['sourceEntryIds'], true)) {
            return;
        }

        $failureSummaries[$key]['sourceEntryIds'][] = $sourceEntryId;
    }

    /**
     * @param  array<string, array<string, mixed>>  $failureSummaries
     */
    private function dispatchFailureSummaries(array $failureSummaries): void
    {
        foreach ($failureSummaries as $summary) {
            $this->dispatchErrorLog(
                message: $this->failureSummaryMessage($summary),
                errorCode: (string) $summary['errorCode'],
                exception: $summary['exception'] instanceof Throwable ? $summary['exception'] : null,
                url: is_string($summary['url'] ?? null) ? $summary['url'] : null,
                method: is_string($summary['method'] ?? null) ? $summary['method'] : null,
            );
        }
    }

    /**
     * @param  array<string, mixed>  $summary
     */
    private function failureSummaryMessage(array $summary): string
    {
        $message = sprintf(
            '%s 分類: %s / 件数: %d',
            (string) $summary['message'],
            (string) $summary['classification'],
            (int) $summary['count'],
        );
        $sourceEntryIds = is_array($summary['sourceEntryIds'] ?? null) ? $summary['sourceEntryIds'] : [];

        if (count($sourceEntryIds) === 1 && is_int($sourceEntryIds[0])) {
            return sprintf('%s 対象フィードID: %d', $message, $sourceEntryIds[0]);
        }

        $sampleIds = array_values(array_filter(
            $sourceEntryIds,
            fn (mixed $sourceEntryId): bool => is_int($sourceEntryId),
        ));

        return $sampleIds === []
            ? $message
            : sprintf('%s 対象フィードID例: %s', $message, implode(', ', $sampleIds));
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

    private function failureSummaryKey(string $errorCode, ?int $statusCode, string $reason): string
    {
        return implode('|', [
            $errorCode,
            $statusCode === null ? 'none' : (string) $statusCode,
            $reason,
        ]);
    }

    private function failureReason(?string $reason, string $classification): string
    {
        $normalizedReason = is_string($reason) ? trim($reason) : '';

        return $normalizedReason === '' ? $classification : $normalizedReason;
    }

    /**
     * @param  array<string, mixed>  $transport
     */
    private function transportString(array $transport, string $key): ?string
    {
        return is_string($transport[$key] ?? null) ? $transport[$key] : null;
    }

    /**
     * @param  array<string, mixed>  $transport
     */
    private function transportInt(array $transport, string $key): ?int
    {
        return is_int($transport[$key] ?? null) ? $transport[$key] : null;
    }

    private function nullableInt(mixed $value): ?int
    {
        return is_int($value) ? $value : null;
    }
}
