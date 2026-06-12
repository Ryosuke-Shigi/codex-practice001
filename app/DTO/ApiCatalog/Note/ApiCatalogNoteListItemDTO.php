<?php

namespace App\DTO\ApiCatalog\Note;

use App\Models\ApiCatalogNote;

final readonly class ApiCatalogNoteListItemDTO
{
    public function __construct(
        public int $id,
        public ?string $title,
        public string $body,
        public ?string $createdAt,
        public ?string $updatedAt,
    ) {}

    public static function fromModel(ApiCatalogNote $note): self
    {
        /*
         * React 側へは camelCase の表示用元データとして渡します。
         * 日付は表示補助値なので、DBカラム名やModelをComponentへ漏らしません。
         */
        return new self(
            id: (int) $note->getKey(),
            title: $note->title,
            body: $note->body,
            createdAt: $note->created_at?->toDateTimeString(),
            updatedAt: $note->updated_at?->toDateTimeString(),
        );
    }

    /**
     * @return array{id: int, title: string|null, body: string, createdAt: string|null, updatedAt: string|null}
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'createdAt' => $this->createdAt,
            'updatedAt' => $this->updatedAt,
        ];
    }
}
