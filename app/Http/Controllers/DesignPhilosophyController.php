<?php

namespace App\Http\Controllers;

use App\Actions\DesignPhilosophy\Queries\GetDesignPhilosophySectionsAction;
use App\Responders\DesignPhilosophy\DesignPhilosophyResponder;
use Inertia\Response;

class DesignPhilosophyController extends Controller
{
    public function __invoke(
        GetDesignPhilosophySectionsAction $action,
        DesignPhilosophyResponder $responder,
    ): Response {
        /*
         * Controller は HTTP 入口に限定します。
         * config の読み取り、enabled の除外、sort_order の並び替えは Action、
         * Inertia component 名と props への変換は Responder へ委譲します。
         */
        return $responder->index($action->execute());
    }
}
