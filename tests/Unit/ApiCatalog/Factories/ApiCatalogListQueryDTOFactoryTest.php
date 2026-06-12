<?php

namespace Tests\Unit\ApiCatalog\Factories;

use App\DTO\ApiCatalog\List\ApiCatalogListQueryDTO;
use App\Factories\ApiCatalog\ApiCatalogListQueryDTOFactory;
use Illuminate\Http\Request;
use PHPUnit\Framework\TestCase;

class ApiCatalogListQueryDTOFactoryTest extends TestCase
{
    public function test_from_request_normalizes_filter_strings(): void
    {
        $query = $this->factory()->fromRequest($this->request([
            'keyword' => '  Ledger API  ',
            'provider_key' => '',
            'domain' => "\t\n",
        ]));

        $this->assertSame('Ledger API', $query->keyword);
        $this->assertNull($query->providerKey);
        $this->assertNull($query->domain);
    }

    public function test_from_request_keeps_valid_sort_key(): void
    {
        $query = $this->factory()->fromRequest($this->request([
            'sort' => ApiCatalogListQueryDTO::SORT_NAME_ASC,
        ]));

        $this->assertSame(ApiCatalogListQueryDTO::SORT_NAME_ASC, $query->sortKey);
    }

    public function test_from_request_normalizes_invalid_sort_to_updated_desc(): void
    {
        $query = $this->factory()->fromRequest($this->request([
            'sort' => 'source_latest_updated_at desc',
        ]));

        $this->assertSame(ApiCatalogListQueryDTO::SORT_UPDATED_DESC, $query->sortKey);
    }

    public function test_from_request_clamps_page_to_one_when_it_is_less_than_one(): void
    {
        $query = $this->factory()->fromRequest($this->request([
            'page' => '0',
        ]));

        $this->assertSame(1, $query->page);
    }

    public function test_from_request_clamps_per_page_to_supported_range(): void
    {
        $tooSmall = $this->factory()->fromRequest($this->request([
            'per_page' => '0',
        ]));
        $tooLarge = $this->factory()->fromRequest($this->request([
            'per_page' => '999',
        ]));

        $this->assertSame(1, $tooSmall->perPage);
        $this->assertSame(50, $tooLarge->perPage);
    }

    public function test_from_request_uses_existing_default_values(): void
    {
        $query = $this->factory()->fromRequest($this->request([]));

        $this->assertNull($query->keyword);
        $this->assertNull($query->providerKey);
        $this->assertNull($query->domain);
        $this->assertSame(ApiCatalogListQueryDTO::SORT_UPDATED_DESC, $query->sortKey);
        $this->assertSame(1, $query->page);
        $this->assertSame(6, $query->perPage);
    }

    /**
     * @param  array<string, mixed>  $query
     */
    private function request(array $query): Request
    {
        return Request::create('/api-catalog', 'GET', $query);
    }

    private function factory(): ApiCatalogListQueryDTOFactory
    {
        return new ApiCatalogListQueryDTOFactory;
    }
}
