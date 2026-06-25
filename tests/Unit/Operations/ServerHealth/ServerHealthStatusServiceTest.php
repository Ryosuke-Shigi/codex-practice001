<?php

namespace Tests\Unit\Operations\ServerHealth;

use App\DTO\Operations\ServerHealth\DiskUsageReportDTO;
use App\Services\Operations\ServerHealth\ServerHealthStatusService;
use PHPUnit\Framework\TestCase;

class ServerHealthStatusServiceTest extends TestCase
{
    public function test_disk_usage_thresholds_determine_health_status(): void
    {
        $service = new ServerHealthStatusService;

        $this->assertSame(ServerHealthStatusService::STATUS_OK, $service->determine($this->diskUsage(69)));
        $this->assertSame(ServerHealthStatusService::STATUS_WARNING, $service->determine($this->diskUsage(70)));
        $this->assertSame(ServerHealthStatusService::STATUS_CRITICAL, $service->determine($this->diskUsage(85)));
        $this->assertSame(ServerHealthStatusService::STATUS_EMERGENCY, $service->determine($this->diskUsage(95)));
    }

    private function diskUsage(int $usagePercent): DiskUsageReportDTO
    {
        return new DiskUsageReportDTO(
            totalGb: 100.0,
            usedGb: (float) $usagePercent,
            freeGb: (float) (100 - $usagePercent),
            usagePercent: $usagePercent,
        );
    }
}
