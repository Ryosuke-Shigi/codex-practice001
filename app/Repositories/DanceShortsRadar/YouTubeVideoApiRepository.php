<?php

namespace App\Repositories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortSearchConditionDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchItemDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchResultDTO;
use App\Events\ApplicationLog\ApplicationErrorOccurred;
use App\Events\ApplicationLog\ApplicationIntegrationLogged;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

/*
 * YouTube Data API v3 への HTTP 通信と DTO 変換だけを担当する Repository です。
 *
 * search.list で候補動画IDを集め、videos.list で詳細情報を取得します。
 * この層では「YouTube から何を取るか」と「レスポンス配列をどの DTO に写すか」だけを扱い、
 * DB保存、snapshot保存、Shorts確定判定、view_count_delta / view_growth_rate /
 * views_per_hour の算出、上昇候補判定、画面表示用整形は行いません。
 *
 * API キーは config/services.php 経由の config('services.youtube.api_key') から読みます。
 * 未設定時は実 HTTP 通信を始める前に RuntimeException にして、キー実値を例外文へ含めません。
 */
class YouTubeVideoApiRepository implements YouTubeVideoApiRepositoryInterface
{
    private const TIMEOUT_SECONDS = 10;

    private const VIDEOS_LIST_MAX_IDS = 50;

    /**
     * search.list を呼び、検索結果の候補動画を DTO 配列に変換します。
     *
     * part=snippet と type=video は YouTube API 呼び出しとして固定の指定です。
     * keyword や regionCode のような検索条件は DanceShortSearchConditionDTO から受け取り、
     * Repository は条件の業務的な良し悪しを判断しません。
     *
     * @return array<int, YouTubeVideoSearchItemDTO>
     */
    public function searchVideos(DanceShortSearchConditionDTO $condition): array
    {
        return $this->searchVideoPage($condition)->items;
    }

    /**
     * search.list を呼び、候補動画 DTO と次ページ token を返します。
     */
    public function searchVideoPage(
        DanceShortSearchConditionDTO $condition,
        ?string $pageToken = null,
    ): YouTubeVideoSearchResultDTO {
        $apiName = 'search.list';
        $path = 'search';
        $payload = $this->getJson($apiName, $path, array_merge([
            'key' => $this->apiKeyFor($apiName, $path),
            'part' => 'snippet',
            'type' => 'video',
        ], $condition->toArray(), $this->pageTokenQuery($pageToken)));

        return new YouTubeVideoSearchResultDTO(
            items: $this->mapSearchItems($payload),
            nextPageToken: $this->stringValue($payload, ['nextPageToken']),
        );
    }

    /**
     * videos.list を呼び、動画詳細を DTO 配列に変換します。
     *
     * id は YouTube API の仕様に合わせてカンマ区切りで渡します。
     * 空文字や重複IDは外部APIへ送る前に取り除きますが、動画を同期対象にするかどうかの
     * 業務判断はここでは行いません。ID が空配列になった場合だけ、無駄な HTTP 通信を避けます。
     *
     * @param  array<int, string>  $youtubeVideoIds
     * @return array<int, YouTubeVideoDetailDTO>
     */
    public function fetchVideoDetails(array $youtubeVideoIds): array
    {
        $ids = array_values(array_unique(array_filter(
            array_map(
                fn (string $youtubeVideoId): string => trim($youtubeVideoId),
                $youtubeVideoIds,
            ),
            fn (string $youtubeVideoId): bool => $youtubeVideoId !== '',
        )));

        if ($ids === []) {
            return [];
        }

        $apiKey = $this->apiKeyFor('videos.list', 'videos');
        $details = [];

        foreach (array_chunk($ids, self::VIDEOS_LIST_MAX_IDS) as $chunkedIds) {
            $payload = $this->getJson('videos.list', 'videos', [
                'key' => $apiKey,
                'part' => 'snippet,contentDetails,statistics,status',
                'id' => implode(',', $chunkedIds),
            ]);

            array_push($details, ...$this->mapDetailItems($payload));
        }

        return $details;
    }

    /**
     * YouTube API の GET 通信を共通化し、失敗時の扱いを Repository 内で固定します。
     *
     * transport 例外、HTTP 4xx/5xx、JSON として読めないレスポンスはいずれも
     * RuntimeException として扱います。upstream の body 全文や API キーは例外文へ含めません。
     *
     * @param  array<string, string|int>  $query
     * @return array<string, mixed>
     */
    private function getJson(string $apiName, string $path, array $query): array
    {
        $endpoint = $this->endpoint($path);

        try {
            $response = Http::timeout(self::TIMEOUT_SECONDS)
                ->acceptJson()
                ->get($endpoint, $query);
        } catch (Throwable $exception) {
            $message = sprintf('YouTube Data API %s に接続できませんでした。', $apiName);
            $this->dispatchIntegrationLog(
                apiName: $apiName,
                status: 'failed',
                message: $message,
                endpoint: $endpoint,
                responseStatus: null,
            );
            $this->dispatchErrorLog(
                message: $message,
                errorCode: 'dance-shorts.youtube.transport_failed',
                exception: $exception,
                endpoint: $endpoint,
            );

            throw new RuntimeException(
                $message,
                previous: $exception,
            );
        }

        if ($response->failed()) {
            $message = sprintf('YouTube Data API %s の取得先がエラーを返しました。', $apiName);
            $this->dispatchIntegrationLog(
                apiName: $apiName,
                status: 'failed',
                message: $message,
                endpoint: $endpoint,
                responseStatus: $response->status(),
            );

            if ($this->shouldDispatchRequestError($response->status())) {
                $this->dispatchErrorLog(
                    message: $message,
                    errorCode: 'dance-shorts.youtube.request_rejected',
                    endpoint: $endpoint,
                );
            }

            throw new RuntimeException($message);
        }

        try {
            $payload = $this->jsonArray($apiName, $response);
        } catch (RuntimeException $exception) {
            $this->dispatchIntegrationLog(
                apiName: $apiName,
                status: 'failed',
                message: $exception->getMessage(),
                endpoint: $endpoint,
                responseStatus: $response->status(),
            );
            $this->dispatchErrorLog(
                message: $exception->getMessage(),
                errorCode: 'dance-shorts.youtube.response_json_invalid',
                exception: $exception,
                endpoint: $endpoint,
            );

            throw $exception;
        }

        $this->dispatchIntegrationLog(
            apiName: $apiName,
            status: 'success',
            message: '取得しました。',
            endpoint: $endpoint,
            responseStatus: $response->status(),
        );

        return $payload;
    }

    private function apiKeyFor(string $apiName, string $path): string
    {
        try {
            return $this->apiKey();
        } catch (RuntimeException $exception) {
            $endpoint = $this->endpoint($path);
            $this->dispatchIntegrationLog(
                apiName: $apiName,
                status: 'failed',
                message: $exception->getMessage(),
                endpoint: $endpoint,
                responseStatus: null,
            );
            $this->dispatchErrorLog(
                message: $exception->getMessage(),
                errorCode: 'dance-shorts.youtube.api_key_missing',
                exception: $exception,
                endpoint: $endpoint,
            );

            throw $exception;
        }
    }

    private function apiKey(): string
    {
        /*
         * API キー未設定時は実 HTTP 通信を開始しません。
         * 空白だけの値も未設定として扱い、例外文にはキーの値を絶対に含めません。
         */
        $apiKey = config('services.youtube.api_key');

        if (! is_string($apiKey) || trim($apiKey) === '') {
            throw new RuntimeException('YouTube Data APIキーが未設定です。');
        }

        return trim($apiKey);
    }

    private function endpoint(string $path): string
    {
        /*
         * base_url は .env / config で差し替え可能にして、テストでは Http::fake() と
         * config 上書きだけで実 API に触らず確認できるようにします。
         */
        return sprintf(
            '%s/%s',
            rtrim((string) config('services.youtube.base_url'), '/'),
            ltrim($path, '/'),
        );
    }

    private function shouldDispatchRequestError(int $statusCode): bool
    {
        return in_array($statusCode, [401, 403, 429], true);
    }

    private function dispatchIntegrationLog(
        string $apiName,
        string $status,
        string $message,
        string $endpoint,
        ?int $responseStatus,
    ): void {
        event(new ApplicationIntegrationLogged(
            integrationType: 'external_api',
            serviceName: 'YouTube Data API',
            action: $apiName.' 取得',
            status: $status,
            message: $message,
            targetType: 'youtube_api_endpoint',
            targetId: $apiName,
            url: $endpoint,
            method: 'GET',
            responseStatus: $responseStatus,
        ));
    }

    private function dispatchErrorLog(
        string $message,
        string $errorCode,
        ?Throwable $exception = null,
        ?string $endpoint = null,
    ): void {
        event(new ApplicationErrorOccurred(
            level: 'error',
            message: $message,
            errorCode: $errorCode,
            exception: $exception,
            url: $endpoint,
            method: 'GET',
        ));
    }

    /**
     * @return array<string, string>
     */
    private function pageTokenQuery(?string $pageToken): array
    {
        $pageToken = is_string($pageToken) ? trim($pageToken) : '';

        return $pageToken === '' ? [] : ['pageToken' => $pageToken];
    }

    /**
     * Laravel HTTP client の JSON 結果が配列であることだけを確認します。
     *
     * レスポンス構造の詳細な検証や不足項目の補完は、各 map メソッド側で
     * DTO に必要な値だけを安全に取り出す形に寄せます。
     *
     * @return array<string, mixed>
     */
    private function jsonArray(string $apiName, Response $response): array
    {
        $payload = $response->json();

        if (! is_array($payload)) {
            throw new RuntimeException(sprintf(
                'YouTube Data API %s のJSON形式が想定外です。',
                $apiName,
            ));
        }

        return $payload;
    }

    /**
     * search.list の items を候補動画 DTO に変換します。
     *
     * YouTube 側のレスポンスに想定外の要素が混ざっても、DTO 化に必要な videoId を
     * 取れない item はスキップします。API レスポンス全体を保持しない方針を守るため、
     * ここで必要な値だけを切り出します。
     *
     * @param  array<string, mixed>  $payload
     * @return array<int, YouTubeVideoSearchItemDTO>
     */
    private function mapSearchItems(array $payload): array
    {
        $items = $payload['items'] ?? [];

        if (! is_array($items)) {
            return [];
        }

        $dtos = [];

        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $dto = $this->mapSearchItem($item);

            if ($dto !== null) {
                $dtos[] = $dto;
            }
        }

        return $dtos;
    }

    /**
     * search.list item 1件を DTO に写します。
     *
     * search.list では duration や statistics を取得しないため、候補IDと snippet の
     * 表示にも使える基本情報だけを保持します。Shorts候補かどうかの確定は行いません。
     *
     * @param  array<string, mixed>  $item
     */
    private function mapSearchItem(array $item): ?YouTubeVideoSearchItemDTO
    {
        $videoId = $this->stringValue($item, ['id', 'videoId']);

        if ($videoId === null) {
            return null;
        }

        $snippet = $this->arrayValue($item, ['snippet']);

        return new YouTubeVideoSearchItemDTO(
            youtubeVideoId: $videoId,
            title: $this->stringValue($item, ['snippet', 'title']),
            description: $this->stringValue($item, ['snippet', 'description']),
            channelId: $this->stringValue($item, ['snippet', 'channelId']),
            channelTitle: $this->stringValue($item, ['snippet', 'channelTitle']),
            publishedAt: $this->stringValue($item, ['snippet', 'publishedAt']),
            thumbnailUrl: $snippet === null ? null : $this->thumbnailUrl($snippet),
        );
    }

    /**
     * videos.list の items を詳細 DTO に変換します。
     *
     * videos.list では snippet / contentDetails / statistics / status を取得しますが、
     * 保存先や派生値の判断は Repository ではなく後続 Service / Repository に分けます。
     *
     * @param  array<string, mixed>  $payload
     * @return array<int, YouTubeVideoDetailDTO>
     */
    private function mapDetailItems(array $payload): array
    {
        $items = $payload['items'] ?? [];

        if (! is_array($items)) {
            return [];
        }

        $dtos = [];

        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $dto = $this->mapDetailItem($item);

            if ($dto !== null) {
                $dtos[] = $dto;
            }
        }

        return $dtos;
    }

    /**
     * videos.list item 1件を DTO に写します。
     *
     * statistics の likeCount / commentCount は API 側の公開状態によって欠落するため、
     * null 許容で取り出します。favoriteCount は今回の同期方針では使わないため保持しません。
     *
     * @param  array<string, mixed>  $item
     */
    private function mapDetailItem(array $item): ?YouTubeVideoDetailDTO
    {
        $videoId = $this->stringValue($item, ['id']);

        if ($videoId === null) {
            return null;
        }

        $snippet = $this->arrayValue($item, ['snippet']);
        $tags = $this->arrayValue($item, ['snippet', 'tags']) ?? [];

        return new YouTubeVideoDetailDTO(
            youtubeVideoId: $videoId,
            title: $this->stringValue($item, ['snippet', 'title']),
            description: $this->stringValue($item, ['snippet', 'description']),
            channelId: $this->stringValue($item, ['snippet', 'channelId']),
            channelTitle: $this->stringValue($item, ['snippet', 'channelTitle']),
            thumbnailUrl: $snippet === null ? null : $this->thumbnailUrl($snippet),
            publishedAt: $this->stringValue($item, ['snippet', 'publishedAt']),
            categoryId: $this->stringValue($item, ['snippet', 'categoryId']),
            tags: array_values(array_filter($tags, is_string(...))),
            duration: $this->stringValue($item, ['contentDetails', 'duration']),
            defaultLanguage: $this->stringValue($item, ['snippet', 'defaultLanguage']),
            defaultAudioLanguage: $this->stringValue($item, ['snippet', 'defaultAudioLanguage']),
            liveBroadcastContent: $this->stringValue($item, ['snippet', 'liveBroadcastContent']),
            embeddable: $this->boolValue($item, ['status', 'embeddable']),
            viewCount: $this->intValue($item, ['statistics', 'viewCount']),
            likeCount: $this->intValue($item, ['statistics', 'likeCount']),
            commentCount: $this->intValue($item, ['statistics', 'commentCount']),
        );
    }

    /**
     * YouTube thumbnails から利用する URL を選びます。
     *
     * 表示品質を固定するため high -> medium -> default の順に優先します。
     * ここでは URL 選択だけに留め、画像の存在確認や表示用サイズ調整は行いません。
     *
     * @param  array<string, mixed>  $snippet
     */
    private function thumbnailUrl(array $snippet): ?string
    {
        $thumbnails = $snippet['thumbnails'] ?? [];

        if (! is_array($thumbnails)) {
            return null;
        }

        foreach (['high', 'medium', 'default'] as $size) {
            $url = $this->stringValue($thumbnails, [$size, 'url']);

            if ($url !== null) {
                return $url;
            }
        }

        return null;
    }

    /**
     * ネストしたレスポンス値を文字列として取り出します。
     *
     * YouTube API は数値を文字列で返す項目もありますが、この helper は文字列項目専用です。
     * 空文字は欠落と同じ扱いにして、DTO 側では null として運びます。
     *
     * @param  array<string, mixed>  $payload
     * @param  array<int, string>  $keys
     */
    private function stringValue(array $payload, array $keys): ?string
    {
        $value = $this->nestedValue($payload, $keys);

        return is_string($value) && $value !== '' ? $value : null;
    }

    /**
     * ネストしたレスポンス値を整数として取り出します。
     *
     * statistics の count 系は文字列で返るため、数字文字列だけ int に変換します。
     * 小数や負値など想定外の形は業務判断せず null として扱います。
     *
     * @param  array<string, mixed>  $payload
     * @param  array<int, string>  $keys
     */
    private function intValue(array $payload, array $keys): ?int
    {
        $value = $this->nestedValue($payload, $keys);

        if (is_int($value)) {
            return $value;
        }

        return is_string($value) && ctype_digit($value) ? (int) $value : null;
    }

    /**
     * ネストしたレスポンス値を bool として取り出します。
     *
     * status.embeddable のように API が boolean として返す項目だけを受け入れます。
     *
     * @param  array<string, mixed>  $payload
     * @param  array<int, string>  $keys
     */
    private function boolValue(array $payload, array $keys): ?bool
    {
        $value = $this->nestedValue($payload, $keys);

        return is_bool($value) ? $value : null;
    }

    /**
     * ネストしたレスポンス値を配列として取り出します。
     *
     * snippet や thumbnails など、後続で必要項目をさらに切り出す親要素にだけ使います。
     *
     * @param  array<string, mixed>  $payload
     * @param  array<int, string>  $keys
     * @return array<string, mixed>|null
     */
    private function arrayValue(array $payload, array $keys): ?array
    {
        $value = $this->nestedValue($payload, $keys);

        return is_array($value) ? $value : null;
    }

    /**
     * ネストした連想配列から値を取り出す小さな helper です。
     *
     * YouTube API のレスポンスは optional な階層が多いため、各 map メソッドで
     * isset チェックを繰り返さず、欠落時は null にそろえます。
     *
     * @param  array<string, mixed>  $payload
     * @param  array<int, string>  $keys
     */
    private function nestedValue(array $payload, array $keys): mixed
    {
        $value = $payload;

        foreach ($keys as $key) {
            if (! is_array($value) || ! array_key_exists($key, $value)) {
                return null;
            }

            $value = $value[$key];
        }

        return $value;
    }
}
