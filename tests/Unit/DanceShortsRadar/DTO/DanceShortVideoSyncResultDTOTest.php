<?php

namespace Tests\Unit\DanceShortsRadar\DTO;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSyncResultDTO;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class DanceShortVideoSyncResultDTOTest extends TestCase
{
    public function test_to_array_returns_sync_result_counts(): void
    {
        /*
         * ResultDTO は同期結果の数値を運ぶ境界です。
         * toArray() のキーを固定しておくことで、後続の保存・表示レイヤーが参照する構造を
         * API 接続前の段階で壊れにくくします。
         */
        $dto = new DanceShortVideoSyncResultDTO(
            executedAt: CarbonImmutable::parse('2026-05-31 12:34:56', 'Asia/Tokyo'),
            searchedRegionCount: 2,
            searchedKeywordCount: 5,
            fetchedVideoCount: 20,
            fetchedVideoDetailCount: 18,
            insertedVideoCount: 7,
            updatedVideoCount: 5,
            savedVideoCount: 12,
            savedSnapshotCount: 10,
            skippedVideoCount: 8,
            excludedByShortsCount: 3,
            skippedPersistenceCount: 2,
            failedCount: 1,
        );

        $this->assertSame([
            'executedAt' => '2026-05-31T12:34:56+09:00',
            'searchedRegionCount' => 2,
            'searchedKeywordCount' => 5,
            'fetchedVideoCount' => 20,
            'fetchedVideoDetailCount' => 18,
            'insertedVideoCount' => 7,
            'updatedVideoCount' => 5,
            'savedVideoCount' => 12,
            'savedSnapshotCount' => 10,
            'skippedVideoCount' => 8,
            'excludedByShortsCount' => 3,
            'skippedPersistenceCount' => 2,
            'failedCount' => 1,
        ], $dto->toArray());
    }
}
