<?php

namespace App\DTO\Earthquake\Preview;

/*
 * JMA Atom feed 全体を Preview 画面へ渡すための DTO です。
 *
 * feedTitle / feedUpdatedAt は feed 自体の情報、entries は Atom entry 一覧です。
 * 個別 XML 電文の本文や raw XML 全文は持たせず、画面確認に必要な範囲へ絞ります。
 */
final readonly class EarthquakeXmlFeedPreviewDTO
{
    public function __construct(
        public ?string $feedTitle,
        public ?string $feedUpdatedAt,
        public EarthquakeXmlEntryPreviewListDTO $entries,
    ) {}

    /**
     * @return array{
     *     feedTitle: string|null,
     *     feedUpdatedAt: string|null,
     *     entries: array{items: array<int, array<string, string|null>>, count: int}
     * }
     */
    public function toArray(): array
    {
        // Inertia props の最上位 result.feed に入る形へ整えます。
        return [
            'feedTitle' => $this->feedTitle,
            'feedUpdatedAt' => $this->feedUpdatedAt,
            'entries' => $this->entries->toArray(),
        ];
    }
}
