<?php

namespace App\Factories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSaveDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailDTO;
use App\Support\ApplicationTimeZone;
use Carbon\CarbonImmutable;
use Throwable;

class DanceShortVideoSaveDTOFactory
{
    public function fromYouTubeVideoDetail(YouTubeVideoDetailDTO $detail): DanceShortVideoSaveDTO
    {
        /*
         * YouTubeVideoDetailDTO は videos.list の事実データを camelCase で持つ API 境界 DTO です。
         * dance_short_videos へ保存するときは DB カラムに合わせた snake_case DTO へ写し替えます。
         *
         * viewCount / likeCount / commentCount は動画本体ではなく snapshot の責務なので、
         * この Factory では意図的に触りません。
         */
        return new DanceShortVideoSaveDTO(
            youtube_video_id: trim($detail->youtubeVideoId),
            title: trim((string) $detail->title),
            description: $this->blankToNull($detail->description),
            channel_id: $this->blankToNull($detail->channelId),
            channel_title: $this->blankToNull($detail->channelTitle),
            thumbnail_url: $this->blankToNull($detail->thumbnailUrl),
            published_at: $this->dateTimeString($detail->publishedAt),
            url: $this->youtubeShortsUrl($detail->youtubeVideoId),
            category_id: $this->blankToNull($detail->categoryId),
            tags: $this->tags($detail->tags),
            duration: $this->blankToNull($detail->duration),
            default_language: $this->blankToNull($detail->defaultLanguage),
            default_audio_language: $this->blankToNull($detail->defaultAudioLanguage),
            live_broadcast_content: $this->blankToNull($detail->liveBroadcastContent),
            embeddable: $detail->embeddable,
        );
    }

    private function blankToNull(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }

    private function dateTimeString(?string $value): ?string
    {
        $value = $this->blankToNull($value);

        if ($value === null) {
            return null;
        }

        try {
            return CarbonImmutable::parse($value)
                ->setTimezone(ApplicationTimeZone::name())
                ->toDateTimeString();
        } catch (Throwable) {
            return null;
        }
    }

    private function youtubeShortsUrl(string $youtubeVideoId): ?string
    {
        $youtubeVideoId = trim($youtubeVideoId);

        if ($youtubeVideoId === '') {
            return null;
        }

        return sprintf('https://www.youtube.com/shorts/%s', $youtubeVideoId);
    }

    /**
     * @param  array<int, string>  $tags
     * @return array<int, string>|null
     */
    private function tags(array $tags): ?array
    {
        $tags = array_values(array_filter(
            array_map(
                fn (string $tag): string => trim($tag),
                $tags,
            ),
            fn (string $tag): bool => $tag !== '',
        ));

        return $tags === [] ? null : $tags;
    }
}
