<?php

namespace App\Actions\DanceShortsRadar\Commands;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSyncResultDTO;
use Carbon\CarbonImmutable;

class SyncDanceShortVideosAction
{
    public function execute(): DanceShortVideoSyncResultDTO
    {
        /*
         * Action は DanceShortsRadar 同期ユースケースの手順を置く境界です。
         * 今回は YouTube Data API 未接続の土台作成なので、外部APIやDBへは触れず、
         * 後続実装が返す予定の結果DTOだけを返します。
         *
         * 将来はここから「region取得 -> keyword取得 -> YouTube検索 -> 動画詳細取得
         * -> videos upsert -> snapshots保存 -> 結果集計」の順に Repository / Service を
         * 呼び出します。増加量や伸び率は保存せず、snapshot比較から算出する派生値として
         * 別レイヤーで扱います。
         */
        return new DanceShortVideoSyncResultDTO(
            executedAt: CarbonImmutable::now(),
        );
    }
}
