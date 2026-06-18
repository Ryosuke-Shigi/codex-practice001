<?php

namespace App\Repositories\ApplicationLog;

use App\DTO\ApplicationLog\ApplicationIntegrationLogCreateDTO;
use App\Models\ApplicationIntegrationLog;
use Illuminate\Database\Eloquent\Collection;

/**
 * API 連携ログ保存先との DB 境界です。
 */
interface ApplicationIntegrationLogRepositoryInterface
{
    public function create(ApplicationIntegrationLogCreateDTO $dto): ApplicationIntegrationLog;

    /**
     * @return Collection<int, ApplicationIntegrationLog>
     */
    public function latest(int $limit): Collection;
}
