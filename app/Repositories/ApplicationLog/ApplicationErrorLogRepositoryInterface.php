<?php

namespace App\Repositories\ApplicationLog;

use App\DTO\ApplicationLog\ApplicationErrorLogCreateDTO;
use App\Models\ApplicationErrorLog;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;

/**
 * ERROR ログ保存先との DB 境界です。
 */
interface ApplicationErrorLogRepositoryInterface
{
    public function create(ApplicationErrorLogCreateDTO $dto): ApplicationErrorLog;

    /**
     * @return Collection<int, ApplicationErrorLog>
     */
    public function latest(int $limit): Collection;

    public function findById(int $id): ?ApplicationErrorLog;

    public function resolve(ApplicationErrorLog $log, ?int $resolvedBy, CarbonInterface $resolvedAt): ApplicationErrorLog;
}
