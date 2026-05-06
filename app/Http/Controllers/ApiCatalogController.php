<?php

namespace App\Http\Controllers;

use App\Actions\ApiCatalog\Queries\GetApiCatalogDetailAction;
use App\Actions\ApiCatalog\Queries\GetApiCatalogListAction;
use App\Actions\ApiCatalog\Queries\GetApiCatalogSyncStatusAction;
use App\DTO\ApiCatalog\List\ApiCatalogListQueryDTO;
use App\Responders\ApiCatalog\ApiCatalogDetailResponder;
use App\Responders\ApiCatalog\ApiCatalogListResponder;
use Illuminate\Http\Request;
use Inertia\Response;

class ApiCatalogController extends Controller
{
    public function __invoke(
        Request $request,
        GetApiCatalogListAction $action,
        GetApiCatalogSyncStatusAction $syncStatusAction,
        ApiCatalogListResponder $responder,
    ): Response {
        // Controller は HTTP query を DTO に詰める入口だけに留め、取得や表示整形は下位層へ渡します。
        $query = ApiCatalogListQueryDTO::fromRequest($request);
        $result = $action->execute($query);
        $syncStatus = $syncStatusAction->execute();

        return $responder->index($result, $syncStatus);
    }

    public function show(
        Request $request,
        string $apiKey,
        GetApiCatalogDetailAction $action,
        ApiCatalogDetailResponder $responder,
    ): Response {
        /*
         * api_key は APIs.guru 由来で ":" など URL エンコード対象の文字を含みます。
         * route parameter は表示用 slug ではなく api_key そのものとして扱うため、取得前に decode します。
         */
        $item = $action->execute(rawurldecode($apiKey));

        if ($item === null) {
            abort(404);
        }

        return $responder->show($item, $this->listReturnUrl($request));
    }

    private function listReturnUrl(Request $request): string
    {
        $returnUrl = $request->query('return_url');

        /*
         * 一覧状態は URL query で保持します。
         * 外部URLや詳細URLへ戻らないよう、本番一覧だけを戻り先として許可します。
         * これにより keyword / provider_key / page を含む一覧 URL へ安全に戻せます。
         * /api-preview や /api-catalog/mock は別導線なので、本番詳細の戻り先には採用しません。
         */
        if (
            is_string($returnUrl)
            && ($returnUrl === '/api-catalog' || str_starts_with($returnUrl, '/api-catalog?'))
        ) {
            return $returnUrl;
        }

        return '/api-catalog';
    }
}
