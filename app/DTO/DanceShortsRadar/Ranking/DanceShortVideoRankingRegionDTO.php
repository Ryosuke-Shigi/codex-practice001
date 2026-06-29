<?php

namespace App\DTO\DanceShortsRadar\Ranking;

/*
 * 通常ランキング画面で選択できる地域を表す DTO です。
 *
 * region tab は DB の active region から作りますが、Responder / React へ Eloquent Model を渡さないため、
 * 画面に必要な code / name だけをここで固定します。ALL や RISING のような表示区分コードは
 * 本画面の保存済み snapshot ランキングには混ぜません。
 */
final readonly class DanceShortVideoRankingRegionDTO
{
    public function __construct(
        public string $code,
        public string $name,
    ) {}

    /**
     * @return array{code: string, name: string}
     */
    public function toArray(): array
    {
        return [
            'code' => $this->code,
            'name' => $this->name,
        ];
    }
}
