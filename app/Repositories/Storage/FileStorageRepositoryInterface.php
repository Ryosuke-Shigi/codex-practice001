<?php

namespace App\Repositories\Storage;

use DateTimeInterface;

interface FileStorageRepositoryInterface
{
    public function put(string $disk, string $path, string $contents, string $visibility): bool;

    public function delete(string $disk, string $path): bool;

    public function exists(string $disk, string $path): bool;

    public function url(string $disk, string $path): ?string;

    public function temporaryUrl(string $disk, string $path, DateTimeInterface $expiresAt): ?string;
}
