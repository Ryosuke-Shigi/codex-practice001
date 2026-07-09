<?php

namespace App\Repositories\Storage;

use DateTimeInterface;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Laravel Storage facade との境界を閉じ込める Repository です。
 *
 * Feature側は Storage::disk() を直接呼ばず、Service経由でこの境界だけに依存します。
 */
class LaravelFileStorageRepository implements FileStorageRepositoryInterface
{
    public function put(string $disk, string $path, string $contents, string $visibility): bool
    {
        return Storage::disk($disk)->put($path, $contents, [
            'visibility' => $visibility,
        ]);
    }

    public function delete(string $disk, string $path): bool
    {
        return Storage::disk($disk)->delete($path);
    }

    public function exists(string $disk, string $path): bool
    {
        return Storage::disk($disk)->exists($path);
    }

    public function url(string $disk, string $path): ?string
    {
        try {
            return Storage::disk($disk)->url($path);
        } catch (Throwable) {
            return null;
        }
    }

    public function temporaryUrl(string $disk, string $path, DateTimeInterface $expiresAt): ?string
    {
        try {
            return Storage::disk($disk)->temporaryUrl($path, $expiresAt);
        } catch (Throwable) {
            return null;
        }
    }
}
