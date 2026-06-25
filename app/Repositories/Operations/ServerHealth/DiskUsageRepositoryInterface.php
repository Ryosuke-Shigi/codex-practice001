<?php

namespace App\Repositories\Operations\ServerHealth;

interface DiskUsageRepositoryInterface
{
    /**
     * @return array{total_bytes: int, free_bytes: int}
     */
    public function getUsageBytes(): array;
}
