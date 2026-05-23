<?php

namespace Tests\Unit\ApiCatalog\DTO;

use App\DTO\ApiCatalog\Sync\ApiCatalogItemDTO;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class ApiCatalogItemDTOTest extends TestCase
{
    public function test_it_holds_api_catalog_item_values(): void
    {
        $sourceLatestUpdatedAt = CarbonImmutable::parse('2026-05-23 10:00:00')->utc();

        /*
         * ApiCatalogItemDTO は、Service が作った同期対象1件分の値を
         * Repositoryへ渡すためのデータキャリアです。ここでは変換・保存・表示判断を
         * 持たせず、コンストラクタで受けた値をそのまま保持することだけを確認します。
         */
        $dto = new ApiCatalogItemDTO(
            apiKey: 'github.com:rest',
            providerKey: 'github.com',
            serviceKey: 'rest',
            title: 'GitHub REST API',
            description: 'GitHub REST API description.',
            preferredVersion: 'v3',
            openapiJsonUrl: 'https://example.test/github/openapi.json',
            openapiYamlUrl: 'https://example.test/github/openapi.yaml',
            openapiVersion: '3.0.0',
            sourceLatestUpdatedAt: $sourceLatestUpdatedAt,
            payloadHash: 'payload-hash',
        );

        $this->assertSame('github.com:rest', $dto->apiKey);
        $this->assertSame('github.com', $dto->providerKey);
        $this->assertSame('rest', $dto->serviceKey);
        $this->assertSame('GitHub REST API', $dto->title);
        $this->assertSame('GitHub REST API description.', $dto->description);
        $this->assertSame('v3', $dto->preferredVersion);
        $this->assertSame('https://example.test/github/openapi.json', $dto->openapiJsonUrl);
        $this->assertSame('https://example.test/github/openapi.yaml', $dto->openapiYamlUrl);
        $this->assertSame('3.0.0', $dto->openapiVersion);
        $this->assertSame($sourceLatestUpdatedAt, $dto->sourceLatestUpdatedAt);
        $this->assertSame('payload-hash', $dto->payloadHash);
    }
}
