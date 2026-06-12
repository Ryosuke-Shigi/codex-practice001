<?php

namespace App\DTO\Earthquake\Preview;

/*
 * JMA Atom entry を Preview 画面で確認するための DTO です。
 *
 * DB 保存や地図 pin 変換のための DTO ではありません。
 * id / title / updated / published / link を見て、次段階でどの個別 XML を解析するか
 * 人間が判断できる最低限の情報だけを持たせます。
 */
final readonly class EarthquakeXmlEntryPreviewDTO
{
    public function __construct(
        public string $id,
        public string $title,
        public ?string $updatedAt,
        public ?string $publishedAt,
        public ?string $xmlUrl,
        public ?string $rawCategory,
        public ?string $rawAuthor,
    ) {}

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
        /*
         * React 側は camelCase props を基本にするため、PHP property 名と同じ camelCase で返します。
         * JMA XML の tag 名をそのまま漏らさず、Preview UI が読みやすい props 名にそろえます。
         */
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
