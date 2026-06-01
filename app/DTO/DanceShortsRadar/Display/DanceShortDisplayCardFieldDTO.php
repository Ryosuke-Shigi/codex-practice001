<?php

namespace App\DTO\DanceShortsRadar\Display;

/*
 * DanceShortsRadar の現在条件に対応する表示カードフィールド DTO です。
 *
 * type は通常ランキングカードか上昇候補カードかを表します。cards の中身は無理に同じ型へ
 * そろえず、ranking / rising それぞれの表示カード DTO を保持します。
 * Inertia props 用の snake_case 配列化は Responder 側へ残します。
 *
 * この DTO が担うのは「今回の query 条件で表示するカードフィールドは何か」を運ぶことだけです。
 * selectedTab / comparisonDays / sortKey は画面の状態表示とテスト固定用に保持しますが、
 * ここでタブ選択、ランキング計算、空文言の分岐、React 用 props 名への変換は行いません。
 */
final readonly class DanceShortDisplayCardFieldDTO
{
    public const TYPE_RANKING = 'ranking';

    public const TYPE_RISING = 'rising';

    public function __construct(
        public string $type,
        public string $selectedTab,
        public int $comparisonDays,
        public string $sortKey,
        public DanceShortDisplayCardListDTO $cards,
        public string $emptyMessage,
    ) {
    }

    /**
     * @return array{
     *     type: string,
     *     selectedTab: string,
     *     comparisonDays: int,
     *     sortKey: string,
     *     cards: array<int, array<string, mixed>>,
     *     emptyMessage: string
     * }
     */
    public function toArray(): array
    {
        return [
            'type' => $this->type,
            'selectedTab' => $this->selectedTab,
            'comparisonDays' => $this->comparisonDays,
            'sortKey' => $this->sortKey,
            'cards' => $this->cards->toArray()['cards'],
            'emptyMessage' => $this->emptyMessage,
        ];
    }
}
