<?php

namespace App\Repositories\ApiCatalog;

use App\Events\ApplicationLog\ApplicationErrorOccurred;
use App\Events\ApplicationLog\ApplicationIntegrationLogged;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class ApisGuruRepository implements ApisGuruRepositoryInterface
{
    private const LIST_URL = 'https://api.apis.guru/v2/list.json';

    /**
     * APIs.guru の catalog list を取得します。
     *
     * 外部 API への HTTP 通信だけを担当し、payload の意味づけや DB 保存判断は Service 側へ渡します。
     *
     * @return array<string, mixed>
     */
    public function fetchList(): array
    {
        try {
            $response = Http::timeout(10)
                ->retry(3, 200, throw: false)
                ->acceptJson()
                ->get(self::LIST_URL);
        } catch (Throwable $exception) {
            $message = 'APIs.guru list.json に接続できませんでした。';
            $this->dispatchIntegrationLog(
                status: 'failed',
                message: $message,
                responseStatus: null,
            );
            $this->dispatchErrorLog(
                message: $message,
                errorCode: 'api-catalog.apis-guru.transport_failed',
                exception: $exception,
            );

            throw new RuntimeException($message, previous: $exception);
        }

        if ($response->failed()) {
            $message = 'APIs.guru list.json の取得先がエラーを返しました。';
            $this->dispatchIntegrationLog(
                status: 'failed',
                message: $message,
                responseStatus: $response->status(),
            );
            $this->dispatchErrorLog(
                message: $message,
                errorCode: 'api-catalog.apis-guru.request_failed',
            );

            throw new RuntimeException($message);
        }

        $json = $response->json();

        if (! is_array($json)) {
            $message = 'APIs.guru list.json のJSON形式が想定外です。';
            $this->dispatchIntegrationLog(
                status: 'failed',
                message: $message,
                responseStatus: $response->status(),
            );
            $this->dispatchErrorLog(
                message: $message,
                errorCode: 'api-catalog.apis-guru.response_json_invalid',
            );

            throw new RuntimeException($message);
        }

        $this->dispatchIntegrationLog(
            status: 'success',
            message: '取得しました。',
            responseStatus: $response->status(),
        );

        return $json;
    }

    private function dispatchIntegrationLog(
        string $status,
        string $message,
        ?int $responseStatus,
    ): void {
        event(new ApplicationIntegrationLogged(
            integrationType: 'external_api',
            serviceName: 'APIs.guru',
            action: 'list.json 取得',
            status: $status,
            message: $message,
            targetType: 'apis_guru_endpoint',
            targetId: 'list.json',
            url: self::LIST_URL,
            method: 'GET',
            responseStatus: $responseStatus,
        ));
    }

    private function dispatchErrorLog(
        string $message,
        string $errorCode,
        ?Throwable $exception = null,
    ): void {
        event(new ApplicationErrorOccurred(
            level: 'error',
            message: $message,
            errorCode: $errorCode,
            exception: $exception,
            url: self::LIST_URL,
            method: 'GET',
        ));
    }
}
