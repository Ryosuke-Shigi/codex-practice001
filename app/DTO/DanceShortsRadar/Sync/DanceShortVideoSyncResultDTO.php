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
        public int $fetchedVideoDetailCount = 0,
        public int $insertedVideoCount = 0,
        public int $updatedVideoCount = 0,
        public int $savedVideoCount = 0,
        public int $savedSnapshotCount = 0,
        public int $skippedVideoCount = 0,
        public int $skippedSnapshotByTrackingCount = 0,
        public int $excludedByShortsCount = 0,
        public int $skippedPersistenceCount = 0,
        public int $cleanedUpSnapshotCount = 0,
        public int $failedCount = 0,
    ) {}

    /**
     * ランキング read model の再生成が必要な元データ変更を伴う結果かを返します。
     */
    public function hasRankingSourceChange(): bool
    {
        /*
         * search / fetch / failure の発生だけでは表示用ランキングの元データは変わりません。
         * video / snapshot の保存、または snapshot cleanup があった時だけ refresh event の対象にします。
         */
        return $this->insertedVideoCount > 0
            || $this->updatedVideoCount > 0
            || $this->savedVideoCount > 0
            || $this->savedSnapshotCount > 0
            || $this->cleanedUpSnapshotCount > 0;
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
            'fetchedVideoDetailCount' => $this->fetchedVideoDetailCount,
            'insertedVideoCount' => $this->insertedVideoCount,
            'updatedVideoCount' => $this->updatedVideoCount,
            'savedVideoCount' => $this->savedVideoCount,
            'savedSnapshotCount' => $this->savedSnapshotCount,
            'skippedVideoCount' => $this->skippedVideoCount,
            'skippedSnapshotByTrackingCount' => $this->skippedSnapshotByTrackingCount,
            'excludedByShortsCount' => $this->excludedByShortsCount,
            'skippedPersistenceCount' => $this->skippedPersistenceCount,
            'cleanedUpSnapshotCount' => $this->cleanedUpSnapshotCount,
            'failedCount' => $this->failedCount,
        ];
    }
}
