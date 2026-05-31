<?php

namespace Tests\Unit\DanceShortsRadar\DTO;

use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailDTO;
use PHPUnit\Framework\TestCase;

class YouTubeVideoDetailDTOTest extends TestCase
{
    public function test_to_array_returns_only_video_detail_fields_needed_by_later_sync_steps(): void
    {
        $dto = new YouTubeVideoDetailDTO(
            youtubeVideoId: 'video-001',
            title: 'Dance short detail',
            description: 'Detail description.',
            channelId: 'channel-001',
            channelTitle: 'Dance Channel',
            thumbnailUrl: 'https://example.test/high.jpg',
            publishedAt: '2026-05-31T12:00:00Z',
            categoryId: '10',
            tags: ['dance', 'shorts'],
            duration: 'PT58S',
            defaultLanguage: 'ja',
            defaultAudioLanguage: 'ja',
            liveBroadcastContent: 'none',
            embeddable: true,
            viewCount: 123456,
            likeCount: 7890,
            commentCount: 123,
        );

        $this->assertSame([
            'youtubeVideoId' => 'video-001',
            'title' => 'Dance short detail',
            'description' => 'Detail description.',
            'channelId' => 'channel-001',
            'channelTitle' => 'Dance Channel',
            'thumbnailUrl' => 'https://example.test/high.jpg',
            'publishedAt' => '2026-05-31T12:00:00Z',
            'categoryId' => '10',
            'tags' => ['dance', 'shorts'],
            'duration' => 'PT58S',
            'defaultLanguage' => 'ja',
            'defaultAudioLanguage' => 'ja',
            'liveBroadcastContent' => 'none',
            'embeddable' => true,
            'viewCount' => 123456,
            'likeCount' => 7890,
            'commentCount' => 123,
        ], $dto->toArray());

        $this->assertArrayNotHasKey('favoriteCount', $dto->toArray());
        $this->assertArrayNotHasKey('rawPayload', $dto->toArray());
    }
}
