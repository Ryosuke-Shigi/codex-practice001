<?php

namespace Tests\Unit\ApiCatalog\Services;

use App\DTO\ApiCatalog\Sync\ApiCatalogItemDTO;
use App\Models\ApiCatalogCache;
use App\Repositories\ApiCatalog\ApiCatalogCacheRepositoryInterface;
use App\Repositories\ApiCatalog\ApisGuruRepositoryInterface;
use App\Services\ApiCatalog\ApiCatalogSyncService;
use Carbon\CarbonInterface;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class ApiCatalogSyncServiceTest extends TestCase
{
    /*
     * ApiCatalogSyncService は、外部API取得、DB永続化そのものではなく、
     * 取得済みpayloadをDTOへ変換し、既存キャッシュとの差分から insert / update / skip を
     * 判定するレイヤーです。ここでは Repository をモックし、Service がDBへ直接触れずに
     * Repository interface へ正しいDTOと同期時刻を渡すことを固定します。
     */
    public function test_sync_inserts_new_api_payloads(): void
    {
        $payload = $this->apiPayload(
            title: 'New API',
            description: 'New API description.',
        );

        $apisGuruRepository = $this->createMock(ApisGuruRepositoryInterface::class);
        $cacheRepository = $this->createMock(ApiCatalogCacheRepositoryInterface::class);

        $apisGuruRepository
            ->expects($this->once())
            ->method('fetchList')
            ->willReturn([
                'new.example.com:rest' => $payload,
            ]);

        $cacheRepository
            ->expects($this->once())
            ->method('findByApiKey')
            ->with('new.example.com:rest')
            ->willReturn(null);

        /*
         * 新規APIは既存キャッシュが見つからない場合だけ insert されます。
         * callback 内では、Service がpayloadをDTOへ正しく写し替えてから
         * Repositoryへ渡していることを確認し、保存形式そのものの検証は
         * Repositoryテスト側の責務として残します。
         */
        $cacheRepository
            ->expects($this->once())
            ->method('insert')
            ->with(
                $this->callback(function (ApiCatalogItemDTO $item) use ($payload): bool {
                    $this->assertSame('new.example.com:rest', $item->apiKey);
                    $this->assertSame('new.example.com', $item->providerKey);
                    $this->assertSame('rest', $item->serviceKey);
                    $this->assertSame('New API', $item->title);
                    $this->assertSame('New API description.', $item->description);
                    $this->assertSame('v1', $item->preferredVersion);
                    $this->assertSame('https://example.test/openapi.json', $item->openapiJsonUrl);
                    $this->assertSame('https://example.test/openapi.yaml', $item->openapiYamlUrl);
                    $this->assertSame('3.0.0', $item->openapiVersion);
                    $this->assertNull($item->sourceLatestUpdatedAt);
                    $this->assertSame($this->payloadHash($payload), $item->payloadHash);

                    return true;
                }),
                $this->isInstanceOf(CarbonInterface::class),
            )
            ->willReturn(new ApiCatalogCache());

        $cacheRepository
            ->expects($this->never())
            ->method('update');

        $cacheRepository
            ->expects($this->once())
            ->method('markMissingAsInactive')
            ->with(['new.example.com:rest'], $this->isInstanceOf(CarbonInterface::class))
            ->willReturn(2);

        /*
         * 同期結果DTOは、Serviceが判定した件数の受け渡し境界です。
         * inactiveCount は Repository が返すDB更新件数をそのまま集計に含めます。
         */
        $result = $this->service($apisGuruRepository, $cacheRepository)->sync();

        $this->assertSame(1, $result->totalCount);
        $this->assertSame(1, $result->insertedCount);
        $this->assertSame(0, $result->updatedCount);
        $this->assertSame(0, $result->skippedCount);
        $this->assertSame(2, $result->inactiveCount);
        $this->assertSame(0, $result->failedCount);
    }

    public function test_sync_skips_existing_api_when_payload_hash_is_unchanged(): void
    {
        $payload = $this->apiPayload(title: 'Existing API');

        /*
         * payload_hash が同じ、source_latest_updated_at も null 同士、かつ有効状態なら
         * Service は保存処理を呼ばず skippedCount だけを進めます。
         */
        $existing = $this->cache([
            'payload_hash' => $this->payloadHash($payload),
            'is_active' => true,
        ]);

        $apisGuruRepository = $this->createMock(ApisGuruRepositoryInterface::class);
        $cacheRepository = $this->createMock(ApiCatalogCacheRepositoryInterface::class);

        $apisGuruRepository
            ->expects($this->once())
            ->method('fetchList')
            ->willReturn([
                'existing.example.com:rest' => $payload,
            ]);

        $cacheRepository
            ->expects($this->once())
            ->method('findByApiKey')
            ->with('existing.example.com:rest')
            ->willReturn($existing);

        $cacheRepository
            ->expects($this->never())
            ->method('insert');

        $cacheRepository
            ->expects($this->never())
            ->method('update');

        $cacheRepository
            ->expects($this->once())
            ->method('markMissingAsInactive')
            ->with(['existing.example.com:rest'], $this->isInstanceOf(CarbonInterface::class))
            ->willReturn(0);

        // Repositoryへ業務判断を寄せないため、update / insert 未呼び出しを明示的に守ります。
        $result = $this->service($apisGuruRepository, $cacheRepository)->sync();

        $this->assertSame(1, $result->totalCount);
        $this->assertSame(0, $result->insertedCount);
        $this->assertSame(0, $result->updatedCount);
        $this->assertSame(1, $result->skippedCount);
        $this->assertSame(0, $result->inactiveCount);
        $this->assertSame(0, $result->failedCount);
    }

    public function test_sync_payload_hash_is_stable_when_payload_key_order_changes(): void
    {
        $payload = $this->apiPayload(title: 'Existing API');
        $samePayloadWithDifferentKeyOrder = [
            'versions' => $payload['versions'],
            'preferred' => $payload['preferred'],
        ];
        $existing = $this->cache([
            'payload_hash' => $this->payloadHash($payload),
            'is_active' => true,
        ]);

        $apisGuruRepository = $this->createMock(ApisGuruRepositoryInterface::class);
        $cacheRepository = $this->createMock(ApiCatalogCacheRepositoryInterface::class);

        $apisGuruRepository
            ->expects($this->once())
            ->method('fetchList')
            ->willReturn([
                'existing.example.com:rest' => $samePayloadWithDifferentKeyOrder,
            ]);

        $cacheRepository
            ->expects($this->once())
            ->method('findByApiKey')
            ->with('existing.example.com:rest')
            ->willReturn($existing);

        $cacheRepository
            ->expects($this->never())
            ->method('insert');

        $cacheRepository
            ->expects($this->never())
            ->method('update');

        $cacheRepository
            ->expects($this->once())
            ->method('markMissingAsInactive')
            ->with(['existing.example.com:rest'], $this->isInstanceOf(CarbonInterface::class))
            ->willReturn(0);

        /*
         * APIs.guruのJSONキー順が変わっても、同じ意味のpayloadは同じpayload_hashとして扱います。
         * 差分判定をRepositoryへ漏らさず、Serviceのcanonicalize済みhashでskipになることを固定します。
         */
        $result = $this->service($apisGuruRepository, $cacheRepository)->sync();

        $this->assertSame(1, $result->totalCount);
        $this->assertSame(0, $result->insertedCount);
        $this->assertSame(0, $result->updatedCount);
        $this->assertSame(1, $result->skippedCount);
        $this->assertSame(0, $result->failedCount);
    }

    public function test_sync_updates_existing_api_when_payload_hash_changes(): void
    {
        $payload = $this->apiPayload(title: 'Changed API');

        /*
         * 既存キャッシュがあっても payload_hash が変わっている場合は更新対象です。
         * 「どのカラムを保存するか」はRepositoryの責務なので、このテストでは
         * 更新判定とDTO受け渡しだけを確認します。
         */
        $existing = $this->cache([
            'payload_hash' => 'old-payload-hash',
            'is_active' => true,
        ]);

        $apisGuruRepository = $this->createMock(ApisGuruRepositoryInterface::class);
        $cacheRepository = $this->createMock(ApiCatalogCacheRepositoryInterface::class);

        $apisGuruRepository
            ->expects($this->once())
            ->method('fetchList')
            ->willReturn([
                'changed.example.com:rest' => $payload,
            ]);

        $cacheRepository
            ->expects($this->once())
            ->method('findByApiKey')
            ->with('changed.example.com:rest')
            ->willReturn($existing);

        $cacheRepository
            ->expects($this->never())
            ->method('insert');

        $cacheRepository
            ->expects($this->once())
            ->method('update')
            ->with(
                $this->identicalTo($existing),
                $this->callback(function (ApiCatalogItemDTO $item) use ($payload): bool {
                    $this->assertSame('changed.example.com:rest', $item->apiKey);
                    $this->assertSame('changed.example.com', $item->providerKey);
                    $this->assertSame('rest', $item->serviceKey);
                    $this->assertSame('Changed API', $item->title);
                    $this->assertSame($this->payloadHash($payload), $item->payloadHash);

                    return true;
                }),
                $this->isInstanceOf(CarbonInterface::class),
            )
            ->willReturn($existing);

        $cacheRepository
            ->expects($this->once())
            ->method('markMissingAsInactive')
            ->with(['changed.example.com:rest'], $this->isInstanceOf(CarbonInterface::class))
            ->willReturn(0);

        $result = $this->service($apisGuruRepository, $cacheRepository)->sync();

        $this->assertSame(1, $result->totalCount);
        $this->assertSame(0, $result->insertedCount);
        $this->assertSame(1, $result->updatedCount);
        $this->assertSame(0, $result->skippedCount);
        $this->assertSame(0, $result->inactiveCount);
        $this->assertSame(0, $result->failedCount);
    }

    public function test_sync_counts_failed_items_when_repository_operation_fails(): void
    {
        $payload = $this->apiPayload(title: 'Failing API');

        $apisGuruRepository = $this->createMock(ApisGuruRepositoryInterface::class);
        $cacheRepository = $this->createMock(ApiCatalogCacheRepositoryInterface::class);

        $apisGuruRepository
            ->expects($this->once())
            ->method('fetchList')
            ->willReturn([
                'failing.example.com:rest' => $payload,
            ]);

        $cacheRepository
            ->expects($this->once())
            ->method('findByApiKey')
            ->with('failing.example.com:rest')
            ->willReturn(null);

        $cacheRepository
            ->expects($this->once())
            ->method('insert')
            ->with($this->isInstanceOf(ApiCatalogItemDTO::class), $this->isInstanceOf(CarbonInterface::class))
            ->willThrowException(new RuntimeException('Insert failed.'));

        /*
         * 1件の保存失敗で同期全体を止めず、failedCount に集計する仕様を固定します。
         * 失敗の記録先や再実行制御は Action / Job / status Repository 側の責務なので、
         * Serviceテストでは結果DTOの件数だけを確認します。
         */
        $cacheRepository
            ->expects($this->never())
            ->method('update');

        $cacheRepository
            ->expects($this->once())
            ->method('markMissingAsInactive')
            ->with(['failing.example.com:rest'], $this->isInstanceOf(CarbonInterface::class))
            ->willReturn(0);

        $result = $this->service($apisGuruRepository, $cacheRepository)->sync();

        $this->assertSame(1, $result->totalCount);
        $this->assertSame(0, $result->insertedCount);
        $this->assertSame(0, $result->updatedCount);
        $this->assertSame(0, $result->skippedCount);
        $this->assertSame(0, $result->inactiveCount);
        $this->assertSame(1, $result->failedCount);
    }

    /**
     * APIs.guru list.json の1件分に近い最小payloadを組み立てます。
     * Service側のDTO生成を通したいので、テストでは直接 ApiCatalogItemDTO を作らず、
     * 実際の入力境界である配列payloadを渡します。
     *
     * @return array<string, mixed>
     */
    private function apiPayload(string $title, string $description = 'API description.'): array
    {
        return [
            'preferred' => 'v1',
            'versions' => [
                'v1' => [
                    'info' => [
                        'title' => $title,
                        'description' => $description,
                    ],
                    'swaggerUrl' => 'https://example.test/openapi.json',
                    'swaggerYamlUrl' => 'https://example.test/openapi.yaml',
                    'openapiVer' => '3.0.0',
                ],
            ],
        ];
    }

    /**
     * Serviceの差分判定に必要な既存キャッシュだけをModelで表します。
     * DB保存やEloquentクエリはRepositoryの責務なので、Unitテストでは未保存Modelで十分です。
     *
     * @param  array<string, mixed>  $attributes
     */
    private function cache(array $attributes): ApiCatalogCache
    {
        return new ApiCatalogCache(array_merge([
            'api_key' => 'existing.example.com:rest',
            'provider_key' => 'existing.example.com',
            'service_key' => 'rest',
            'source_latest_updated_at' => null,
            'is_active' => true,
        ], $attributes));
    }

    private function service(
        ApisGuruRepositoryInterface $apisGuruRepository,
        ApiCatalogCacheRepositoryInterface $cacheRepository,
    ): ApiCatalogSyncService {
        return new ApiCatalogSyncService($apisGuruRepository, $cacheRepository);
    }

    /**
     * Service本体と同じ正規化ルールでpayload_hashを作ります。
     * この値を既存キャッシュに持たせることで、Serviceのskip / update判定を
     * 外部API通信やDBに依存せず再現できます。
     *
     * @param  array<string, mixed>  $payload
     */
    private function payloadHash(array $payload): string
    {
        return hash(
            'sha256',
            json_encode(
                $this->canonicalize($payload),
                JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION,
            ),
        );
    }

    private function canonicalize(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        // JSONキー順の違いで同一payloadが別hashにならないよう、連想配列だけキー順を固定します。
        if (! array_is_list($value)) {
            ksort($value);
        }

        foreach ($value as $key => $item) {
            $value[$key] = $this->canonicalize($item);
        }

        return $value;
    }
}
