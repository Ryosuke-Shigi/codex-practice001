<?php

namespace App\DTO\DanceShortsRadar\Sync;

/*
 * search.list の1件分から、後続の videos.list に進むための最低限の値を運ぶ DTO です。
 *
 * search.list は候補動画IDを集める入口なので、statistics や contentDetails.duration は
 * ここでは扱いません。Shorts かどうかの最終判断も、この DTO ではなく videos.list の
 * duration を見られる後続 Service に委ねます。
 */
final readonly class YouTubeVideoSearchItemDTO
{
    public function __construct(
        public string $youtubeVideoId,
        public ?string $title,
        public ?string $description,
        public ?string $channelId,
        public ?string $channelTitle,
        public ?string $publishedAt,
        public ?string $thumbnailUrl,
    ) {}

    /**
     * DTO が保持している候補動画情報だけを camelCase の配列へ変換します。
     * raw response 全体、statistics、duration は境界外なので含めません。
     *
     * @return array{
     *     youtubeVideoId: string,
     *     title: string|null,
     *     description: string|null,
     *     channelId: string|null,
     *     channelTitle: string|null,
     *     publishedAt: string|null,
     *     thumbnailUrl: string|null
     * }
     */
    public function toArray(): array
    {
        return [
            'youtubeVideoId' => $this->youtubeVideoId,
            'title' => $this->title,
            'description' => $this->description,
            'channelId' => $this->channelId,
            'channelTitle' => $this->channelTitle,
            'publishedAt' => $this->publishedAt,
            'thumbnailUrl' => $this->thumbnailUrl,
        ];
    }
}
