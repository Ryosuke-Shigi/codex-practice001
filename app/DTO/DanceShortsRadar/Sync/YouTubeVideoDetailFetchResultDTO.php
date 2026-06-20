<?php

namespace App\DTO\DanceShortsRadar\Sync;

final readonly class YouTubeVideoDetailFetchResultDTO
{
    /**
     * @param  array<int, YouTubeVideoDetailDTO>  $details
     */
    public function __construct(
        public array $details,
        public int $targetVideoIdCount = 0,
        public int $apiCallCount = 0,
        public int $successfulChunkCount = 0,
        public int $failedChunkCount = 0,
        public int $failedTargetVideoIdCount = 0,
    ) {}
}
