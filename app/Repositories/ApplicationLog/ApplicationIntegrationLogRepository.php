<?php

namespace App\Repositories\ApplicationLog;

use App\DTO\ApplicationLog\ApplicationIntegrationLogCreateDTO;
use App\Models\ApplicationIntegrationLog;
use Illuminate\Database\Eloquent\Collection;

/**
 * application_integration_logs の保存と取得を扱う DB Repository です。
 *
 * status の意味づけや ERROR 対応済み概念は持ちません。
 */
final class ApplicationIntegrationLogRepository implements ApplicationIntegrationLogRepositoryInterface
{
    public function create(ApplicationIntegrationLogCreateDTO $dto): ApplicationIntegrationLog
    {
        return ApplicationIntegrationLog::query()->create($dto->toArray());
    }

    /**
     * @return Collection<int, ApplicationIntegrationLog>
     */
    public function latest(int $limit): Collection
    {
        return ApplicationIntegrationLog::query()
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->limit(max(1, $limit))
            ->get();
    }
}
