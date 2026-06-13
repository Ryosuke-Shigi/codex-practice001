<?php

namespace App\Responders\ApiCatalog;

use App\DTO\ApiCatalog\Detail\ApiCatalogDetailDTO;
use Inertia\Inertia;
use Inertia\Response;

/**
 * API Discovery Hub 詳細画面の Inertia props を整形する Responder です。
 *
 * DTO を React が表示できる配列へ変換し、Controller で検証済みの戻り先 URL を渡します。
 * API の存在判定や note 所有確認はここでは行いません。
 */
final readonly class ApiCatalogDetailResponder
{
    /**
     * API詳細ページに必要な props を返します。
     */
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
