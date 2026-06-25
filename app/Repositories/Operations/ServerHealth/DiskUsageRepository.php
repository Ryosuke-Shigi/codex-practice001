<?php

namespace App\Repositories\Operations\ServerHealth;

use RuntimeException;

/**
 * アプリケーションが配置されている filesystem から容量を取得する Repository です。
 *
 * 容量の意味づけや通知可否は Service / Action へ委譲します。
 */
class DiskUsageRepository implements DiskUsageRepositoryInterface
{
    /**
     * @return array{total_bytes: int, free_bytes: int}
     */
    public function getUsageBytes(): array
    {
        $path = base_path();
        $totalBytes = disk_total_space($path);
        $freeBytes = disk_free_space($path);

        if ($totalBytes === false || $freeBytes === false) {
            throw new RuntimeException('Disk usage could not be retrieved.');
        }

        return [
            'total_bytes' => (int) $totalBytes,
            'free_bytes' => (int) $freeBytes,
        ];
    }
}
