<?php

namespace App\DTO\Operations\ServerHealth;

final readonly class MySqlUsageReportDTO
{
    public function __construct(
        public float $databaseGb,
        public ?float $binlogGb,
    ) {}

    /**
     * @return array<string, float|null>
     */
    public function toArray(): array
    {
        return [
            'databaseGb' => $this->databaseGb,
            'binlogGb' => $this->binlogGb,
        ];
    }
}
