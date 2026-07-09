<?php

namespace App\Console\Commands;

use App\Services\Storage\ApplicationFileStorageService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

/**
 * S3互換Storageの疎通確認を行う Artisan Command です。
 *
 * CLI入口として一時オブジェクトの保存・取得・削除をServiceへ委譲し、
 * Storage facadeやS3固有APIは直接扱いません。
 */
class StorageSmokeTestCommand extends Command
{
    protected $signature = 'storage:smoke-test {--disk=s3 : Storage disk name to smoke test.}';

    protected $description = 'Smoke test application storage by writing, reading, and deleting a temporary object.';

    public function handle(ApplicationFileStorageService $storage): int
    {
        $disk = $this->diskOption();
        $path = $this->smokeTestPath();
        $contents = "storage smoke test\npath: {$path}\n";
        $step = 'write';
        $created = false;

        $this->line("Storage smoke test started. disk={$disk} path={$path}");

        try {
            $storedFile = $storage->put(
                contents: $contents,
                path: $path,
                originalName: basename($path),
                mimeType: 'text/plain',
                size: strlen($contents),
                disk: $disk,
                visibility: 'private',
            );
            $created = true;
            $this->line('write: ok');

            $step = 'exists_after_write';
            if (! $storage->exists($storedFile->path, $storedFile->disk)) {
                throw new RuntimeException('Smoke test object was not found after write.');
            }
            $this->line('exists_after_write: ok');

            $step = 'read';
            if ($storage->get($storedFile->path, $storedFile->disk) !== $contents) {
                throw new RuntimeException('Smoke test object contents did not match.');
            }
            $this->line('read: ok');

            $step = 'delete';
            if (! $storage->delete($storedFile->path, $storedFile->disk)) {
                throw new RuntimeException('Smoke test object delete failed.');
            }
            $this->line('delete: ok');

            $step = 'exists_after_delete';
            if ($storage->exists($storedFile->path, $storedFile->disk)) {
                throw new RuntimeException('Smoke test object still exists after delete.');
            }
            $created = false;
            $this->line('exists_after_delete: ok');
        } catch (Throwable) {
            $this->error("Storage smoke test failed. disk={$disk} path={$path} step={$step}");

            if ($created && ! $this->cleanup($storage, $disk, $path)) {
                $this->warn("Storage smoke test cleanup did not confirm deletion. disk={$disk} path={$path}");
            }

            return self::FAILURE;
        }

        $this->info("Storage smoke test completed. disk={$disk} path={$path}");

        return self::SUCCESS;
    }

    private function diskOption(): string
    {
        $disk = $this->option('disk');
        $disk = is_string($disk) ? trim($disk) : '';

        return $disk === '' ? 's3' : $disk;
    }

    private function smokeTestPath(): string
    {
        return 'system/storage-smoke-tests/'.Str::uuid().'.txt';
    }

    private function cleanup(ApplicationFileStorageService $storage, string $disk, string $path): bool
    {
        try {
            $storage->delete($path, $disk);

            return ! $storage->exists($path, $disk);
        } catch (Throwable) {
            return false;
        }
    }
}
