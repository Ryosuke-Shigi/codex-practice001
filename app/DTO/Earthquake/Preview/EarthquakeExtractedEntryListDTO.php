<?php

namespace App\DTO\Earthquake\Preview;

/*
 * 抽出済みの地震系 Atom entry をまとめる Preview DTO です。
 *
 * ListDTO は抽出後の entry 配列と件数を運ぶ境界に留めます。
 * 最新候補の選択は EarthquakeEntryExtractService 側で扱います。
 */
final readonly class EarthquakeExtractedEntryListDTO
{
    /**
     * @param  array<int, EarthquakeExtractedEntryDTO>  $items
     */
    public function __construct(
        public array $items,
    ) {}

    public function count(): int
    {
        // Atom feed 全件ではなく、抽出条件を通過した地震系 entry の件数です。
        return count($this->items);
    }

    /**
     * @return array{
     *     items: array<int, array{
     *         id: string,
     *         title: string,
     *         updatedAt: string|null,
     *         publishedAt: string|null,
     *         xmlUrl: string|null,
     *         rawCategory: string|null,
     *         rawAuthor: string|null
     *     }>,
     *     count: int
     * }
     */
    public function toArray(): array
    {
        return [
            'items' => array_map(
                fn (EarthquakeExtractedEntryDTO $item): array => $item->toArray(),
                $this->items,
            ),
            'count' => $this->count(),
        ];
    }
}
