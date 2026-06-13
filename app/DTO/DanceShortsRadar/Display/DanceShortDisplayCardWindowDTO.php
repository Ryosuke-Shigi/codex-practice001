<?php

namespace App\DTO\DanceShortsRadar\Display;

/**
 * Strategy が返す displayCardField window の結果 DTO です。
 *
 * 現時点で外へ渡す主契約は displayCardField だけです。結果 DTO を挟んでおくことで、
 * 初期 Inertia 表示と先読み API が同じ Strategy interface を使いながら、将来必要になった
 * メタ情報を Action の戻り値へ直接増やさずに拡張できます。
 */
final readonly class DanceShortDisplayCardWindowDTO
{
    public function __construct(
        public DanceShortDisplayCardFieldDTO $displayCardField,
    ) {}
}
