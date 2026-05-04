<?php

namespace App\Factories\ApiPreview;

use App\DTO\ApiPreview\ApiPreviewResultDTO;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

/**
 * APIs.guru の transport result を API Preview 画面用 DTO に変換する Factory です。
 *
 * Repository は「通信した結果」を返すだけにしているため、画面で観察しやすい
 * total count、先頭10件、provider/service 分割、raw preview の切り詰めはここで行います。
 * 本体 API Discovery Hub 側の DTO 設計とは別物として扱います。
 */
class ApisGuruPreviewResultFactory
{
    /**
     * Repository が返した transport result を、API Preview 画面専用 DTO に変換します。
     *
     * @param  array<string, mixed>  $transportResult
     */
    public function fromTransportResult(array $transportResult): ApiPreviewResultDTO
    {
        $payload = Arr::get($transportResult, 'payload');
        /*
         * APIs.guru list.json は API key をキーにした連想配列です。
         * HTTP 通信が成功し、payload が配列として読めた場合だけ catalog として扱います。
         */
        $payloadIsCatalog = Arr::get($transportResult, 'success') === true && is_array($payload);

        return new ApiPreviewResultDTO(
            apiName: 'APIs.guru list.json',
            endpoint: (string) Arr::get($transportResult, 'endpoint'),
            method: (string) Arr::get($transportResult, 'method'),
            success: Arr::get($transportResult, 'success') === true,
            statusCode: Arr::get($transportResult, 'status_code'),
            fetchedAt: Arr::get($transportResult, 'fetched_at'),
            /*
             * 失敗時は 0 件ではなく null にします。
             * 「正常に取得できた結果が 0 件」と「取得・解釈に失敗した」を画面上で区別するためです。
             */
            totalCount: $payloadIsCatalog ? count($payload) : null,
            responseTimeMs: Arr::get($transportResult, 'response_time_ms'),
            errorMessage: Arr::get($transportResult, 'error_message'),
            requestHeaders: Arr::get($transportResult, 'request_headers', []),
            queryParameters: Arr::get($transportResult, 'query_parameters', []),
            /*
             * responsePreview も失敗時は null にします。
             * React 側は null を空表示として扱い、エラー状態のレイアウト確認に使います。
             */
            responsePreview: $payloadIsCatalog ? $this->buildItems($payload) : null,
            rawPayloadPreview: $this->buildRawPayloadPreview($transportResult),
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<int, array<string, mixed>>
     */
    private function buildItems(array $payload): array
    {
        /*
         * DTO 設計前の観察用として、一覧画面に必要な先頭10件だけを抜き出します。
         * ここで全件を整形しないのは、画面確認の負荷と props サイズを抑えるためです。
         */
        $items = [];

        foreach (array_slice($payload, 0, 10, true) as $apiKey => $api) {
            /*
             * 外部 API のレスポンスは信用しすぎません。
             * key が文字列で、value が配列のものだけ preview 行として扱います。
             */
            if (! is_string($apiKey) || ! is_array($api)) {
                continue;
            }

            $preferredVersion = Arr::get($api, 'preferred');
            $versions = Arr::get($api, 'versions', []);
            /*
             * APIs.guru は versions の中に OpenAPI URL や info を持っています。
             * preferred が指す version を優先して観察し、存在しない場合は下の fallback に任せます。
             */
            $version = is_string($preferredVersion) && is_array($versions)
                ? Arr::get($versions, $preferredVersion, [])
                : [];

            /*
             * preferred version が壊れている、または想定と違う場合でも画面確認を続けられるよう、
             * versions の先頭要素を fallback として使います。
             */
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
        /*
         * APIs.guru の key は provider だけのものと provider:service のものがあります。
         * 例:
         * - github.com
         * - googleapis.com:drive
         */
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

        /*
         * Repository が生の body を持っている場合はそれを優先します。
         * JSON decode 後に情報が丸められる可能性を避け、観察用には実際の raw に近いものを出します。
         */
        if (is_string($body) && $body !== '') {
            return Str::limit($body, 6000);
        }

        /*
         * 例外時や fake response などで body が空の場合は payload から preview を再構築します。
         * 6000 文字で切ることで、Inertia props と画面描画が重くなりすぎないようにします。
         */
        $payload = Arr::get($transportResult, 'payload');
        $json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        return Str::limit(is_string($json) ? $json : '', 6000);
    }
}
