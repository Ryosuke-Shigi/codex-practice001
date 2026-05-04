<?php

namespace App\Responders;

use Inertia\Inertia;
use Inertia\Response;

/**
 * API Preview 画面用 Responder です。
 *
 * Responder は Inertia::render() のみを担当します。
 * 外部 API 通信、DTO 生成、レスポンス整形をここに入れないことで、返却先の責務を明確にします。
 */
class ApiPreviewResponder
{
    /**
     * API preview 一覧画面に必要な props だけを Inertia に渡します。
     *
     * @param  array<int, array<string, mixed>>  $apis
     */
    public function index(array $apis): Response
    {
        return Inertia::render('ApiPreview/Index', [
            'apis' => $apis,
        ]);
    }

    /**
     * APIs.guru の実取得・成功モック・エラーモックは同じ React Page を共有します。
     *
     * @param  array<string, mixed>  $props
     */
    public function apisGuru(array $props): Response
    {
        return Inertia::render('ApiPreview/ApisGuru', $props);
    }
}
