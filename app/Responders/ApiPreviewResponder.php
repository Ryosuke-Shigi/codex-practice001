<?php

namespace App\Responders;

use App\DTO\ApiPreview\ApisGuruPreviewPageDTO;
use Inertia\Inertia;
use Inertia\Response;

/**
 * API Preview 画面用 Responder です。
 *
 * Responder は Action 結果を Inertia Response へ変換する出口だけを担当します。
 * 外部 API 通信や DTO 生成をここに入れないことで、返却先の責務を明確にします。
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
     */
    public function apisGuru(ApisGuruPreviewPageDTO $preview): Response
    {
        return Inertia::render('ApiPreview/ApisGuru', [
            'api' => [
                'name' => $preview->apiName,
                'endpoint' => $preview->endpoint,
                'method' => $preview->method,
            ],
            'canFetch' => $preview->canFetch,
            'hasFetched' => $preview->hasFetched,
            'result' => $preview->result?->toArray(),
        ]);
    }
}
