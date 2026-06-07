<?php

namespace App\DTO\DanceShortsRadar\Sync;

final readonly class YouTubeVideoSearchResultDTO
{
    /**
     * @param  array<int, YouTubeVideoSearchItemDTO>  $items
     */
    public function __construct(
        public array $items,
        public ?string $nextPageToken,
    ) {
    }
}
