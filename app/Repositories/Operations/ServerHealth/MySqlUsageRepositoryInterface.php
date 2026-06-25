<?php

namespace App\Repositories\Operations\ServerHealth;

interface MySqlUsageRepositoryInterface
{
    public function getDatabaseUsageBytes(): int;

    public function getBinaryLogUsageBytes(): ?int;
}
