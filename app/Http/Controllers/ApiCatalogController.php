<?php

namespace App\Http\Controllers;

use App\Actions\ApiCatalog\Queries\GetApiCatalogListAction;
use App\DTO\ApiCatalog\List\ApiCatalogListQueryDTO;
use App\Responders\ApiCatalog\ApiCatalogListResponder;
use Illuminate\Http\Request;
use Inertia\Response;

class ApiCatalogController extends Controller
{
    public function __invoke(
        Request $request,
        GetApiCatalogListAction $action,
        ApiCatalogListResponder $responder,
    ): Response {
        // Controller は HTTP query を DTO に詰める入口だけに留め、取得や表示整形は下位層へ渡します。
        $query = ApiCatalogListQueryDTO::fromRequest($request);
        $result = $action->execute($query);

        return $responder->index($result);
    }
}
