<?php

namespace App\Services\ApplicationLog;

use App\Events\ApplicationLog\ApplicationErrorOccurred;
use App\Events\ApplicationLog\ApplicationIntegrationLogged;
use Throwable;

/**
 * 同じ実行単位で繰り返されるアプリログ候補を分類別の要約Eventへまとめる Collector です。
 *
 * DB保存は Listener / Repository に残し、このクラスは発火前の件数集約と代表URLの制限だけを扱います。
 */
final class ApplicationLogSummaryCollector
{
    private const SAMPLE_URL_LIMIT = 3;

    /**
     * @var array<string, array<string, mixed>>
     */
    private array $integrationSummaries = [];

    /**
     * @var array<string, array<string, mixed>>
     */
    private array $errorSummaries = [];

    /**
     * 同一実行内で同じ連携結果として扱える候補を追加します。
     *
     * responseStatus も集約キーへ含め、404 と 5xx のように確認先が違う結果は混ぜません。
     */
    public function recordIntegration(
        string $integrationType,
        ?string $serviceName,
        string $action,
        string $status,
        string $message,
        ?string $targetType = null,
        ?string $targetId = null,
        ?string $externalId = null,
        ?string $url = null,
        ?string $method = null,
        ?int $responseStatus = null,
        ?int $userId = null,
    ): void {
        $key = implode('|', [
            'integration',
            $integrationType,
            $serviceName ?? '',
            $action,
            $status,
            $message,
            $targetType ?? '',
            $targetId ?? '',
            $method ?? '',
            $responseStatus === null ? 'none' : (string) $responseStatus,
        ]);

        if (! isset($this->integrationSummaries[$key])) {
            $this->integrationSummaries[$key] = [
                'integrationType' => $integrationType,
                'serviceName' => $serviceName,
                'action' => $action,
                'status' => $status,
                'message' => $message,
                'targetType' => $targetType,
                'targetId' => $targetId,
                'externalId' => $externalId,
                'url' => $url,
                'method' => $method,
                'responseStatus' => $responseStatus,
                'userId' => $userId,
                'count' => 0,
                'sampleUrls' => [],
            ];
        }

        $this->integrationSummaries[$key]['count']++;
        $this->addSampleUrl($this->integrationSummaries[$key], $url);
    }

    /**
     * 同一実行内で同じERRORとして扱える候補を追加します。
     *
     * 呼び出し側は、429 / 5xx など分けて見るべき分類を message か errorCode へ含めて渡します。
     */
    public function recordError(
        string $level,
        string $message,
        ?string $errorCode = null,
        ?Throwable $exception = null,
        ?string $url = null,
        ?string $method = null,
        ?int $userId = null,
    ): void {
        $key = implode('|', [
            'error',
            $level,
            $message,
            $errorCode ?? '',
            $exception === null ? '' : $exception::class,
            $method ?? '',
        ]);

        if (! isset($this->errorSummaries[$key])) {
            $this->errorSummaries[$key] = [
                'level' => $level,
                'message' => $message,
                'errorCode' => $errorCode,
                'exception' => $exception,
                'url' => $url,
                'method' => $method,
                'userId' => $userId,
                'count' => 0,
                'sampleUrls' => [],
            ];
        }

        $this->errorSummaries[$key]['count']++;
        $this->addSampleUrl($this->errorSummaries[$key], $url);
    }

    /**
     * 集約済みのAPI連携ログ候補を Event として発火し、Collector を空にします。
     */
    public function flushIntegrationLogs(): void
    {
        foreach ($this->integrationSummaries as $summary) {
            event(new ApplicationIntegrationLogged(
                integrationType: (string) $summary['integrationType'],
                serviceName: is_string($summary['serviceName']) ? $summary['serviceName'] : null,
                action: (string) $summary['action'],
                status: (string) $summary['status'],
                message: $this->summaryMessage($summary),
                targetType: is_string($summary['targetType']) ? $summary['targetType'] : null,
                targetId: is_string($summary['targetId']) ? $summary['targetId'] : null,
                externalId: is_string($summary['externalId']) ? $summary['externalId'] : null,
                url: is_string($summary['url']) ? $summary['url'] : null,
                method: is_string($summary['method']) ? $summary['method'] : null,
                responseStatus: is_int($summary['responseStatus']) ? $summary['responseStatus'] : null,
                userId: is_int($summary['userId']) ? $summary['userId'] : null,
            ));
        }

        $this->integrationSummaries = [];
    }

    /**
     * 集約済みのERRORログ候補を Event として発火し、Collector を空にします。
     */
    public function flushErrorLogs(): void
    {
        foreach ($this->errorSummaries as $summary) {
            event(new ApplicationErrorOccurred(
                level: (string) $summary['level'],
                message: $this->summaryMessage($summary),
                errorCode: is_string($summary['errorCode']) ? $summary['errorCode'] : null,
                exception: $summary['exception'] instanceof Throwable ? $summary['exception'] : null,
                url: is_string($summary['url']) ? $summary['url'] : null,
                method: is_string($summary['method']) ? $summary['method'] : null,
                userId: is_int($summary['userId']) ? $summary['userId'] : null,
            ));
        }

        $this->errorSummaries = [];
    }

    /**
     * @param  array<string, mixed>  $summary
     */
    private function addSampleUrl(array &$summary, ?string $url): void
    {
        if ($url === null || $url === '') {
            return;
        }

        if (($summary['url'] ?? null) === null) {
            $summary['url'] = $url;
        }

        if (count($summary['sampleUrls']) >= self::SAMPLE_URL_LIMIT) {
            return;
        }

        if (in_array($url, $summary['sampleUrls'], true)) {
            return;
        }

        $summary['sampleUrls'][] = $url;
    }

    /**
     * @param  array<string, mixed>  $summary
     */
    private function summaryMessage(array $summary): string
    {
        $count = (int) $summary['count'];
        $message = (string) $summary['message'];

        if ($count > 1) {
            $message = sprintf('%s 件数: %d件。', $message, $count);
        }

        $sampleUrls = is_array($summary['sampleUrls'] ?? null) ? $summary['sampleUrls'] : [];

        if ($count === 1 || $sampleUrls === []) {
            return $message;
        }

        return sprintf('%s 代表URL: %s', $message, implode(', ', $sampleUrls));
    }
}
