<?php

namespace App\Actions\ApiPreview;

use App\DTO\ApiPreview\ApiPreviewResultDTO;
use App\Repositories\ApiPreview\ApisGuruRepository;
use App\Responders\ApiPreviewResponder;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Inertia\Response;

class PreviewApisGuruListAction
{
    public function __construct(
        private readonly ApisGuruRepository $repository,
        private readonly ApiPreviewResponder $responder,
    ) {
    }

    public function execute(bool $shouldFetch): Response
    {
        return $this->responder->apisGuru([
            'api' => [
                'name' => 'APIs.guru list.json',
                'endpoint' => ApisGuruRepository::LIST_URL,
                'method' => 'GET',
            ],
            'canFetch' => true,
            'hasFetched' => $shouldFetch,
            // 初期表示では外部 API を叩かず、ボタン押下後の fetch=1 だけで取得します。
            'result' => $shouldFetch
                ? $this->buildPreview($this->repository->fetchList())->toArray()
                : null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $transportResult
     */
    private function buildPreview(array $transportResult): ApiPreviewResultDTO
    {
        $payload = Arr::get($transportResult, 'payload');
        // HTTP 成功かつ payload が catalog 配列のときだけ、先頭10件の表示用に整形します。
        $payloadIsCatalog = Arr::get($transportResult, 'success') === true && is_array($payload);

        return new ApiPreviewResultDTO(
            apiName: 'APIs.guru list.json',
            endpoint: (string) Arr::get($transportResult, 'endpoint'),
            method: (string) Arr::get($transportResult, 'method'),
            success: Arr::get($transportResult, 'success') === true,
            statusCode: Arr::get($transportResult, 'status_code'),
            fetchedAt: Arr::get($transportResult, 'fetched_at'),
            totalCount: $payloadIsCatalog ? count($payload) : 0,
            responseTimeMs: Arr::get($transportResult, 'response_time_ms'),
            errorMessage: Arr::get($transportResult, 'error_message'),
            requestHeaders: Arr::get($transportResult, 'request_headers', []),
            queryParameters: Arr::get($transportResult, 'query_parameters', []),
            responsePreview: $payloadIsCatalog ? $this->buildItems($payload) : [],
            rawPayloadPreview: $this->buildRawPayloadPreview($transportResult),
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<int, array<string, mixed>>
     */
    private function buildItems(array $payload): array
    {
        // DTO 設計前の観察用として、一覧画面に必要な先頭10件だけを抜き出します。
        $items = [];

        foreach (array_slice($payload, 0, 10, true) as $apiKey => $api) {
            if (! is_string($apiKey) || ! is_array($api)) {
                continue;
            }

            $preferredVersion = Arr::get($api, 'preferred');
            $versions = Arr::get($api, 'versions', []);
            $version = is_string($preferredVersion) && is_array($versions)
                ? Arr::get($versions, $preferredVersion, [])
                : [];

            if (! is_array($version) && is_array($versions)) {
                $firstVersion = reset($versions);
                $version = is_array($firstVersion) ? $firstVersion : [];
            }

            [$providerKey, $serviceKey] = $this->splitApiKey($apiKey);

            $items[] = [
                'api_key' => $apiKey,
                'title' => Arr::get($version, 'info.title'),
                'description' => Arr::get($version, 'info.description'),
                'provider_key' => $providerKey,
                'service_key' => $serviceKey,
                'preferred_version' => $preferredVersion,
                'openapi_json_url' => Arr::get($version, 'swaggerUrl'),
                'openapi_yaml_url' => Arr::get($version, 'swaggerYamlUrl'),
                'openapi_version' => Arr::get($version, 'openapiVer'),
            ];
        }

        return $items;
    }

    /**
     * @return array{0: string, 1: string|null}
     */
    private function splitApiKey(string $apiKey): array
    {
        if (! str_contains($apiKey, ':')) {
            return [$apiKey, null];
        }

        [$providerKey, $serviceKey] = explode(':', $apiKey, 2);

        return [$providerKey, $serviceKey !== '' ? $serviceKey : null];
    }

    /**
     * @param  array<string, mixed>  $transportResult
     */
    private function buildRawPayloadPreview(array $transportResult): string
    {
        $body = Arr::get($transportResult, 'body');

        if (is_string($body) && $body !== '') {
            return Str::limit($body, 6000);
        }

        $payload = Arr::get($transportResult, 'payload');
        $json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        return Str::limit(is_string($json) ? $json : '', 6000);
    }
}
