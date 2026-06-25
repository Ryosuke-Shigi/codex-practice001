<?php

namespace App\Services\Operations\ServerHealth;

use App\DTO\Operations\ServerHealth\DiskUsageReportDTO;
use App\Repositories\Operations\ServerHealth\DiskUsageRepositoryInterface;

/**
 * Disk 容量の取得結果を通知用 DTO へ整える Service です。
 *
 * OS からの取得は Repository に委譲し、ここでは容量計算だけを扱います。
 */
class DiskUsageReportService
{
    private const BYTES_PER_GB = 1073741824;

    public function __construct(
        private readonly DiskUsageRepositoryInterface $repository,
    ) {}

    public function getReport(): DiskUsageReportDTO
    {
        $usageBytes = $this->repository->getUsageBytes();
        $totalBytes = max(0, $usageBytes['total_bytes']);
        $freeBytes = max(0, $usageBytes['free_bytes']);
        $usedBytes = max(0, $totalBytes - $freeBytes);
        $usagePercent = $totalBytes === 0 ? 0 : (int) floor(($usedBytes / $totalBytes) * 100);

        return new DiskUsageReportDTO(
            totalGb: $this->bytesToGb($totalBytes),
            usedGb: $this->bytesToGb($usedBytes),
            freeGb: $this->bytesToGb($freeBytes),
            usagePercent: $usagePercent,
        );
    }

    private function bytesToGb(int $bytes): float
    {
        return round($bytes / self::BYTES_PER_GB, 2);
    }
}
