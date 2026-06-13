<?php

namespace App\Enums\DanceShortsRadar;

/**
 * DanceShortsRadar の keyword 検索範囲を表す enum です。
 *
 * `standard` は通常同期、`expanded` は page2 同期対象判定にも使います。
 * enum は候補値の境界だけを表し、同期可否や page 数判断は Repository / Action 側へ分けます。
 */
enum DanceShortSearchScope: string
{
    case Standard = 'standard';
    case Expanded = 'expanded';
}
