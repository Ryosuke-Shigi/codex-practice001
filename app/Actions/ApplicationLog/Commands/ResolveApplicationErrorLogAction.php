<?php

namespace App\Actions\ApplicationLog\Commands;

use App\Models\ApplicationErrorLog;
use App\Repositories\ApplicationLog\ApplicationErrorLogRepositoryInterface;
use App\Services\ApplicationLog\ApplicationLogSanitizerService;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * 未対応 ERROR ログを対応済みにする Command Action です。
 */
final readonly class ResolveApplicationErrorLogAction
{
    public function __construct(
        private ApplicationErrorLogRepositoryInterface $repository,
        private ApplicationLogSanitizerService $service,
    ) {}

    /**
     * ERROR ログを1件だけ対応済みにします。
     *
     * 存在しない ID は通常のモデル未検出として 404 に委ね、対応済みログへの再操作は冪等に扱います。
     */
    public function execute(int $logId, ?int $resolvedBy): ApplicationErrorLog
    {
        $log = $this->repository->findById($logId);

        if (! $log instanceof ApplicationErrorLog) {
            throw (new ModelNotFoundException)->setModel(ApplicationErrorLog::class, [$logId]);
        }

        if (! $this->service->canResolveErrorLog($log)) {
            return $log;
        }

        return $this->repository->resolve($log, $resolvedBy, now());
    }
}
