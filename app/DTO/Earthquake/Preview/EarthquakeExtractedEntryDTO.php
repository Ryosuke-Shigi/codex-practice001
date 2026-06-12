<?php

namespace App\DTO\Earthquake\Preview;

/*
 * Atom entry 一覧から「地震情報として扱う」と抽出した結果を表す Preview DTO です。
 *
 * EarthquakeXmlEntryPreviewDTO は feed から読めた事実そのもの、
 * EarthquakeExtractedEntryDTO は暫定抽出条件を通過した地震系 entry という意味を持たせます。
 * DB 保存や地図 pin 変換の DTO ではなく、Preview 内の次段階判断に使うための薄い DTO です。
 */
final readonly class EarthquakeExtractedEntryDTO
{
    /*
     * プロパティは EarthquakeXmlEntryPreviewDTO と同じ形にそろえます。
     * ここで項目を増やさないことで、抽出 Service は「対象 entry の選別」だけに集中でき、
     * 個別 XML 解析で得る震源・震度・マグニチュードなどを混ぜ込まない境界になります。
     */
    public function __construct(
        public string $id,
        public string $title,
        public ?string $updatedAt,
        public ?string $publishedAt,
        public ?string $xmlUrl,
        public ?string $rawCategory,
        public ?string $rawAuthor,
    ) {}

    public static function fromXmlEntryPreview(EarthquakeXmlEntryPreviewDTO $entry): self
    {
        /*
         * Atom feed 由来の事実データは変換せず、そのまま運びます。
         * 「地震情報として採用された」という意味づけだけを DTO 型で分けます。
         */
        return new self(
            id: $entry->id,
            title: $entry->title,
            updatedAt: $entry->updatedAt,
            publishedAt: $entry->publishedAt,
            xmlUrl: $entry->xmlUrl,
            rawCategory: $entry->rawCategory,
            rawAuthor: $entry->rawAuthor,
        );
    }

    /**
     * @return array{
     *     id: string,
     *     title: string,
     *     updatedAt: string|null,
     *     publishedAt: string|null,
     *     xmlUrl: string|null,
     *     rawCategory: string|null,
     *     rawAuthor: string|null
     * }
     */
    public function toArray(): array
    {
        // React props や test assertion で扱いやすい camelCase のまま公開します。
        return [
            'id' => $this->id,
            'title' => $this->title,
            'updatedAt' => $this->updatedAt,
            'publishedAt' => $this->publishedAt,
            'xmlUrl' => $this->xmlUrl,
            'rawCategory' => $this->rawCategory,
            'rawAuthor' => $this->rawAuthor,
        ];
    }
}
