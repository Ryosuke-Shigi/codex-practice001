<?php

namespace App\DTO\Earthquake\Preview;

/**
 * QuakeWave XML preview の取得結果を Action から Responder へ渡す ResultDTO です。
 *
 * 外部通信の transport 情報と Atom feed DTO を同じ境界で運び、Inertia props 化は Responder に残します。
 */
final readonly class EarthquakeXmlFeedPreviewResultDTO
{
    /**
     * @param  array{status: int|null, message: string}|null  $error
     */
    public function __construct(
        public string $endpoint,
        public string $method,
        public bool $success,
        public ?int $statusCode,
        public string $fetchedAt,
        public float $responseTimeMs,
        public ?array $error,
        public ?EarthquakeXmlFeedPreviewDTO $feed,
    ) {}

    /**
     * @return array{
     *     endpoint: string,
     *     method: string,
     *     success: bool,
     *     statusCode: int|null,
     *     fetchedAt: string,
     *     responseTimeMs: float,
     *     error: array{status: int|null, message: string}|null,
     *     feed: array{
     *         feedTitle: string|null,
     *         feedUpdatedAt: string|null,
     *         entries: array{items: array<int, array<string, string|null>>, count: int}
     *     }|null
     * }
     */
    public function toArray(): array
    {
        return [
            'endpoint' => $this->endpoint,
            'method' => $this->method,
            'success' => $this->success,
            'statusCode' => $this->statusCode,
            'fetchedAt' => $this->fetchedAt,
            'responseTimeMs' => $this->responseTimeMs,
            'error' => $this->error,
            'feed' => $this->feed?->toArray(),
        ];
    }
}
