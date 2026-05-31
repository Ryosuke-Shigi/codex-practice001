<?php

namespace Tests\Unit\ApiCatalog\DTO;

use App\DTO\ApiCatalog\List\ApiCatalogListQueryDTO;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

class ApiCatalogListQueryDTOTest extends TestCase
{
    public function test_constructor_preserves_received_values(): void
    {
        $query = new ApiCatalogListQueryDTO(
            keyword: ' keyword ',
            providerKey: '',
            domain: "\t",
            sortKey: 'source_latest_updated_at desc',
            page: 0,
            perPage: 999,
        );

        $this->assertSame(' keyword ', $query->keyword);
        $this->assertSame('', $query->providerKey);
        $this->assertSame("\t", $query->domain);
        $this->assertSame('source_latest_updated_at desc', $query->sortKey);
        $this->assertSame(0, $query->page);
        $this->assertSame(999, $query->perPage);
    }

    public function test_dto_does_not_depend_on_http_request(): void
    {
        $this->assertFalse(method_exists(ApiCatalogListQueryDTO::class, 'fromRequest'));
        $this->assertStringNotContainsString(
            'Illuminate\\Http\\Request',
            $this->source(),
        );
    }

    public function test_dto_does_not_normalize_sort_key(): void
    {
        $query = new ApiCatalogListQueryDTO(
            keyword: null,
            providerKey: null,
            domain: null,
            sortKey: 'invalid_sort',
            page: 1,
            perPage: 6,
        );

        $this->assertSame('invalid_sort', $query->sortKey);
    }

    public function test_dto_does_not_clamp_page_or_per_page(): void
    {
        $query = new ApiCatalogListQueryDTO(
            keyword: null,
            providerKey: null,
            domain: null,
            sortKey: ApiCatalogListQueryDTO::SORT_UPDATED_DESC,
            page: -10,
            perPage: 999,
        );

        $this->assertSame(-10, $query->page);
        $this->assertSame(999, $query->perPage);
    }

    private function source(): string
    {
        $fileName = (new ReflectionClass(ApiCatalogListQueryDTO::class))->getFileName();

        $this->assertIsString($fileName);

        return (string) file_get_contents($fileName);
    }
}
