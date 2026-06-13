<?php

namespace App\Strategies\DanceShortsRadar\DisplayCards;

use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowConditionDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowDTO;

/**
 * DanceShortsRadar の表示カード取得 Strategy 契約です。
 *
 * RISING / ALL / 地域別で取得元や空状態が変わっても、Action からは同じ window DTO として扱います。
 */
interface DanceShortDisplayCardStrategyInterface
{
    /**
     * 正規化済み表示条件から表示カード window DTO を返します。
     */
    public function getWindow(
        DanceShortDisplayCardWindowConditionDTO $condition,
    ): DanceShortDisplayCardWindowDTO;
}
