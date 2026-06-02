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
 * タブ選択状態、比較日数、並び順などの画面状態は select / header field 側へ分け、
 * ここではカード一覧と空状態だけを保持します。
 */
final readonly class DanceShortDisplayCardFieldDTO
{
    public const TYPE_RANKING = 'ranking';

    public const TYPE_RISING = 'rising';

    public function __construct(
        public string $type,
        public DanceShortDisplayCardListDTO $cards,
        public string $emptyMessage,
    ) {
    }

    /**
     * @return array{
     *     type: string,
     *     cards: array<int, array<string, mixed>>,
     *     emptyMessage: string
     * }
     */
    public function toArray(): array
    {
        return [
            'type' => $this->type,
            'cards' => $this->cards->toArray()['cards'],
            'emptyMessage' => $this->emptyMessage,
        ];
    }
}
