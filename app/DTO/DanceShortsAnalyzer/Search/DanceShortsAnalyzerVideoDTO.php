<?php

namespace App\DTO\DanceShortsAnalyzer\Search;

use Carbon\CarbonInterface;

/*
 * DanceShortsAnalyzer の検索結果カードへ渡す動画本体 DTO です。
 *
 * dance_short_videos の保存値だけを持ち、YouTube Shorts URL や Inertia props の形は
 * Responder 側で整えます。snapshot 由来の metric は PR1 の対象外なので含めません。
 */
final readonly class DanceShortsAnalyzerVideoDTO
{
    /**
     * @param  int  $videoId  dance_short_videos の主キーです。
     * @param  string  $youtubeVideoId  Shorts URL 生成の元になる YouTube video id です。
     * @param  string  $title  カードに表示する保存済みタイトルです。
     * @param  string|null  $channelTitle  保存済み channel title です。
     * @param  string|null  $thumbnailUrl  保存済みサムネイル URL です。
     * @param  CarbonInterface|null  $publishedAt  登録日並び替えと表示に使う公開日時です。
     * @param  string  $trackingStatus  保存済み tracking status です。
     */
    public function __construct(
        public int $videoId,
        public string $youtubeVideoId,
        public string $title,
        public ?string $channelTitle,
        public ?string $thumbnailUrl,
        public ?CarbonInterface $publishedAt,
        public string $trackingStatus,
    ) {
    }
}
