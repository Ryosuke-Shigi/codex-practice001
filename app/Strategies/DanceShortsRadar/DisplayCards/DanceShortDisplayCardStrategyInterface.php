<?php

namespace App\Strategies\DanceShortsRadar\DisplayCards;

use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowConditionDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowDTO;

interface DanceShortDisplayCardStrategyInterface
{
    public function getWindow(
        DanceShortDisplayCardWindowConditionDTO $condition,
    ): DanceShortDisplayCardWindowDTO;
}
