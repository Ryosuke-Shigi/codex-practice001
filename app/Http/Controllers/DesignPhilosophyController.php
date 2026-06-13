<?php

namespace App\Http\Controllers;

use App\Actions\DesignPhilosophy\Queries\GetDesignPhilosophySectionsAction;
use App\Responders\DesignPhilosophy\DesignPhilosophyResponder;
use Inertia\Response;

/**
 * Design Philosophy ページの HTTP 入口です。
 *
 * セクション取得は Query Action、Inertia props 整形は Responder に分け、Controller は橋渡しに限定します。
 */
class DesignPhilosophyController extends Controller
{
    /**
     * 有効なセクションを取得して Design Philosophy ページへ渡します。
     */
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
