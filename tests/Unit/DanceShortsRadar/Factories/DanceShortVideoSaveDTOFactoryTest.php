<?php

namespace Tests\Unit\DanceShortsRadar\Factories;

use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailDTO;
use App\Factories\DanceShortsRadar\DanceShortVideoSaveDTOFactory;
use PHPUnit\Framework\TestCase;

class DanceShortVideoSaveDTOFactoryTest extends TestCase
{
    public function test_it_maps_youtube_detail_to_video_save_dto(): void
    {
        $dto = (new DanceShortVideoSaveDTOFactory)->fromYouTubeVideoDetail(new YouTubeVideoDetailDTO(
            youtubeVideoId: 'video-001',
            title: ' Dance short ',
            description: 'Dance description.',
            channelId: 'channel-001',
            channelTitle: 'Dance Channel',
            thumbnailUrl: 'https://example.test/high.jpg',
            publishedAt: '2026-05-31T12:00:00+09:00',
            categoryId: '10',
            tags: [' dance ', '', 'shorts'],
            duration: 'PT58S',
            defaultLanguage: 'ja',
            defaultAudioLanguage: 'ja',
            liveBroadcastContent: 'none',
            embeddable: true,
            viewCount: 123456,
            likeCount: 789,
            commentCount: 12,
        ));

        $this->assertSame('video-001', $dto->youtube_video_id);
        $this->assertSame('Dance short', $dto->title);
        $this->assertSame('2026-05-31 12:00:00', $dto->published_at);
        $this->assertSame('https://www.youtube.com/shorts/video-001', $dto->url);
        $this->assertSame(['dance', 'shorts'], $dto->tags);
        $this->assertArrayNotHasKey('view_count', $dto->toArray());
    }
}
