<?php

namespace App\Services\DanceShortsRadar;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Throwable;

class DanceShortSnapshotRetentionService
{
    /*
     * 現在の画面比較は最大 30 日を前提にします。
     * 詳細 snapshot は比較期間ちょうどで切ると、取得タイミングの揺れや再実行遅延で
     * 境界付近の比較に必要な履歴が欠けやすいため、初期方針として 5 日の余白を足した
     * 35 日を保持期間にします。
     */
    private const MAX_COMPARISON_DAYS = 30;

    private const DEFAULT_RETENTION_DAYS = 35;

    public function maxComparisonDays(): int
    {
        return self::MAX_COMPARISON_DAYS;
    }

    public function retentionDays(int|string|null $configuredRetentionDays = null): int
    {
        /*
         * retention は DB の削除条件に直結するため、不正値や短すぎる値は採用しません。
         * 「30日比較に必要な履歴を消してしまう」事故を避けるため、30日未満や数値でない値は
         * 初期方針の 35 日へ戻します。
         */
        $configuredRetentionDays ??= $this->configuredRetentionDays();

        if (! is_numeric($configuredRetentionDays)) {
            return self::DEFAULT_RETENTION_DAYS;
        }

        $retentionDays = (int) $configuredRetentionDays;

        if ($retentionDays < self::MAX_COMPARISON_DAYS) {
            return self::DEFAULT_RETENTION_DAYS;
        }

        return $retentionDays;
    }

    public function cutoffAt(
        CarbonInterface $now,
        int|string|null $configuredRetentionDays = null,
    ): CarbonImmutable {
        /*
         * snapshot の collected_at は同期時刻として UTC で扱います。
         * 呼び出し元が Asia/Tokyo などの時刻を渡しても、Repository へ渡す cutoff は UTC に揃え、
         * DB 条件が環境 timezone に引きずられないようにします。
         */
        return CarbonImmutable::instance($now)
            ->utc()
            ->subDays($this->retentionDays($configuredRetentionDays));
    }

    private function configuredRetentionDays(): int|string|null
    {
        /*
         * この Service は PHPUnit の純 Unit テストからも直接呼びます。
         * Laravel アプリケーションコンテナが未起動の環境では config() が解決できないため、
         * その場合も本番ロジックと同じ安全な既定値へ倒します。
         */
        if (! function_exists('config')) {
            return self::DEFAULT_RETENTION_DAYS;
        }

        try {
            $configuredRetentionDays = config('dance_short.snapshot_retention_days', self::DEFAULT_RETENTION_DAYS);
        } catch (Throwable) {
            return self::DEFAULT_RETENTION_DAYS;
        }

        if (is_int($configuredRetentionDays) || is_string($configuredRetentionDays) || $configuredRetentionDays === null) {
            return $configuredRetentionDays;
        }

        return self::DEFAULT_RETENTION_DAYS;
    }
}
