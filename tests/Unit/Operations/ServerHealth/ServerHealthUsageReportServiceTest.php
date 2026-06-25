<?php

namespace Tests\Unit\Operations\ServerHealth;

use App\Repositories\Operations\ServerHealth\DiskUsageRepositoryInterface;
use App\Repositories\Operations\ServerHealth\MySqlUsageRepositoryInterface;
use App\Services\Operations\ServerHealth\DiskUsageReportService;
use App\Services\Operations\ServerHealth\MySqlUsageReportService;
use PHPUnit\Framework\TestCase;

class ServerHealthUsageReportServiceTest extends TestCase
{
    public const GB = 1073741824;

    public function test_disk_usage_report_service_builds_capacity_dto(): void
    {
        $service = new DiskUsageReportService(new class implements DiskUsageRepositoryInterface
        {
            /**
             * @return array{total_bytes: int, free_bytes: int}
             */
            public function getUsageBytes(): array
            {
                return [
                    'total_bytes' => 10 * ServerHealthUsageReportServiceTest::GB,
                    'free_bytes' => 3 * ServerHealthUsageReportServiceTest::GB,
                ];
            }
        });

        $report = $service->getReport();

        $this->assertSame(10.0, $report->totalGb);
        $this->assertSame(7.0, $report->usedGb);
        $this->assertSame(3.0, $report->freeGb);
        $this->assertSame(70, $report->usagePercent);
    }

    public function test_mysql_usage_report_service_keeps_unavailable_binlog_as_null(): void
    {
        $service = new MySqlUsageReportService(new class implements MySqlUsageRepositoryInterface
        {
            public function getDatabaseUsageBytes(): int
            {
                return 2 * ServerHealthUsageReportServiceTest::GB;
            }

            public function getBinaryLogUsageBytes(): ?int
            {
                return null;
            }
        });

        $report = $service->getReport();

        $this->assertSame(2.0, $report->databaseGb);
        $this->assertNull($report->binlogGb);
    }
}
