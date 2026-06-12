<?php

namespace App\DTO\DanceShortsRadar\Cleanup;

use Carbon\CarbonInterface;

final readonly class DanceShortSnapshotCleanupResultDTO
{
    /*
     * cleanup の結果を Action / Command / 将来の同期履歴保存へ運ぶ DTO です。
     * 削除条件の判断や DB 操作は持たせず、いつ、どの cutoff で、何件消したかだけを保持します。
     */
    public function __construct(
        public CarbonInterface $executedAt,
        public CarbonInterface $cutoffAt,
        public int $retentionDays,
        public int $deletedSnapshotCount,
    ) {}

    /**
     * @return array<string, int|string>
     */
    public function toArray(): array
    {
        /*
         * DTO の配列化は保持値の変換までに限定します。
         * Command の出力文言、JSON レスポンス生成、画面表示ラベルはこの DTO へ混ぜません。
         */
        return [
            'executedAt' => $this->executedAt->toIso8601String(),
            'cutoffAt' => $this->cutoffAt->toIso8601String(),
            'retentionDays' => $this->retentionDays,
            'deletedSnapshotCount' => $this->deletedSnapshotCount,
        ];
    }
}
