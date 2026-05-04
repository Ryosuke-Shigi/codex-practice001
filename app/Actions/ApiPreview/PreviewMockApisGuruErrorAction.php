<?php

namespace App\Actions\ApiPreview;

use App\DTO\ApiPreview\ApiPreviewResultDTO;
use App\Repositories\ApiPreview\ApisGuruRepository;
use App\Responders\ApiPreviewResponder;
use Inertia\Response;

class PreviewMockApisGuruErrorAction
{
    public function __construct(
        private readonly ApiPreviewResponder $responder,
    ) {
    }

    public function execute(): Response
    {
        return $this->responder->apisGuru([
            'api' => [
                'name' => 'APIs.guru list.json',
                'endpoint' => ApisGuruRepository::LIST_URL,
                'method' => 'GET',
            ],
            // エラー表示の確認専用なので、外部 API 通信も再取得ボタンも使いません。
            'canFetch' => false,
            'hasFetched' => true,
            'result' => $this->mockErrorResult()->toArray(),
        ]);
    }

    private function mockErrorResult(): ApiPreviewResultDTO
    {
        // responsePreview は null にして、画面側のエラー時レイアウトを確認します。
        return new ApiPreviewResultDTO(
            apiName: 'APIs.guru',
            endpoint: ApisGuruRepository::LIST_URL,
            method: 'GET',
            success: false,
            statusCode: 500,
            fetchedAt: '2026-05-04 15:00:00',
            totalCount: null,
            responseTimeMs: 123,
            errorMessage: 'APIs.guru preview error sample.',
            requestHeaders: [
                'Accept' => 'application/json',
            ],
            queryParameters: [],
            responsePreview: null,
            rawPayloadPreview: <<<'JSON'
{
  "message": "APIs.guru preview error sample."
}
JSON,
        );
    }
}
