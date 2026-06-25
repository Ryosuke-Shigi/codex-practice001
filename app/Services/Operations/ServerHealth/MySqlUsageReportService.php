<?php

namespace App\Services\Operations\ServerHealth;

use App\DTO\Operations\ServerHealth\MySqlUsageReportDTO;
use App\Repositories\Operations\ServerHealth\MySqlUsageRepositoryInterface;

/**
 * MySQL 容量の取得結果を通知用 DTO へ整える Service です。
 *
 * DB への問い合わせは Repository に委譲し、binlog 取得不可は通知用の null として扱います。
 */
class MySqlUsageReportService
{
    private const BYTES_PER_GB = 1073741824;

    public function __construct(
        private readonly MySqlUsageRepositoryInterface $repository,
    ) {}

    public function getReport(): MySqlUsageReportDTO
    {
        $databaseBytes = $this->repository->getDatabaseUsageBytes();
        $binlogBytes = $this->repository->getBinaryLogUsageBytes();

        return new MySqlUsageReportDTO(
            databaseGb: $this->bytesToGb($databaseBytes),
            binlogGb: $binlogBytes === null ? null : $this->bytesToGb($binlogBytes),
        );
    }

    private function bytesToGb(int $bytes): float
    {
        return round(max(0, $bytes) / self::BYTES_PER_GB, 2);
    }
}
