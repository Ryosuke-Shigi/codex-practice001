<?php

namespace App\Services\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingConditionDTO;
use Carbon\CarbonInterface;

class DanceShortSnapshotMetricService
{
    /**
     * @return array<int, int>
     */
    public function allowedComparisonDays(): array
    {
        /*
         * comparisonDays は「何日前と比較するか」という Query 条件です。
         * 表示 UI の選択肢と同じ値だけを返し、Service 利用側が別の期間を暗黙に採用しないようにします。
         */
        return DanceShortVideoRankingConditionDTO::ALLOWED_COMPARISON_DAYS;
    }

    public function normalizeComparisonDays(?int $comparisonDays): int
    {
        /*
         * Request 層は形式検証だけに留め、Query 土台では DTO 経由の値をここで安全側へ丸めます。
         * 不正値は例外ではなく初期値の 1日に戻し、取得開始直後のランキング確認を安定して続行します。
         */
        if (in_array($comparisonDays, DanceShortVideoRankingConditionDTO::ALLOWED_COMPARISON_DAYS, true)) {
            return (int) $comparisonDays;
        }

        return DanceShortVideoRankingConditionDTO::DEFAULT_COMPARISON_DAYS;
    }

    /**
     * @return array<int, string>
     */
    public function allowedSortKeys(): array
    {
        /*
         * sortKey は DB カラム名ではなく、snapshot 比較から作る表示用指標のキーです。
         * Repository へ渡す検索条件と混同しないよう、この Service でランキング用の許可値を閉じます。
         */
        return DanceShortVideoRankingConditionDTO::ALLOWED_SORT_KEYS;
    }

    public function normalizeSortKey(?string $sortKey): string
    {
        /*
         * 未知の sortKey を Action 側の match に流さず、初期表示方針の views_per_hour に戻します。
         * 画面接続前の Query 土台でも、将来 Request が入ったときの防波堤としてここに置きます。
         */
        if (in_array($sortKey, DanceShortVideoRankingConditionDTO::ALLOWED_SORT_KEYS, true)) {
            return (string) $sortKey;
        }

        return DanceShortVideoRankingConditionDTO::DEFAULT_SORT_KEY;
    }

    /**
     * @return array{
     *     viewCountDelta: int|null,
     *     viewGrowthRate: float|null,
     *     viewsPerHour: float|null
     * }
     */
    public function calculateSnapshotMetrics(
        ?int $previousViewCount,
        ?CarbonInterface $previousCollectedAt,
        int $currentViewCount,
        CarbonInterface $currentCollectedAt,
    ): array {
        /*
         * 派生値は保存済み snapshot から毎回計算します。
         * DB へ view_count_delta / view_growth_rate / views_per_hour を持たせないことで、
         * comparisonDays を変えたときにも履歴の再保存なしで別期間の比較値を作れます。
         */
        if ($previousViewCount === null || $previousCollectedAt === null) {
            return [
                'viewCountDelta' => null,
                'viewGrowthRate' => null,
                'viewsPerHour' => null,
            ];
        }

        $viewCountDelta = $currentViewCount - $previousViewCount;
        $hours = $previousCollectedAt->diffInSeconds($currentCollectedAt, false) / 3600;

        /*
         * growthRate は previous が 0 のときだけ null にします。
         * viewsPerHour は current と previous の時刻差が正の場合だけ算出します。
         * どちらも「計算不能」を 0 として潰すと、本当に増加していないケースと区別できなくなるためです。
         */
        return [
            'viewCountDelta' => $viewCountDelta,
            'viewGrowthRate' => $previousViewCount > 0 ? $viewCountDelta / $previousViewCount : null,
            'viewsPerHour' => $hours > 0.0 ? $viewCountDelta / $hours : null,
        ];
    }
}
