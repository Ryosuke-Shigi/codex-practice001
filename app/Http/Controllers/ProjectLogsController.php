<?php

namespace App\Http\Controllers;

use App\Actions\ApplicationLog\Queries\GetApplicationLogsAction;
use App\Http\Requests\ApplicationLog\ApplicationLogIndexRequest;
use App\Responders\ApplicationLog\ProjectLogsResponder;
use Inertia\Response;

/**
 * Project Hub の logs 表示入口です。
 */
final class ProjectLogsController extends Controller
{
    public function __invoke(
        ApplicationLogIndexRequest $request,
        GetApplicationLogsAction $action,
        ProjectLogsResponder $responder,
    ): Response {
        return $responder->index($action->execute($request->toInputDTO()));
    }
}
