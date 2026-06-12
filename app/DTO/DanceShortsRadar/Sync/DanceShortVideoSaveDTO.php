<?php

namespace App\DTO\DanceShortsRadar\Sync;

/*
 * dance_short_videos へ保存する動画本体情報だけを運ぶ DTO です。
 *
 * DB境界DTOなので、プロパティ名と toArray() のキーは保存先カラムに合わせて
 * snake_case にします。statistics、raw response、snapshot の派生値は持ちません。
 */
final readonly class DanceShortVideoSaveDTO
{
    /**
     * @param  array<int, string>|null  $tags
     */
    public function __construct(
        public string $youtube_video_id,
        public string $title,
        public ?string $description,
        public ?string $channel_id,
        public ?string $channel_title,
        public ?string $thumbnail_url,
        public ?string $published_at,
        public ?string $url,
        public ?string $category_id,
        public ?array $tags,
        public ?string $duration,
        public ?string $default_language,
        public ?string $default_audio_language,
        public ?string $live_broadcast_content,
        public ?bool $embeddable,
    ) {}

    /**
     * @return array{
     *     youtube_video_id: string,
     *     title: string,
     *     description: string|null,
     *     channel_id: string|null,
     *     channel_title: string|null,
     *     thumbnail_url: string|null,
     *     published_at: string|null,
     *     url: string|null,
     *     category_id: string|null,
     *     tags: array<int, string>|null,
     *     duration: string|null,
     *     default_language: string|null,
     *     default_audio_language: string|null,
     *     live_broadcast_content: string|null,
     *     embeddable: bool|null
     * }
     */
    public function toArray(): array
    {
        return [
            'youtube_video_id' => $this->youtube_video_id,
            'title' => $this->title,
            'description' => $this->description,
            'channel_id' => $this->channel_id,
            'channel_title' => $this->channel_title,
            'thumbnail_url' => $this->thumbnail_url,
            'published_at' => $this->published_at,
            'url' => $this->url,
            'category_id' => $this->category_id,
            'tags' => $this->tags,
            'duration' => $this->duration,
            'default_language' => $this->default_language,
            'default_audio_language' => $this->default_audio_language,
            'live_broadcast_content' => $this->live_broadcast_content,
            'embeddable' => $this->embeddable,
        ];
    }
}
