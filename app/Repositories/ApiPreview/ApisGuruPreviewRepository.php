<?php

namespace App\Repositories\ApiPreview;

use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * APIs.guru list.json の Preview 専用 Repository です。
 *
 * このクラスは外部 API 通信だけを担当します。
 * 画面用の整形、先頭10件への変換、DTO 作成、DB 保存、本体同期処理はここに入れません。
 */
class ApisGuruPreviewRepository implements ApisGuruPreviewRepositoryInterface
{
    // Action や mock Action が endpoint 表示用にも使うため public const として公開します。
    public const LIST_URL = 'https://api.apis.guru/v2/list.json';

    /*
     * Preview 画面で request headers として表示する値でもあります。
     * Repository の実通信設定と画面表示の観察値がズレないよう、ここで一元管理します。
     */
    private const REQUEST_HEADERS = [
        'Accept' => 'application/json',
    ];

    // list.json は query parameter なしで取得するため、空配列を明示して画面にも渡します。
    private const QUERY_PARAMETERS = [];

    /**
     * Preview 専用の外部 API 通信です。
     * 整形、Inertia props 生成、DB 保存、本体同期処理はここでは行いません。
     *
     * @return array<string, mixed>
     */
    public function fetchList(): array
    {
        /*
         * response time は Laravel HTTP client の値ではなく、Preview 用にこの Repository 内で測ります。
         * 画面では「今この環境から叩いたときの体感時間」を確認する目的です。
         */
        $startedAt = microtime(true);
        $fetchedAt = now()->toIso8601String();

        try {
            /*
             * timeout / retry / header の確認場所として、この設定は Repository に閉じ込めます。
             * Action や Factory に HTTP client の知識を漏らさないのがこの層の目的です。
             */
            $response = Http::timeout(10)
                ->retry(2, 200, throw: false)
                ->withHeaders(self::REQUEST_HEADERS)
                ->get(self::LIST_URL, self::QUERY_PARAMETERS);
        } catch (Throwable $exception) {
            /*
             * DNS、timeout、TLS など HTTP response を受け取れない失敗も画面で観察したいため、
             * 例外を投げ直さず transport result として返します。
             */
            return $this->failureResult(
                fetchedAt: $fetchedAt,
                responseTimeMs: $this->responseTimeMs($startedAt),
                errorMessage: $exception->getMessage(),
            );
        }

        $payload = $response->json();
        $payloadIsArray = is_array($payload);
        /*
         * HTTP 2xx でも JSON の形が期待と違う場合は success=false にします。
         * Preview 画面は「通信成功」と「観察可能な JSON だったか」をまとめて確認したいためです。
         */
        $success = $response->successful() && $payloadIsArray;

        return [
            'endpoint' => self::LIST_URL,
            'method' => 'GET',
            'request_headers' => self::REQUEST_HEADERS,
            'query_parameters' => self::QUERY_PARAMETERS,
            'success' => $success,
            'status_code' => $response->status(),
            'fetched_at' => $fetchedAt,
            'response_time_ms' => $this->responseTimeMs($startedAt),
            'payload' => $payloadIsArray ? $payload : null,
            'body' => $response->body(),
            'error_message' => $success ? null : $this->errorMessage($response->status(), $payloadIsArray),
        ];
    }

    /**
     * HTTP response が存在しない失敗を、画面表示できる transport result に揃えます。
     *
     * @return array<string, mixed>
     */
    private function failureResult(string $fetchedAt, float $responseTimeMs, string $errorMessage): array
    {
        return [
            'endpoint' => self::LIST_URL,
            'method' => 'GET',
            'request_headers' => self::REQUEST_HEADERS,
            'query_parameters' => self::QUERY_PARAMETERS,
            'success' => false,
            'status_code' => null,
            'fetched_at' => $fetchedAt,
            'response_time_ms' => $responseTimeMs,
            'payload' => null,
            'body' => null,
            'error_message' => $errorMessage,
        ];
    }

    private function responseTimeMs(float $startedAt): float
    {
        // 小数第2位までに丸め、画面のメトリクスカードで読みやすい値にします。
        return round((microtime(true) - $startedAt) * 1000, 2);
    }

    private function errorMessage(int $statusCode, bool $payloadIsArray): string
    {
        // まず HTTP status を優先して表示し、upstream 側の失敗をすぐ確認できるようにします。
        if ($statusCode < 200 || $statusCode >= 300) {
            return sprintf('APIs.guru list.json request failed. Status: %d', $statusCode);
        }

        // HTTP は成功していても JSON として観察できない場合は、レスポンス構造の問題として扱います。
        if (! $payloadIsArray) {
            return 'APIs.guru list.json response was not a JSON object.';
        }

        return 'APIs.guru list.json response could not be previewed.';
    }
}
