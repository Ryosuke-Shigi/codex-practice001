<?php

namespace App\DTO\Earthquake\Preview;

/*
 * 抽出済みの地震系 Atom entry をまとめる Preview DTO です。
 *
 * count は抽出後の件数、latest() は updatedAt / publishedAt を使って
 * Preview 上で最新候補を一件確認するための helper です。
 */
final readonly class EarthquakeExtractedEntryListDTO
{
    /**
     * @param  array<int, EarthquakeExtractedEntryDTO>  $items
     */
    public function __construct(
        public array $items,
    ) {
    }

    public function count(): int
    {
        // Atom feed 全件ではなく、抽出条件を通過した地震系 entry の件数です。
        return count($this->items);
    }

    public function latest(): ?EarthquakeExtractedEntryDTO
    {
        if ($this->items === []) {
            return null;
        }

        $items = $this->items;

        /*
         * updatedAt を優先し、なければ publishedAt で比較します。
         * strtotime() できない entry は timestamp 0 として扱い、自然に後ろへ回します。
         */
        usort(
            $items,
            fn (EarthquakeExtractedEntryDTO $left, EarthquakeExtractedEntryDTO $right): int
                => $this->entryTimestamp($right) <=> $this->entryTimestamp($left),
        );

        return $items[0];
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

    private function entryTimestamp(EarthquakeExtractedEntryDTO $entry): int
    {
        /*
         * updatedAt / publishedAt は JMA Atom 由来の文字列なので、ここでは DateTime DTO へは変換しません。
         * Preview 段階では比較できれば十分なため timestamp 化に留めます。
         */
        $value = $entry->updatedAt ?? $entry->publishedAt;
        $timestamp = is_string($value) ? strtotime($value) : false;

        return $timestamp === false ? 0 : $timestamp;
    }
}
