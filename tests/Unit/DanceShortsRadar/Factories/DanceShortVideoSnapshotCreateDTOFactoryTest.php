<?php

namespace Tests\Unit\DanceShortsRadar\Factories;

use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailDTO;
use App\Factories\DanceShortsRadar\DanceShortVideoSnapshotCreateDTOFactory;
use Carbon\CarbonImmutable;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class DanceShortVideoSnapshotCreateDTOFactoryTest extends TestCase
{
    public function test_it_maps_youtube_detail_statistics_to_snapshot_create_dto(): void
    {
        $dto = (new DanceShortVideoSnapshotCreateDTOFactory)->fromYouTubeVideoDetail(
            detail: new YouTubeVideoDetailDTO(
                youtubeVideoId: 'video-001',
                title: 'Dance short',
                description: 'Dance description.',
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
                likeCount: 789,
                commentCount: 12,
            ),
            videoId: 10,
            regionId: 20,
            collectedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'UTC'),
        );

        $this->assertSame(10, $dto->video_id);
        $this->assertSame(20, $dto->region_id);
        $this->assertSame(123456, $dto->view_count);
        $this->assertSame(789, $dto->like_count);
        $this->assertSame(12, $dto->comment_count);
        $this->assertArrayNotHasKey('views_per_hour', $dto->toArray());
    }

    public function test_it_requires_view_count_for_snapshot_creation(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('YouTube video view count is required to create a snapshot.');

        (new DanceShortVideoSnapshotCreateDTOFactory)->fromYouTubeVideoDetail(
            detail: new YouTubeVideoDetailDTO(
                youtubeVideoId: 'video-001',
                title: 'Dance short',
                description: 'Dance description.',
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
                viewCount: null,
                likeCount: 789,
                commentCount: 12,
            ),
            videoId: 10,
            regionId: 20,
            collectedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'UTC'),
        );
    }
}
