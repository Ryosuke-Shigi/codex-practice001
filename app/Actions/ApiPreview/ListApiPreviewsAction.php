<?php

namespace App\Actions\ApiPreview;

use App\Responders\ApiPreviewResponder;
use Inertia\Response;

class ListApiPreviewsAction
{
    public function __construct(
        private readonly ApiPreviewResponder $responder,
    ) {
    }

    public function execute(): Response
    {
        // 一覧は固定の preview 対象だけを返し、ここでは外部 API 通信を行いません。
        return $this->responder->index([
            [
                'id' => 'apis-guru',
                'name' => 'APIs.guru list.json',
                'summary' => 'Public API catalog の list.json を取得して、DTO 設計前のレスポンス構造を確認します。',
                'endpoint' => 'https://api.apis.guru/v2/list.json',
                'method' => 'GET',
                'href' => '/api-preview/apis-guru',
                // APIs.guru だけは実取得・成功モック・エラーモックを別ウィンドウで確認できます。
                'links' => [
                    [
                        'label' => 'APIs.guru 確認画面を開く',
                        'href' => '/api-preview/apis-guru',
                        'style' => 'primary',
                    ],
                    [
                        'label' => 'APIs.guru レイアウト確認用画面を開く',
                        'href' => '/api-preview/apis-guru/mock',
                        'style' => 'secondary',
                    ],
                    [
                        'label' => 'APIs.guru エラー表示確認用画面を開く',
                        'href' => '/api-preview/apis-guru/mock-error',
                        'style' => 'danger',
                    ],
                ],
                'status' => 'Ready',
                'enabled' => true,
                'open_in_new_window' => true,
            ],
            [
                'id' => 'github-api',
                'name' => 'GitHub API',
                'summary' => 'headers, rate limit, error response を確認する予定の枠です。',
                'endpoint' => 'https://api.github.com',
                'method' => 'GET',
                'href' => '/api-preview/github',
                'links' => [],
                'status' => 'Planned',
                'enabled' => false,
                'open_in_new_window' => true,
            ],
            [
                'id' => 'hacker-news',
                'name' => 'Hacker News API',
                'summary' => 'item/topstories のレスポンス構造を確認する予定の枠です。',
                'endpoint' => 'https://hacker-news.firebaseio.com/v0',
                'method' => 'GET',
                'href' => '/api-preview/hacker-news',
                'links' => [],
                'status' => 'Planned',
                'enabled' => false,
                'open_in_new_window' => true,
            ],
            [
                'id' => 'openalex',
                'name' => 'OpenAlex API',
                'summary' => 'works/authors などの検索レスポンスを確認する予定の枠です。',
                'endpoint' => 'https://api.openalex.org',
                'method' => 'GET',
                'href' => '/api-preview/openalex',
                'links' => [],
                'status' => 'Planned',
                'enabled' => false,
                'open_in_new_window' => true,
            ],
        ]);
    }
}
