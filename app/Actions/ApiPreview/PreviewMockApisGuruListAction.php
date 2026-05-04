<?php

namespace App\Actions\ApiPreview;

use App\DTO\ApiPreview\ApiPreviewResultDTO;
use App\Repositories\ApiPreview\ApisGuruRepository;
use App\Responders\ApiPreviewResponder;
use Inertia\Response;

class PreviewMockApisGuruListAction
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
            // mock ルートは固定データ専用なので、画面の取得ボタンは表示しません。
            'canFetch' => false,
            'hasFetched' => true,
            'result' => $this->mockResult()->toArray(),
        ]);
    }

    private function mockResult(): ApiPreviewResultDTO
    {
        // Repository は呼ばず、レイアウト確認に必要な props だけを固定値で作ります。
        return new ApiPreviewResultDTO(
            apiName: 'APIs.guru',
            endpoint: ApisGuruRepository::LIST_URL,
            method: 'GET',
            success: true,
            statusCode: 200,
            fetchedAt: '2026-05-04 15:00:00',
            totalCount: 2500,
            responseTimeMs: 123,
            errorMessage: null,
            requestHeaders: [
                'Accept' => 'application/json',
            ],
            queryParameters: [],
            responsePreview: $this->responsePreview(),
            rawPayloadPreview: <<<'JSON'
{
  "googleapis.com:drive": {
    "preferred": "v3",
    "versions": {
      "v3": {
        "info": {
          "title": "Google Drive API"
        }
      }
    }
  }
}
JSON,
        );
    }

    /**
     * @return array<int, array<string, string|null>>
     */
    private function responsePreview(): array
    {
        // 横幅や長い URL の表示崩れを確認できるよう、10件分の固定行を用意します。
        return [
            [
                'api_key' => 'googleapis.com:drive',
                'title' => 'Google Drive API',
                'description' => 'Google Drive API preview data',
                'provider_key' => 'googleapis.com',
                'service_key' => 'drive',
                'preferred_version' => 'v3',
                'openapi_json_url' => 'https://example.com/drive/openapi.json',
                'openapi_yaml_url' => 'https://example.com/drive/openapi.yaml',
                'openapi_version' => '3.0.0',
            ],
            [
                'api_key' => 'github.com',
                'title' => 'GitHub API',
                'description' => 'GitHub API preview data',
                'provider_key' => 'github.com',
                'service_key' => null,
                'preferred_version' => 'v3',
                'openapi_json_url' => 'https://example.com/github/openapi.json',
                'openapi_yaml_url' => 'https://example.com/github/openapi.yaml',
                'openapi_version' => '3.0.0',
            ],
            [
                'api_key' => 'stripe.com',
                'title' => 'Stripe API',
                'description' => 'Stripe API preview data',
                'provider_key' => 'stripe.com',
                'service_key' => null,
                'preferred_version' => '2024-06-20',
                'openapi_json_url' => 'https://example.com/stripe/openapi.json',
                'openapi_yaml_url' => 'https://example.com/stripe/openapi.yaml',
                'openapi_version' => '3.0.3',
            ],
            [
                'api_key' => 'slack.com:web-api',
                'title' => 'Slack Web API',
                'description' => 'Slack Web API preview data',
                'provider_key' => 'slack.com',
                'service_key' => 'web-api',
                'preferred_version' => 'v1',
                'openapi_json_url' => 'https://example.com/slack/openapi.json',
                'openapi_yaml_url' => 'https://example.com/slack/openapi.yaml',
                'openapi_version' => '3.1.0',
            ],
            [
                'api_key' => 'openalex.org',
                'title' => 'OpenAlex API',
                'description' => 'OpenAlex API preview data',
                'provider_key' => 'openalex.org',
                'service_key' => null,
                'preferred_version' => 'v1',
                'openapi_json_url' => 'https://example.com/openalex/openapi.json',
                'openapi_yaml_url' => 'https://example.com/openalex/openapi.yaml',
                'openapi_version' => '3.0.0',
            ],
            [
                'api_key' => 'news.ycombinator.com:hacker-news',
                'title' => 'Hacker News API',
                'description' => 'Hacker News API preview data',
                'provider_key' => 'news.ycombinator.com',
                'service_key' => 'hacker-news',
                'preferred_version' => 'v0',
                'openapi_json_url' => 'https://example.com/hacker-news/openapi.json',
                'openapi_yaml_url' => 'https://example.com/hacker-news/openapi.yaml',
                'openapi_version' => '3.0.0',
            ],
            [
                'api_key' => 'notion.com',
                'title' => 'Notion API',
                'description' => 'Notion API preview data',
                'provider_key' => 'notion.com',
                'service_key' => null,
                'preferred_version' => '2022-06-28',
                'openapi_json_url' => 'https://example.com/notion/openapi.json',
                'openapi_yaml_url' => 'https://example.com/notion/openapi.yaml',
                'openapi_version' => '3.0.0',
            ],
            [
                'api_key' => 'figma.com',
                'title' => 'Figma API',
                'description' => 'Figma API preview data',
                'provider_key' => 'figma.com',
                'service_key' => null,
                'preferred_version' => 'v1',
                'openapi_json_url' => 'https://example.com/figma/openapi.json',
                'openapi_yaml_url' => 'https://example.com/figma/openapi.yaml',
                'openapi_version' => '3.0.0',
            ],
            [
                'api_key' => 'shopify.com:admin',
                'title' => 'Shopify Admin API',
                'description' => 'Shopify Admin API preview data',
                'provider_key' => 'shopify.com',
                'service_key' => 'admin',
                'preferred_version' => '2024-10',
                'openapi_json_url' => 'https://example.com/shopify/openapi.json',
                'openapi_yaml_url' => 'https://example.com/shopify/openapi.yaml',
                'openapi_version' => '3.0.0',
            ],
            [
                'api_key' => 'twilio.com:messaging',
                'title' => 'Twilio Messaging API',
                'description' => 'Twilio Messaging API preview data',
                'provider_key' => 'twilio.com',
                'service_key' => 'messaging',
                'preferred_version' => 'v1',
                'openapi_json_url' => 'https://example.com/twilio/openapi.json',
                'openapi_yaml_url' => 'https://example.com/twilio/openapi.yaml',
                'openapi_version' => '3.0.1',
            ],
        ];
    }
}
