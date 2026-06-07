<?php

namespace Tests\Unit\DanceShortsRadar\DTO;

use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchItemDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchResultDTO;
use PHPUnit\Framework\TestCase;

class YouTubeVideoSearchResultDTOTest extends TestCase
{
    public function test_it_keeps_search_items_and_next_page_token(): void
    {
        $item = new YouTubeVideoSearchItemDTO(
            youtubeVideoId: 'search-video-001',
            title: null,
            description: null,
            channelId: null,
            channelTitle: null,
            publishedAt: null,
            thumbnailUrl: null,
        );

        $dto = new YouTubeVideoSearchResultDTO(
            items: [$item],
            nextPageToken: 'next-token',
        );

        $this->assertSame([$item], $dto->items);
        $this->assertSame('next-token', $dto->nextPageToken);
    }
}
