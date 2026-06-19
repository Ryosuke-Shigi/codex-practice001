<?php

namespace Tests\Unit\DanceShortsRadar\Repositories;

use App\DTO\DanceShortsRadar\Sync\DanceShortSearchConditionDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchItemDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchResultDTO;
use App\Events\ApplicationLog\ApplicationErrorOccurred;
use App\Events\ApplicationLog\ApplicationIntegrationLogged;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class YouTubeVideoApiRepositoryTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Event::fake([
            ApplicationErrorOccurred::class,
            ApplicationIntegrationLogged::class,
        ]);
    }

    public function test_search_videos_sends_search_query_and_maps_result_items(): void
    {
        $this->configureYoutubeApi();

        Http::fake([
            'https://www.googleapis.test/youtube/v3/search*' => Http::response([
                'items' => [
                    [
                        'id' => [
                            'kind' => 'youtube#video',
                            'videoId' => 'search-video-001',
                        ],
                        'snippet' => [
                            'publishedAt' => '2026-05-31T12:00:00Z',
                            'channelId' => 'channel-001',
                            'title' => 'Dance candidate',
                            'description' => 'Search result description.',
                            'thumbnails' => [
                                'default' => ['url' => 'https://example.test/default.jpg'],
                                'medium' => ['url' => 'https://example.test/medium.jpg'],
                                'high' => ['url' => 'https://example.test/high.jpg'],
                            ],
                            'channelTitle' => 'Dance Channel',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $items = $this->repository()->searchVideos($this->condition());

        $this->assertCount(1, $items);
        $this->assertInstanceOf(YouTubeVideoSearchItemDTO::class, $items[0]);
        $this->assertSame('search-video-001', $items[0]->youtubeVideoId);
        $this->assertSame('Dance candidate', $items[0]->title);
        $this->assertSame('https://example.test/high.jpg', $items[0]->thumbnailUrl);

        Http::assertSent(function (Request $request): bool {
            $query = $this->queryFromRequest($request);

            return str_starts_with($request->url(), 'https://www.googleapis.test/youtube/v3/search')
                && $request->method() === 'GET'
                && $query['key'] === 'test-youtube-api-key'
                && $query['part'] === 'snippet'
                && $query['type'] === 'video'
                && $query['q'] === 'dance shorts'
                && $query['regionCode'] === 'JP'
                && $query['relevanceLanguage'] === 'ja'
                && $query['maxResults'] === '25'
                && $query['publishedAfter'] === '2026-05-24T00:00:00+00:00'
                && $query['videoDuration'] === 'short';
        });
        Event::assertDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->serviceName === 'YouTube Data API'
                && $event->action === 'search.list 取得'
                && $event->status === 'success'
                && $event->targetId === 'search.list'
                && $event->url === 'https://www.googleapis.test/youtube/v3/search'
                && $event->responseStatus === 200,
        );
    }

    public function test_search_video_page_sends_page_token_and_returns_next_page_token(): void
    {
        $this->configureYoutubeApi();

        Http::fake([
            'https://www.googleapis.test/youtube/v3/search*' => Http::response([
                'nextPageToken' => 'next-token',
                'items' => [
                    [
                        'id' => [
                            'kind' => 'youtube#video',
                            'videoId' => 'page-video-001',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $result = $this->repository()->searchVideoPage($this->condition(), ' current-token ');

        $this->assertInstanceOf(YouTubeVideoSearchResultDTO::class, $result);
        $this->assertSame('next-token', $result->nextPageToken);
        $this->assertCount(1, $result->items);
        $this->assertSame('page-video-001', $result->items[0]->youtubeVideoId);

        Http::assertSent(function (Request $request): bool {
            $query = $this->queryFromRequest($request);

            return str_starts_with($request->url(), 'https://www.googleapis.test/youtube/v3/search')
                && $request->method() === 'GET'
                && $query['pageToken'] === 'current-token'
                && $query['part'] === 'snippet'
                && $query['type'] === 'video';
        });
    }

    public function test_fetch_video_details_sends_comma_separated_ids_and_maps_detail_items(): void
    {
        $this->configureYoutubeApi();

        Http::fake([
            'https://www.googleapis.test/youtube/v3/videos*' => Http::response([
                'items' => [
                    [
                        'id' => 'detail-video-001',
                        'snippet' => [
                            'publishedAt' => '2026-05-31T12:00:00Z',
                            'channelId' => 'channel-001',
                            'title' => 'Dance detail',
                            'description' => 'Detail description.',
                            'thumbnails' => [
                                'medium' => ['url' => 'https://example.test/medium.jpg'],
                            ],
                            'channelTitle' => 'Dance Channel',
                            'categoryId' => '10',
                            'tags' => ['dance', 'shorts'],
                            'defaultLanguage' => 'ja',
                            'defaultAudioLanguage' => 'ja',
                            'liveBroadcastContent' => 'none',
                        ],
                        'contentDetails' => [
                            'duration' => 'PT58S',
                        ],
                        'statistics' => [
                            'viewCount' => '123456',
                            'likeCount' => '7890',
                            'commentCount' => '123',
                        ],
                        'status' => [
                            'embeddable' => true,
                        ],
                    ],
                ],
            ], 200),
        ]);

        $items = $this->repository()->fetchVideoDetails(['detail-video-001', 'detail-video-002']);

        $this->assertCount(1, $items);
        $this->assertInstanceOf(YouTubeVideoDetailDTO::class, $items[0]);
        $this->assertSame('detail-video-001', $items[0]->youtubeVideoId);
        $this->assertSame('PT58S', $items[0]->duration);
        $this->assertSame(['dance', 'shorts'], $items[0]->tags);
        $this->assertTrue($items[0]->embeddable);
        $this->assertSame(123456, $items[0]->viewCount);
        $this->assertSame(7890, $items[0]->likeCount);
        $this->assertSame(123, $items[0]->commentCount);
        $this->assertSame('https://example.test/medium.jpg', $items[0]->thumbnailUrl);

        Http::assertSent(function (Request $request): bool {
            $query = $this->queryFromRequest($request);

            return str_starts_with($request->url(), 'https://www.googleapis.test/youtube/v3/videos')
                && $request->method() === 'GET'
                && $query['key'] === 'test-youtube-api-key'
                && $query['part'] === 'snippet,contentDetails,statistics,status'
                && $query['id'] === 'detail-video-001,detail-video-002';
        });
        Event::assertDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->action === 'videos.list 取得'
                && $event->status === 'success'
                && $event->targetId === 'videos.list'
                && $event->url === 'https://www.googleapis.test/youtube/v3/videos'
                && $event->responseStatus === 200,
        );
    }

    public function test_fetch_video_details_splits_ids_into_fifty_id_chunks_and_merges_detail_items(): void
    {
        $this->configureYoutubeApi();
        $requestedChunks = [];

        Http::fake([
            'https://www.googleapis.test/youtube/v3/videos*' => function (Request $request) use (&$requestedChunks) {
                $query = $this->queryFromRequest($request);
                $ids = explode(',', $query['id']);
                $requestedChunks[] = $ids;

                return Http::response([
                    'items' => array_map(
                        fn (string $youtubeVideoId): array => $this->detailItemPayload($youtubeVideoId),
                        $ids,
                    ),
                ], 200);
            },
        ]);

        $youtubeVideoIds = array_map(
            fn (int $number): string => sprintf('detail-video-%03d', $number),
            range(1, 120),
        );

        $items = $this->repository()->fetchVideoDetails($youtubeVideoIds);

        $this->assertCount(120, $items);
        $this->assertSame($youtubeVideoIds[0], $items[0]->youtubeVideoId);
        $this->assertSame($youtubeVideoIds[119], $items[119]->youtubeVideoId);
        $this->assertSame([
            array_slice($youtubeVideoIds, 0, 50),
            array_slice($youtubeVideoIds, 50, 50),
            array_slice($youtubeVideoIds, 100, 20),
        ], $requestedChunks);
        Http::assertSentCount(3);
        Event::assertDispatchedTimes(ApplicationIntegrationLogged::class, 3);
    }

    public function test_fetch_video_details_does_not_send_duplicate_or_empty_ids(): void
    {
        $this->configureYoutubeApi();

        Http::fake([
            'https://www.googleapis.test/youtube/v3/videos*' => Http::response([
                'items' => [],
            ], 200),
        ]);

        $this->repository()->fetchVideoDetails([
            ' detail-video-001 ',
            '',
            'detail-video-001',
            ' ',
            'detail-video-002',
        ]);

        Http::assertSent(function (Request $request): bool {
            $query = $this->queryFromRequest($request);

            return $query['id'] === 'detail-video-001,detail-video-002';
        });
        Http::assertSentCount(1);
    }

    public function test_fetch_video_details_does_not_send_request_when_ids_are_empty(): void
    {
        $this->configureYoutubeApi();
        Http::preventStrayRequests();

        $items = $this->repository()->fetchVideoDetails(['', ' ', '   ']);

        $this->assertSame([], $items);
        Http::assertNothingSent();
    }

    public function test_fetch_video_details_handles_missing_like_and_comment_counts(): void
    {
        $this->configureYoutubeApi();

        Http::fake([
            'https://www.googleapis.test/youtube/v3/videos*' => Http::response([
                'items' => [
                    [
                        'id' => 'detail-video-optional-statistics',
                        'snippet' => [
                            'title' => 'Optional statistics video',
                        ],
                        'statistics' => [
                            'viewCount' => '1000',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $items = $this->repository()->fetchVideoDetails(['detail-video-optional-statistics']);

        $this->assertSame(1000, $items[0]->viewCount);
        $this->assertNull($items[0]->likeCount);
        $this->assertNull($items[0]->commentCount);
    }

    public function test_thumbnail_priority_uses_high_then_medium_then_default(): void
    {
        $this->configureYoutubeApi();

        Http::fake([
            'https://www.googleapis.test/youtube/v3/search*' => Http::response([
                'items' => [
                    [
                        'id' => ['videoId' => 'with-high'],
                        'snippet' => [
                            'thumbnails' => [
                                'default' => ['url' => 'https://example.test/default.jpg'],
                                'medium' => ['url' => 'https://example.test/medium.jpg'],
                                'high' => ['url' => 'https://example.test/high.jpg'],
                            ],
                        ],
                    ],
                    [
                        'id' => ['videoId' => 'with-medium'],
                        'snippet' => [
                            'thumbnails' => [
                                'default' => ['url' => 'https://example.test/default-only.jpg'],
                                'medium' => ['url' => 'https://example.test/medium-only.jpg'],
                            ],
                        ],
                    ],
                    [
                        'id' => ['videoId' => 'with-default'],
                        'snippet' => [
                            'thumbnails' => [
                                'default' => ['url' => 'https://example.test/default-fallback.jpg'],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $items = $this->repository()->searchVideos($this->condition());

        $this->assertSame('https://example.test/high.jpg', $items[0]->thumbnailUrl);
        $this->assertSame('https://example.test/medium-only.jpg', $items[1]->thumbnailUrl);
        $this->assertSame('https://example.test/default-fallback.jpg', $items[2]->thumbnailUrl);
    }

    public function test_missing_api_key_throws_before_sending_http_request(): void
    {
        config([
            'services.youtube.api_key' => '',
            'services.youtube.base_url' => 'https://www.googleapis.test/youtube/v3',
        ]);

        Http::preventStrayRequests();

        try {
            $this->repository()->searchVideos($this->condition());
            $this->fail('Expected missing YouTube API key to throw.');
        } catch (RuntimeException $exception) {
            $this->assertSame('YouTube Data APIキーが未設定です。', $exception->getMessage());
        }

        Http::assertNothingSent();
        Event::assertDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->action === 'search.list 取得'
                && $event->status === 'failed'
                && $event->responseStatus === null
                && $event->url === 'https://www.googleapis.test/youtube/v3/search'
                && ! str_contains((string) $event->message, 'test-youtube-api-key'),
        );
        Event::assertDispatched(
            ApplicationErrorOccurred::class,
            fn (ApplicationErrorOccurred $event): bool => $event->errorCode === 'dance-shorts.youtube.api_key_missing'
                && $event->url === 'https://www.googleapis.test/youtube/v3/search',
        );
    }

    public function test_server_api_failure_dispatches_error_log_without_response_body(): void
    {
        $this->configureYoutubeApi();

        Http::fake([
            'https://www.googleapis.test/youtube/v3/search*' => Http::response([
                'error' => [
                    'message' => 'upstream error body should not be exposed',
                ],
            ], 503),
        ]);

        try {
            $this->repository()->searchVideos($this->condition());
            $this->fail('Expected YouTube API failure to throw.');
        } catch (RuntimeException $exception) {
            $this->assertSame('YouTube Data API search.list の取得先がエラーを返しました。', $exception->getMessage());
            $this->assertStringNotContainsString('upstream error body', $exception->getMessage());
        }

        Event::assertDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->action === 'search.list 取得'
                && $event->status === 'failed'
                && $event->responseStatus === 503
                && $event->url === 'https://www.googleapis.test/youtube/v3/search'
                && ! str_contains((string) $event->message, 'upstream error body')
                && ! str_contains((string) $event->url, 'test-youtube-api-key'),
        );
        Event::assertDispatched(
            ApplicationErrorOccurred::class,
            fn (ApplicationErrorOccurred $event): bool => $event->errorCode === 'dance-shorts.youtube.request_rejected'
                && $event->message === 'YouTube Data API search.list の取得先がエラーを返しました。'
                && $event->url === 'https://www.googleapis.test/youtube/v3/search'
                && $event->method === 'GET'
                && ! str_contains($event->message, 'upstream error body')
                && ! str_contains((string) $event->url, 'test-youtube-api-key'),
        );
    }

    public function test_client_api_failure_keeps_error_log_quiet_without_response_body(): void
    {
        $this->configureYoutubeApi();

        Http::fake([
            'https://www.googleapis.test/youtube/v3/search*' => Http::response([
                'error' => [
                    'message' => 'bad request body should not be exposed',
                ],
            ], 400),
        ]);

        try {
            $this->repository()->searchVideos($this->condition());
            $this->fail('Expected YouTube API failure to throw.');
        } catch (RuntimeException $exception) {
            $this->assertSame('YouTube Data API search.list の取得先がエラーを返しました。', $exception->getMessage());
            $this->assertStringNotContainsString('bad request body', $exception->getMessage());
        }

        Event::assertDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->action === 'search.list 取得'
                && $event->status === 'failed'
                && $event->responseStatus === 400
                && $event->url === 'https://www.googleapis.test/youtube/v3/search'
                && ! str_contains((string) $event->message, 'bad request body')
                && ! str_contains((string) $event->url, 'test-youtube-api-key'),
        );
        Event::assertNotDispatched(
            ApplicationErrorOccurred::class,
            fn (ApplicationErrorOccurred $event): bool => $event->errorCode === 'dance-shorts.youtube.request_rejected',
        );
    }

    public function test_invalid_json_dispatches_failed_integration_and_error_logs_without_response_body(): void
    {
        $this->configureYoutubeApi();

        Http::fake([
            'https://www.googleapis.test/youtube/v3/search*' => Http::response('not json', 200),
        ]);

        try {
            $this->repository()->searchVideos($this->condition());
            $this->fail('Expected invalid YouTube JSON to throw.');
        } catch (RuntimeException $exception) {
            $this->assertSame('YouTube Data API search.list のJSON形式が想定外です。', $exception->getMessage());
        }

        Event::assertDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->action === 'search.list 取得'
                && $event->status === 'failed'
                && $event->responseStatus === 200
                && ! str_contains((string) $event->message, 'not json'),
        );
        Event::assertDispatched(
            ApplicationErrorOccurred::class,
            fn (ApplicationErrorOccurred $event): bool => $event->errorCode === 'dance-shorts.youtube.response_json_invalid'
                && ! str_contains($event->message, 'not json'),
        );
    }

    private function configureYoutubeApi(): void
    {
        config([
            'services.youtube.api_key' => 'test-youtube-api-key',
            'services.youtube.base_url' => 'https://www.googleapis.test/youtube/v3',
        ]);
    }

    private function repository(): YouTubeVideoApiRepositoryInterface
    {
        return app(YouTubeVideoApiRepositoryInterface::class);
    }

    private function condition(): DanceShortSearchConditionDTO
    {
        return new DanceShortSearchConditionDTO(
            keyword: 'dance shorts',
            regionCode: 'JP',
            relevanceLanguage: 'ja',
            maxResults: 25,
            publishedAfter: CarbonImmutable::parse('2026-05-24 00:00:00', 'UTC'),
            videoDuration: 'short',
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function detailItemPayload(string $youtubeVideoId): array
    {
        return [
            'id' => $youtubeVideoId,
            'snippet' => [
                'title' => sprintf('Dance detail %s', $youtubeVideoId),
            ],
            'contentDetails' => [
                'duration' => 'PT58S',
            ],
            'statistics' => [
                'viewCount' => '1000',
            ],
            'status' => [
                'embeddable' => true,
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    private function queryFromRequest(Request $request): array
    {
        parse_str(parse_url($request->url(), PHP_URL_QUERY) ?: '', $query);

        return $query;
    }
}
