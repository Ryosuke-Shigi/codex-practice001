<?php

namespace App\DTO\Operations\ServerHealth;

use Carbon\CarbonInterface;

final readonly class DailyServerHealthReportDTO
{
    public function __construct(
        public CarbonInterface $reportedAt,
        public DiskUsageReportDTO $diskUsage,
        public MySqlUsageReportDTO $mySqlUsage,
        public string $status,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'reportedAt' => $this->reportedAt->toIso8601String(),
            'diskUsage' => $this->diskUsage->toArray(),
            'mySqlUsage' => $this->mySqlUsage->toArray(),
            'status' => $this->status,
        ];
    }
}
