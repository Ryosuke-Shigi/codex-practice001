<?php

namespace App\Services\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardPaginationDTO;

/**
 * DanceShortsRadar の表示カード window を決める Service です。
 *
 * 画面は「現在見えている最大5件」だけを初期 props と API で受け取り、React 側が
 * 前後 window を cache / prefetch します。そのため、ここでは DB や HTTP には触れず、
 * startRank の正規化、必要取得件数、hasNext / hasPrev の判定だけを扱います。
 *
 * この計算を Action から切り出しておくと、初期表示と追加読み込み API が同じ
 * window ルールを共有でき、React 側へランキング全件や総件数の判断を漏らさずに済みます。
 */
class DanceShortDisplayCardWindowService
{
    public const DEFAULT_WINDOW_SIZE = 5;

    public const MAX_WINDOW_SIZE = 5;

    public function normalizeWindowSize(?int $windowSize): int
    {
        /*
         * UI 仕様上は 5件 window 固定です。
         * query で過大な windowSize を受けても MAX_WINDOW_SIZE に丸め、API 経由で
         * 想定より大きなカード配列を返さないようにします。
         */
        if ($windowSize === null || $windowSize < 1) {
            return self::DEFAULT_WINDOW_SIZE;
        }

        return min($windowSize, self::MAX_WINDOW_SIZE);
    }

    public function normalizeStartRank(?int $startRank, int $windowSize): int
    {
        $safeStartRank = max(1, $startRank ?? 1);

        /*
         * startRank は任意の順位を受けられますが、表示単位は windowSize ごとの先頭順位です。
         * たとえば windowSize=5 なら 1-5 は 1、6-10 は 6 にそろえることで、
         * cache key と API URL が同じ window を一意に指せます。
         */
        return intdiv($safeStartRank - 1, $windowSize) * $windowSize + 1;
    }

    public function fetchLimitFor(int $startRank, int $windowSize): int
    {
        /*
         * RankingCandidatesAction は「先頭から limit 件」を返すため、6位開始の window なら
         * 1-11位まで取得する必要があります。6-10位が表示分、11位が hasNext 判定用の
         * lookahead です。
         */
        return $startRank + $windowSize;
    }

    /**
     * @template T
     *
     * @param  array<int, T>  $items
     * @return array{visibleItems: array<int, T>, pagination: DanceShortDisplayCardPaginationDTO}
     */
    public function buildWindow(array $items, int $startRank, int $windowSize): array
    {
        /*
         * windowSize + 1 件だけ切り出し、最後の1件を「次 window が存在するか」の確認に使います。
         * 総件数を別途数えなくても hasNext を判定でき、カード本体として React に返すのは
         * visibleItems の最大 windowSize 件だけにできます。
         */
        return $this->buildWindowFromLookahead(
            lookaheadItems: array_slice($items, $startRank - 1, $windowSize + 1),
            startRank: $startRank,
            windowSize: $windowSize,
        );
    }

    /**
     * @template T
     *
     * @param  array<int, T>  $lookaheadItems
     * @return array{visibleItems: array<int, T>, pagination: DanceShortDisplayCardPaginationDTO}
     */
    public function buildWindowFromLookahead(array $lookaheadItems, int $startRank, int $windowSize): array
    {
        /*
         * Repository がすでに startRank から windowSize + 1 件だけ取得した場合の入口です。
         * Strategy はこのメソッドを使い、Action 内で「全件配列を作ってから slice する」流れへ
         * 戻さずに pagination だけを共通ルールで作ります。
         */
        $visibleItems = array_slice($lookaheadItems, 0, $windowSize);
        $hasNext = count($lookaheadItems) > $windowSize;
        $hasPrev = $startRank > 1;

        return [
            'visibleItems' => $visibleItems,
            'pagination' => new DanceShortDisplayCardPaginationDTO(
                startRank: $startRank,
                windowSize: $windowSize,
                hasPrev: $hasPrev,
                hasNext: $hasNext,
                prevStartRank: $hasPrev ? max(1, $startRank - $windowSize) : null,
                nextStartRank: $hasNext ? $startRank + $windowSize : null,
            ),
        ];
    }

    /**
     * @template T
     *
     * @param  array<int, T>  $items
     * @param  callable(T): int  $videoIdResolver
     * @return array{visibleItems: array<int, T>, pagination: DanceShortDisplayCardPaginationDTO, activeIndex: int, activeRank: int|null}
     */
    public function buildWindowAroundSelectedVideo(
        array $items,
        int $selectedVideoId,
        int $windowSize,
        callable $videoIdResolver,
    ): array {
        $selectedIndex = null;

        foreach ($items as $index => $item) {
            if ($videoIdResolver($item) === $selectedVideoId) {
                $selectedIndex = $index;
                break;
            }
        }

        if ($selectedIndex === null) {
            $window = $this->buildWindow($items, 1, $windowSize);

            return [
                'visibleItems' => $window['visibleItems'],
                'pagination' => $window['pagination'],
                'activeIndex' => 0,
                'activeRank' => $this->activeRankFor(
                    startRank: 1,
                    activeIndex: 0,
                    hasVisibleCards: count($window['visibleItems']) > 0,
                ),
            ];
        }

        $selectedRank = $selectedIndex + 1;
        $startRank = $this->centeredStartRank(
            selectedRank: $selectedRank,
            totalItemCount: count($items),
            windowSize: $windowSize,
        );
        $activeIndex = $selectedRank - $startRank;
        $window = $this->buildWindow($items, $startRank, $windowSize);

        return [
            'visibleItems' => $window['visibleItems'],
            'pagination' => $window['pagination'],
            'activeIndex' => $activeIndex,
            'activeRank' => $this->activeRankFor(
                startRank: $startRank,
                activeIndex: $activeIndex,
                hasVisibleCards: count($window['visibleItems']) > 0,
            ),
        ];
    }

    public function activeRankFor(int $startRank, int $activeIndex, bool $hasVisibleCards): ?int
    {
        /*
         * activeRank は「画面に出ているカードの順位バッジ」に使う値です。
         * 空 window では 1位のような誤った順位を表示しないよう null を返します。
         */
        return $hasVisibleCards ? $startRank + $activeIndex : null;
    }

    private function centeredStartRank(int $selectedRank, int $totalItemCount, int $windowSize): int
    {
        $maxStartRank = max(1, $totalItemCount - $windowSize + 1);
        $idealStartRank = $selectedRank - intdiv($windowSize, 2);

        return min(max(1, $idealStartRank), $maxStartRank);
    }
}
