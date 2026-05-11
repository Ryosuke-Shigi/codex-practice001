<?php

namespace App\DTO\Earthquake\Preview;

/*
 * Atom entry DTO の一覧をまとめる Preview 用 DTO です。
 *
 * items と count を一緒に持たせることで、React 側で entry 件数のカード表示と
 * 一覧描画が同じデータ源を参照できます。ページングや DB 件数ではなく、
 * 今回取得した feed 内の entry 数だけを表します。
 */
final readonly class EarthquakeXmlEntryPreviewListDTO
{
    /**
     * @param  array<int, EarthquakeXmlEntryPreviewDTO>  $items
     */
    public function __construct(
        public array $items,
    ) {
    }

    public function count(): int
    {
        return count($this->items);
    }

    /**
     * @return array{
     *     items: array<int, array<string, string|null>>,
     *     count: int
     * }
     */
    public function toArray(): array
    {
        // DTO のまま Inertia に渡さず、React がそのまま読める配列へ変換します。
        return [
            'items' => array_map(
                fn (EarthquakeXmlEntryPreviewDTO $item): array => $item->toArray(),
                $this->items,
            ),
            'count' => $this->count(),
        ];
    }
}
