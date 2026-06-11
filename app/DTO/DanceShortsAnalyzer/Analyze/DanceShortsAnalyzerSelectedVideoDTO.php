<?php

namespace App\DTO\DanceShortsAnalyzer\Analyze;

use Carbon\CarbonInterface;

/**
 * Analyze 画面で選択済み動画として扱う動画本体 DTO です。
 *
 * YouTube URL や表示用日時は Responder で整えます。
 */
final readonly class DanceShortsAnalyzerSelectedVideoDTO
{
    public function __construct(
        public int $videoId,
        public string $youtubeVideoId,
        public string $title,
        public ?string $channelTitle,
        public ?string $thumbnailUrl,
        public ?CarbonInterface $publishedAt,
        public string $trackingStatus,
        public ?DanceShortsAnalyzerSnapshotPointDTO $latestSnapshot,
    ) {}
}
