<?php

namespace Tests\Unit\DanceShortsRadar\DTO;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSaveDTO;
use PHPUnit\Framework\TestCase;

class DanceShortVideoSaveDTOTest extends TestCase
{
    public function test_to_array_returns_video_save_columns_without_statistics_or_raw_payload(): void
    {
        $dto = new DanceShortVideoSaveDTO(
            youtube_video_id: 'video-001',
            title: 'Dance short',
            description: 'Dance description.',
            channel_id: 'channel-001',
            channel_title: 'Dance Channel',
            thumbnail_url: 'https://example.test/high.jpg',
            published_at: '2026-05-31 12:00:00',
            url: 'https://www.youtube.com/shorts/video-001',
            category_id: '10',
            tags: ['dance', 'shorts'],
            duration: 'PT58S',
            default_language: 'ja',
            default_audio_language: 'ja',
            live_broadcast_content: 'none',
            embeddable: true,
        );

        $this->assertSame([
            'youtube_video_id' => 'video-001',
            'title' => 'Dance short',
            'description' => 'Dance description.',
            'channel_id' => 'channel-001',
            'channel_title' => 'Dance Channel',
            'thumbnail_url' => 'https://example.test/high.jpg',
            'published_at' => '2026-05-31 12:00:00',
            'url' => 'https://www.youtube.com/shorts/video-001',
            'category_id' => '10',
            'tags' => ['dance', 'shorts'],
            'duration' => 'PT58S',
            'default_language' => 'ja',
            'default_audio_language' => 'ja',
            'live_broadcast_content' => 'none',
            'embeddable' => true,
        ], $dto->toArray());

        $this->assertArrayNotHasKey('view_count', $dto->toArray());
        $this->assertArrayNotHasKey('like_count', $dto->toArray());
        $this->assertArrayNotHasKey('comment_count', $dto->toArray());
        $this->assertArrayNotHasKey('raw_payload', $dto->toArray());
    }
}
