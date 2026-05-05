<?php

namespace App\DTO\ApiCatalog\Note;

final readonly class ApiCatalogNoteCreateDTO
{
    public function __construct(
        public ?string $title,
        public string $body,
    ) {
    }

    /**
     * @param  array{title?: string|null, body: string}  $data
     */
    public static function fromArray(array $data): self
    {
        /*
         * Request は入力形式だけを検証し、DTO はレイヤー間で使う値の形に揃えます。
         * title の空文字は null、body は required 済みの文字列として扱います。
         */
        $title = isset($data['title']) && trim((string) $data['title']) !== ''
            ? trim((string) $data['title'])
            : null;

        return new self(
            title: $title,
            body: trim((string) $data['body']),
        );
    }
}
