<?php

namespace App\DTO\DanceShortsAnalyzer\Analyze;

/**
 * DanceShortsAnalyzer Analyze 画面の query 入力 DTO です。
 *
 * video_ids は dance_short_videos の主キーだけを持ちます。
 * YouTube video id では snapshot 取得対象を一意に扱えないため、Analyze 側では使いません。
 */
final readonly class DanceShortsAnalyzerAnalyzeInputDTO
{
    public const MAX_VIDEO_IDS = 5;

    /**
     * @param  array<int, int>  $videoIds
     * @param  int|null  $activeVideoId  表示中動画の dance_short_videos 主キーです。
     */
    public function __construct(
        public array $videoIds,
        public ?int $activeVideoId,
    ) {}
}
