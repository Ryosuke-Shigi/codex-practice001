<?php

namespace App\Http\Controllers;

use App\Actions\ApplicationLog\Commands\ResolveApplicationErrorLogAction;
use App\Http\Requests\ApplicationLog\ApplicationErrorLogResolveRequest;
use Illuminate\Http\RedirectResponse;

/**
 * ERROR ログを対応済みにする HTTP 入口です。
 */
final class ApplicationErrorLogResolveController extends Controller
{
    public function __invoke(
        ApplicationErrorLogResolveRequest $request,
        int $log,
        ResolveApplicationErrorLogAction $action,
    ): RedirectResponse {
        $userId = $request->user()?->getKey();

        $action->execute($log, is_numeric($userId) ? (int) $userId : null);

        return redirect()->to(route('projects.logs', ['tab' => 'error'], false));
    }
}
