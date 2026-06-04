<?php

namespace App\DTO\DanceShortsRadar\Display;

/*
 * displayCardField の window 取得条件を運ぶ DTO です。
 *
 * selectedTabCode は画面タブとして解決済みの値、activeRegionCodes は DB 上で有効な
 * region code の一覧です。selectedVideoId は任意の選択カード条件です。
 * DTO は条件を保持するだけに留め、タブ選択、window 正規化、Strategy 選択、
 * DB 取得はそれぞれ外側の責務へ分けます。
 */
final readonly class DanceShortDisplayCardWindowConditionDTO
{
    /**
     * @param  array<int, string>  $activeRegionCodes
     */
    public function __construct(
        public string $selectedTabCode,
        public array $activeRegionCodes,
        public int $comparisonDays,
        public string $sortKey,
        public int $startRank,
        public int $windowSize,
        public ?int $selectedVideoId = null,
    ) {
    }
}
