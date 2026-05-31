<?php

namespace App\DTO\DanceShortsRadar\Sync;

/*
 * videos.list の1件分を、同期処理の後続工程へ渡す DTO です。
 *
 * snippet / contentDetails / statistics / status から、DB保存や snapshot 保存の
 * 検討に必要な値だけを切り出します。viewCount / likeCount / commentCount は
 * この DTO では保持しますが、dance_short_videos へ保存する値ではありません。
 * 後続工程で snapshot 側へ分けて扱うための入力値です。
 *
 * raw response 全体や favoriteCount は保持しません。Shorts判定、増加量計算、
 * 上昇候補判定、画面表示用整形も DTO の責務外です。
 */
final readonly class YouTubeVideoDetailDTO
{
    /**
     * @param  array<int, string>  $tags
     */
    public function __construct(
        public string $youtubeVideoId,
        public ?string $title,
        public ?string $description,
        public ?string $channelId,
        public ?string $channelTitle,
        public ?string $thumbnailUrl,
        public ?string $publishedAt,
        public ?string $categoryId,
        public array $tags,
        public ?string $duration,
        public ?string $defaultLanguage,
        public ?string $defaultAudioLanguage,
        public ?string $liveBroadcastContent,
        public ?bool $embeddable,
        public ?int $viewCount,
        public ?int $likeCount,
        public ?int $commentCount,
    ) {
    }

    /**
     * videos.list から切り出した値だけを camelCase の配列へ変換します。
     *
     * tags は YouTube API の配列値をそのまま運ぶだけに留めます。
     * 表示用のタグ整形やカテゴリ名解決は、DTO ではなく後続の責務に分けます。
     *
     * @return array{
     *     youtubeVideoId: string,
     *     title: string|null,
     *     description: string|null,
     *     channelId: string|null,
     *     channelTitle: string|null,
     *     thumbnailUrl: string|null,
     *     publishedAt: string|null,
     *     categoryId: string|null,
     *     tags: array<int, string>,
     *     duration: string|null,
     *     defaultLanguage: string|null,
     *     defaultAudioLanguage: string|null,
     *     liveBroadcastContent: string|null,
     *     embeddable: bool|null,
     *     viewCount: int|null,
     *     likeCount: int|null,
     *     commentCount: int|null
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
            'thumbnailUrl' => $this->thumbnailUrl,
            'publishedAt' => $this->publishedAt,
            'categoryId' => $this->categoryId,
            'tags' => $this->tags,
            'duration' => $this->duration,
            'defaultLanguage' => $this->defaultLanguage,
            'defaultAudioLanguage' => $this->defaultAudioLanguage,
            'liveBroadcastContent' => $this->liveBroadcastContent,
            'embeddable' => $this->embeddable,
            'viewCount' => $this->viewCount,
            'likeCount' => $this->likeCount,
            'commentCount' => $this->commentCount,
        ];
    }
}
