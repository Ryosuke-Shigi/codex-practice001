<?php

namespace App\Responders\ApiCatalog;

use App\DTO\ApiCatalog\List\ApiCatalogListResultDTO;
use Inertia\Inertia;
use Inertia\Response;

final readonly class ApiCatalogListResponder
{
    public function index(ApiCatalogListResultDTO $result): Response
    {
        /*
         * 将来の Inertia 部分更新に備え、props は filters / providers /
         * apiCatalogItems / pagination に分けて返します。
         */
        return Inertia::render('ApiCatalog/Index', $result->toArray());
    }
}
