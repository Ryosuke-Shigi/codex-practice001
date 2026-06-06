<?php

namespace App\Repositories\ApiCatalog;

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
            throw new RuntimeException('Failed to fetch APIs.guru list.json.', previous: $exception);
        }

        if ($response->failed()) {
            throw new RuntimeException(sprintf(
                'Failed to fetch APIs.guru list.json. Status: %d',
                $response->status(),
            ));
        }

        $json = $response->json();

        if (! is_array($json)) {
            throw new RuntimeException('APIs.guru list.json response was not an array.');
        }

        return $json;
    }
}
