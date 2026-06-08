<?php

namespace App\Services\DanceShortsRadar;

class DanceShortVideoTrackingService
{
    /*
     * tracking_status は「動画本体を残すか」ではなく「今後も snapshot を積むか」を表す状態です。
     *
     * active:
     *   表示、比較、再観測に使う可能性があり、sync 時に snapshot 保存対象にします。
     * inactive:
     *   動画本体は履歴や将来の再有効化のために残しますが、snapshot は増やしません。
     * archived:
     *   観測対象から外した状態です。物理削除ではなく状態で表現し、snapshot 保存対象外にします。
     */
    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    public const STATUS_ARCHIVED = 'archived';

    /**
     * @return array<int, string>
     */
    public function allowedStatuses(): array
    {
        /*
         * 候補値を Service に閉じておくことで、Action や Repository が文字列の意味を
         * それぞれ解釈し始めるのを避けます。DB 制約や画面入力を追加する段階でも、
         * まずここを基準にして候補値を揃えます。
         */
        return [
            self::STATUS_ACTIVE,
            self::STATUS_INACTIVE,
            self::STATUS_ARCHIVED,
        ];
    }

    public function isSnapshotSaveTarget(?string $trackingStatus): bool
    {
        /*
         * snapshot は同期ごとに増える詳細履歴なので、保存対象を active に限定します。
         * null や未知の値は「安全側」として保存しない扱いにし、誤設定で履歴が増え続ける
         * 方向へ倒れないようにします。
         */
        return $trackingStatus === self::STATUS_ACTIVE;
    }

    public function snapshotRefreshTargetStatus(): string
    {
        /*
         * snapshot 専用同期の対象条件も「今後も観測する動画」と同じ active に揃えます。
         * Repository へはこの文字列を条件として渡し、Repository 側では active の意味判断を行いません。
         */
        return self::STATUS_ACTIVE;
    }
}
