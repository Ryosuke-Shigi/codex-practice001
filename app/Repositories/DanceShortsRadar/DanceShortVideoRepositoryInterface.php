<?php

namespace App\Repositories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSaveDTO;
use App\Models\DanceShortVideo;

interface DanceShortVideoRepositoryInterface
{
    public const UPSERT_INSERTED = 'inserted';

    public const UPSERT_UPDATED = 'updated';

    public const UPSERT_SKIPPED = 'skipped';

    public function findByYoutubeVideoId(string $youtubeVideoId): ?DanceShortVideo;

    /**
     * @return array{
     *     video: DanceShortVideo,
     *     status: self::UPSERT_INSERTED|self::UPSERT_UPDATED|self::UPSERT_SKIPPED
     * }
     */
    public function upsert(DanceShortVideoSaveDTO $dto): array;
}
