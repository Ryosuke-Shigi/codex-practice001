<?php

namespace Tests\Feature\ApiPreview;

use App\Repositories\ApiPreview\ApisGuruPreviewRepository;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ApiPreviewTest extends TestCase
{
    public function test_api_preview_index_renders_available_preview_targets(): void
    {
        // 一覧画面から実取得・成功モック・エラーモックへ移動できることを確認します。
        $response = $this->get('/api-preview');

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ApiPreview/Index', false)
                ->has('apis', 4)
                ->where('apis.0.id', 'apis-guru')
                ->where('apis.0.enabled', true)
                ->where('apis.0.open_in_new_window', true)
                ->has('apis.0.links', 3)
                ->where('apis.0.links.0.href', '/api-preview/apis-guru')
                ->where('apis.0.links.1.href', '/api-preview/apis-guru/mock')
                ->where('apis.0.links.2.href', '/api-preview/apis-guru/mock-error')
                ->where('apis.1.id', 'github-api')
                ->where('apis.1.enabled', false)
            );
    }

    public function test_apis_guru_page_does_not_fetch_until_requested(): void
    {
        // 初期表示では外部 API を叩かないことを Http fake で固定します。
        Http::preventStrayRequests();

        $response = $this->get('/api-preview/apis-guru');

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ApiPreview/ApisGuru', false)
                ->where('api.endpoint', ApisGuruPreviewRepository::LIST_URL)
                ->where('hasFetched', false)
                ->where('result', null)
            );

        Http::assertNothingSent();
    }

    public function test_apis_guru_page_fetches_and_shapes_first_ten_items(): void
    {
        // 実 API 確認ルートは fetch=1 のときだけ Repository 経由の HTTP 通信を行います。
        Http::fake([
            ApisGuruPreviewRepository::LIST_URL => Http::response($this->apisGuruPayload(), 200),
        ]);

        $response = $this->get('/api-preview/apis-guru?fetch=1');

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ApiPreview/ApisGuru', false)
                ->where('hasFetched', true)
                ->where('result.success', true)
                ->where('result.status_code', 200)
                ->where('result.total_count', 11)
                ->has('result.items', 10)
                ->where('result.items.0.api_key', 'example.com')
                ->where('result.items.0.title', 'Example API')
                ->where('result.items.0.provider_key', 'example.com')
                ->where('result.items.0.service_key', null)
                ->where('result.items.0.preferred_version', 'v1')
                ->where('result.items.0.openapi_json_url', 'https://example.com/openapi.json')
                ->where('result.items.1.api_key', 'provider.com:billing')
                ->where('result.items.1.provider_key', 'provider.com')
                ->where('result.items.1.service_key', 'billing')
                ->where('result.request_headers.Accept', 'application/json')
            );

        Http::assertSent(fn (Request $request) => $request->url() === ApisGuruPreviewRepository::LIST_URL
            && $request->method() === 'GET'
            && $request->hasHeader('Accept', 'application/json'));
    }

    public function test_apis_guru_page_shows_error_result_when_request_fails(): void
    {
        // upstream error でも画面表示用 props が返ることを確認します。
        Http::fake([
            ApisGuruPreviewRepository::LIST_URL => Http::response(['message' => 'upstream unavailable'], 503),
        ]);

        $response = $this->get('/api-preview/apis-guru?fetch=1');

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ApiPreview/ApisGuru', false)
                ->where('hasFetched', true)
                ->where('result.success', false)
                ->where('result.status_code', 503)
                ->where('result.total_count', null)
                ->where('result.items', null)
                ->where('result.error_message', 'APIs.guru list.json の取得先がエラーを返しました。')
            );
    }

    public function test_apis_guru_mock_page_uses_fixed_data_without_http_requests(): void
    {
        // mock はレイアウト確認専用なので、外部通信が発生したらテストを落とします。
        Http::preventStrayRequests();

        $response = $this->get('/api-preview/apis-guru/mock');

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ApiPreview/ApisGuru', false)
                ->where('canFetch', false)
                ->where('hasFetched', true)
                ->where('result.api_name', 'APIs.guru')
                ->where('result.success', true)
                ->where('result.status_code', 200)
                ->where('result.total_count', 2500)
                ->where('result.response_time_ms', 123)
                ->where('result.error_message', null)
                ->has('result.items', 10)
                ->where('result.items.0.api_key', 'googleapis.com:drive')
                ->where('result.items.0.title', 'Google Drive API')
                ->where('result.items.1.api_key', 'github.com')
                ->where('result.items.1.service_key', null)
            );

        Http::assertNothingSent();
    }

    public function test_apis_guru_mock_error_page_uses_fixed_error_without_http_requests(): void
    {
        // mock-error も固定エラー表示専用で、Repository や外部 API を通しません。
        Http::preventStrayRequests();

        $response = $this->get('/api-preview/apis-guru/mock-error');

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ApiPreview/ApisGuru', false)
                ->where('canFetch', false)
                ->where('hasFetched', true)
                ->where('result.success', false)
                ->where('result.status_code', 500)
                ->where('result.total_count', null)
                ->where('result.items', null)
                ->where('result.error_message', 'APIs.guru のエラー表示サンプルです。')
            );

        Http::assertNothingSent();
    }

    /**
     * @return array<string, mixed>
     */
    private function apisGuruPayload(): array
    {
        // 11件用意し、Action が先頭10件だけに切り詰めることを検証します。
        $payload = [
            'example.com' => [
                'preferred' => 'v1',
                'versions' => [
                    'v1' => [
                        'info' => [
                            'title' => 'Example API',
                            'description' => 'Example description',
                        ],
                        'swaggerUrl' => 'https://example.com/openapi.json',
                        'swaggerYamlUrl' => 'https://example.com/openapi.yaml',
                        'openapiVer' => '3.0.0',
                    ],
                ],
            ],
            'provider.com:billing' => [
                'preferred' => '2024-01-01',
                'versions' => [
                    '2024-01-01' => [
                        'info' => [
                            'title' => 'Billing API',
                            'description' => 'Billing description',
                        ],
                        'swaggerUrl' => 'https://provider.com/billing.json',
                        'swaggerYamlUrl' => 'https://provider.com/billing.yaml',
                        'openapiVer' => '3.1.0',
                    ],
                ],
            ],
        ];

        for ($index = 3; $index <= 11; $index++) {
            $payload["api{$index}.test"] = [
                'preferred' => 'v1',
                'versions' => [
                    'v1' => [
                        'info' => [
                            'title' => "API {$index}",
                            'description' => "Description {$index}",
                        ],
                        'swaggerUrl' => "https://api{$index}.test/openapi.json",
                        'swaggerYamlUrl' => "https://api{$index}.test/openapi.yaml",
                        'openapiVer' => '3.0.0',
                    ],
                ],
            ];
        }

        return $payload;
    }
}
