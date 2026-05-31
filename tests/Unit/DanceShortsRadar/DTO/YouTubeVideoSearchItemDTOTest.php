<?php

namespace Tests\Unit\DanceShortsRadar\DTO;

use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchItemDTO;
use PHPUnit\Framework\TestCase;

class YouTubeVideoSearchItemDTOTest extends TestCase
{
    public function test_to_array_returns_only_search_item_fields_needed_for_detail_fetch(): void
    {
        $dto = new YouTubeVideoSearchItemDTO(
            youtubeVideoId: 'video-001',
            title: 'Dance short candidate',
            description: 'Search result description.',
            channelId: 'channel-001',
            channelTitle: 'Dance Channel',
            publishedAt: '2026-05-31T12:00:00Z',
            thumbnailUrl: 'https://example.test/high.jpg',
        );

        $this->assertSame([
            'youtubeVideoId' => 'video-001',
            'title' => 'Dance short candidate',
            'description' => 'Search result description.',
            'channelId' => 'channel-001',
            'channelTitle' => 'Dance Channel',
            'publishedAt' => '2026-05-31T12:00:00Z',
            'thumbnailUrl' => 'https://example.test/high.jpg',
        ], $dto->toArray());

        $this->assertArrayNotHasKey('statistics', $dto->toArray());
        $this->assertArrayNotHasKey('duration', $dto->toArray());
        $this->assertArrayNotHasKey('rawPayload', $dto->toArray());
    }
}
