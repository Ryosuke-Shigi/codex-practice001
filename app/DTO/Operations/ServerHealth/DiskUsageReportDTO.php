<?php

namespace App\DTO\Operations\ServerHealth;

final readonly class DiskUsageReportDTO
{
    public function __construct(
        public float $totalGb,
        public float $usedGb,
        public float $freeGb,
        public int $usagePercent,
    ) {}

    /**
     * @return array<string, float|int>
     */
    public function toArray(): array
    {
        return [
            'totalGb' => $this->totalGb,
            'usedGb' => $this->usedGb,
            'freeGb' => $this->freeGb,
            'usagePercent' => $this->usagePercent,
        ];
    }
}
