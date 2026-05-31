<?php

namespace App\DTO\DanceShortsRadar\Sync;

use Carbon\CarbonInterface;

final readonly class DanceShortVideoSyncResultDTO
{
    public function __construct(
        public CarbonInterface $executedAt,
        public int $searchedRegionCount = 0,
        public int $searchedKeywordCount = 0,
        public int $fetchedVideoCount = 0,
        public int $savedVideoCount = 0,
        public int $savedSnapshotCount = 0,
        public int $skippedVideoCount = 0,
        public int $failedCount = 0,
    ) {
    }

    /**
     * @return array<string, int|string>
     */
    public function toArray(): array
    {
        /*
         * DTO の責務は同期結果の値をレイヤー間で運ぶことと、保持値を配列化することまでです。
         * HTTPレスポンス生成、JSONレスポンス生成、画面表示用の文言・状態判断はここに置きません。
         *
         * プロパティ名は業務結果DTOとして camelCase に揃え、DBカラムや外部APIの形に
         * 引きずられないようにします。
         */
        return [
            'executedAt' => $this->executedAt->toIso8601String(),
            'searchedRegionCount' => $this->searchedRegionCount,
            'searchedKeywordCount' => $this->searchedKeywordCount,
            'fetchedVideoCount' => $this->fetchedVideoCount,
            'savedVideoCount' => $this->savedVideoCount,
            'savedSnapshotCount' => $this->savedSnapshotCount,
            'skippedVideoCount' => $this->skippedVideoCount,
            'failedCount' => $this->failedCount,
        ];
    }
}
