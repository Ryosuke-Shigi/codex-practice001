<?php

namespace App\Responders\ApiCatalog;

use App\DTO\ApiCatalog\Detail\ApiCatalogDetailDTO;
use Inertia\Inertia;
use Inertia\Response;

final readonly class ApiCatalogDetailResponder
{
    public function show(ApiCatalogDetailDTO $item, string $returnUrl): Response
    {
        /*
         * Responder は Inertia props の境界だけを担当します。
         * 戻り先 URL は Controller で検証済みの値を受け取り、React 側には表示用 props として渡します。
         */
        return Inertia::render('ApiCatalog/Detail', [
            'apiCatalogItem' => $item->toArray(),
            'returnUrl' => $returnUrl,
        ]);
    }
}
