<?php

namespace App\DTO\ApiCatalog\Note;

final readonly class ApiCatalogNoteUpdateDTO
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
         * 更新でも作成と同じ正規化を使います。
         * body 空文字は FormRequest で落とし、Repository には保存可能な値だけを渡します。
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
