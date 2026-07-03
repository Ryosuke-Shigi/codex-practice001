<?php

namespace App\Actions\ApiPreview;

use App\DTO\ApiPreview\ApiPreviewResultDTO;
use App\DTO\ApiPreview\ApisGuruPreviewPageDTO;
use App\Repositories\ApiPreview\ApisGuruPreviewRepository;

/**
 * APIs.guru 画面のエラーレイアウトを固定データで確認する Action です。
 *
 * success=false、responsePreview=null の状態を作り、実 API 障害を起こさなくても
 * エラー表示、未設定表示、raw payload preview の見え方を確認できるようにします。
 */
class PreviewMockApisGuruErrorAction
{
    public function execute(): ApisGuruPreviewPageDTO
    {
        /*
         * 成功 mock と同じ React Page を使います。
         * canFetch=false にしておくことで、この画面から実 API 通信が起きないことを明示します。
         */
        // エラー表示の確認専用なので、外部 API 通信も再取得ボタンも使いません。
        return new ApisGuruPreviewPageDTO(
            apiName: 'APIs.guru list.json',
            endpoint: ApisGuruPreviewRepository::LIST_URL,
            method: 'GET',
            canFetch: false,
            hasFetched: true,
            result: $this->mockErrorResult(),
        );
    }

    private function mockErrorResult(): ApiPreviewResultDTO
    {
        /*
         * responsePreview は null にします。
         * 取得成功だが 0 件という状態ではなく、エラーで preview 対象がない状態を表現します。
         */
        return new ApiPreviewResultDTO(
            apiName: 'APIs.guru',
            endpoint: ApisGuruPreviewRepository::LIST_URL,
            method: 'GET',
            success: false,
            statusCode: 500,
            fetchedAt: '2026-05-04 15:00:00',
            totalCount: null,
            responseTimeMs: 123,
            errorMessage: 'APIs.guru のエラー表示サンプルです。',
            requestHeaders: [
                'Accept' => 'application/json',
            ],
            queryParameters: [],
            responsePreview: null,
            rawPayloadPreview: <<<'JSON'
{
  "message": "APIs.guru のエラー表示サンプルです。"
}
JSON,
        );
    }
}
