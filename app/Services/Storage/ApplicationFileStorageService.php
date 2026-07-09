<?php

namespace App\Services\Storage;

use App\DTO\Storage\StoredFileDTO;
use App\Repositories\Storage\FileStorageRepositoryInterface;
use DateTimeInterface;
use InvalidArgumentException;
use RuntimeException;

/**
 * アプリ側からS3互換Storageを使うための共通Serviceです。
 *
 * disk、prefix、visibility、保存結果DTO化の共通ルールだけを担当し、
 * LumiLaboなどFeature固有のDB紐付けや保存可否判断は持ちません。
 */
class ApplicationFileStorageService
{
    private const DEFAULT_DISK = 's3';

    private const DEFAULT_VISIBILITY = 'private';

    public function __construct(
        private readonly FileStorageRepositoryInterface $storageRepository,
    ) {}

    public function put(
        string $contents,
        string $path,
        string $originalName,
        ?string $mimeType,
        int $size,
        ?string $disk = null,
        ?string $prefix = null,
        ?string $visibility = null,
        bool $includeUrl = false,
        ?DateTimeInterface $temporaryUrlExpiresAt = null,
    ): StoredFileDTO {
        $disk = $this->disk($disk);
        $path = $this->path($path, $prefix);
        $visibility = $this->visibility($visibility);
        $originalName = trim($originalName);

        if ($originalName === '') {
            throw new InvalidArgumentException('Original file name must not be empty.');
        }

        if ($size < 0) {
            throw new InvalidArgumentException('File size must not be negative.');
        }

        if ($includeUrl && $temporaryUrlExpiresAt !== null) {
            throw new InvalidArgumentException('Choose either url or temporaryUrl for stored file metadata.');
        }

        if (! $this->storageRepository->put($disk, $path, $contents, $visibility)) {
            throw new RuntimeException('File storage put failed.');
        }

        return new StoredFileDTO(
            disk: $disk,
            path: $path,
            originalName: $originalName,
            mimeType: $this->nullableTrim($mimeType),
            size: $size,
            visibility: $visibility,
            url: $includeUrl ? $this->storageRepository->url($disk, $path) : null,
            temporaryUrl: $temporaryUrlExpiresAt === null
                ? null
                : $this->storageRepository->temporaryUrl($disk, $path, $temporaryUrlExpiresAt),
        );
    }

    public function delete(string $path, ?string $disk = null, ?string $prefix = null): bool
    {
        return $this->storageRepository->delete(
            $this->disk($disk),
            $this->path($path, $prefix),
        );
    }

    public function get(string $path, ?string $disk = null, ?string $prefix = null): ?string
    {
        return $this->storageRepository->get(
            $this->disk($disk),
            $this->path($path, $prefix),
        );
    }

    public function exists(string $path, ?string $disk = null, ?string $prefix = null): bool
    {
        return $this->storageRepository->exists(
            $this->disk($disk),
            $this->path($path, $prefix),
        );
    }

    public function url(string $path, ?string $disk = null, ?string $prefix = null): ?string
    {
        $disk = $this->disk($disk);

        return $this->storageRepository->url($disk, $this->path($path, $prefix));
    }

    public function temporaryUrl(
        string $path,
        DateTimeInterface $expiresAt,
        ?string $disk = null,
        ?string $prefix = null,
    ): ?string {
        $disk = $this->disk($disk);

        return $this->storageRepository->temporaryUrl($disk, $this->path($path, $prefix), $expiresAt);
    }

    private function disk(?string $disk): string
    {
        $disk = $this->nullableTrim($disk) ?? self::DEFAULT_DISK;

        if ($disk === '') {
            throw new InvalidArgumentException('Storage disk must not be empty.');
        }

        return $disk;
    }

    private function visibility(?string $visibility): string
    {
        $visibility = $this->nullableTrim($visibility) ?? self::DEFAULT_VISIBILITY;

        if (! in_array($visibility, ['private', 'public'], true)) {
            throw new InvalidArgumentException('Storage visibility must be private or public.');
        }

        return $visibility;
    }

    private function path(string $path, ?string $prefix = null): string
    {
        $parts = [];

        foreach ([$prefix, $path] as $part) {
            $part = $this->nullableTrim($part);

            if ($part === null) {
                continue;
            }

            $parts[] = $part;
        }

        $path = str_replace('\\', '/', implode('/', $parts));
        $segments = array_values(array_filter(
            explode('/', $path),
            fn (string $segment): bool => $segment !== '',
        ));

        if ($segments === []) {
            throw new InvalidArgumentException('Storage path must not be empty.');
        }

        foreach ($segments as $segment) {
            if ($segment === '.' || $segment === '..') {
                throw new InvalidArgumentException('Storage path must not contain dot segments.');
            }
        }

        return implode('/', $segments);
    }

    private function nullableTrim(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }
}
