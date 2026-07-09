<?php

namespace App\DTO\Storage;

/*
 * アプリ側の共通 Storage 境界から返す保存済みファイル情報です。
 *
 * DB紐付けやFeature固有の状態は持たず、保存先disk/pathと表示・再取得に必要な
 * 最小メタデータだけを運びます。
 */
final readonly class StoredFileDTO
{
    public function __construct(
        public string $disk,
        public string $path,
        public string $originalName,
        public ?string $mimeType,
        public int $size,
        public string $visibility,
        public ?string $url = null,
        public ?string $temporaryUrl = null,
    ) {}

    /**
     * @return array{
     *     disk: string,
     *     path: string,
     *     original_name: string,
     *     mime_type: string|null,
     *     size: int,
     *     visibility: string,
     *     url: string|null,
     *     temporary_url: string|null
     * }
     */
    public function toArray(): array
    {
        return [
            'disk' => $this->disk,
            'path' => $this->path,
            'original_name' => $this->originalName,
            'mime_type' => $this->mimeType,
            'size' => $this->size,
            'visibility' => $this->visibility,
            'url' => $this->url,
            'temporary_url' => $this->temporaryUrl,
        ];
    }
}
