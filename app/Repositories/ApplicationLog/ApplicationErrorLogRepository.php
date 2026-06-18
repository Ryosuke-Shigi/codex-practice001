<?php

namespace App\Repositories\ApplicationLog;

use App\DTO\ApplicationLog\ApplicationErrorLogCreateDTO;
use App\Models\ApplicationErrorLog;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;

/**
 * application_error_logs の保存、取得、対応済み更新を扱う DB Repository です。
 *
 * 対応済みにできるかどうかの業務判断は Service / Action 側へ残します。
 */
final class ApplicationErrorLogRepository implements ApplicationErrorLogRepositoryInterface
{
    public function create(ApplicationErrorLogCreateDTO $dto): ApplicationErrorLog
    {
        return ApplicationErrorLog::query()->create($dto->toArray());
    }

    /**
     * @return Collection<int, ApplicationErrorLog>
     */
    public function latest(int $limit): Collection
    {
        return ApplicationErrorLog::query()
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->limit(max(1, $limit))
            ->get();
    }

    public function findById(int $id): ?ApplicationErrorLog
    {
        return ApplicationErrorLog::query()->find($id);
    }

    public function resolve(ApplicationErrorLog $log, ?int $resolvedBy, CarbonInterface $resolvedAt): ApplicationErrorLog
    {
        $log->fill([
            'resolved_at' => $resolvedAt->toDateTimeString(),
            'resolved_by' => $resolvedBy,
        ]);
        $log->save();

        return $log->refresh();
    }
}
