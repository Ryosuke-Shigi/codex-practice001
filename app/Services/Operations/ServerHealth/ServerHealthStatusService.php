<?php

namespace App\Services\Operations\ServerHealth;

use App\DTO\Operations\ServerHealth\DiskUsageReportDTO;

/**
 * サーバーヘルス通知の総合判定を担当する Service です。
 *
 * 今回の判定は disk usage のしきい値だけを基準にし、MySQL 容量や binlog 取得不可では判定を変えません。
 */
class ServerHealthStatusService
{
    public const STATUS_OK = 'OK';

    public const STATUS_WARNING = 'WARNING';

    public const STATUS_CRITICAL = 'CRITICAL';

    public const STATUS_EMERGENCY = 'EMERGENCY';

    public function determine(DiskUsageReportDTO $diskUsage): string
    {
        return match (true) {
            $diskUsage->usagePercent >= 95 => self::STATUS_EMERGENCY,
            $diskUsage->usagePercent >= 85 => self::STATUS_CRITICAL,
            $diskUsage->usagePercent >= 70 => self::STATUS_WARNING,
            default => self::STATUS_OK,
        };
    }
}
