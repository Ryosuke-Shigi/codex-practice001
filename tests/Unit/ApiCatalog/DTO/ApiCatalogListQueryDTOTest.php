<?php

namespace Tests\Unit\ApiCatalog\DTO;

use App\DTO\ApiCatalog\List\ApiCatalogListQueryDTO;
use Illuminate\Http\Request;
use PHPUnit\Framework\TestCase;

class ApiCatalogListQueryDTOTest extends TestCase
{
    public function test_from_request_clamps_page_to_one_when_it_is_less_than_one(): void
    {
        /*
         * page は一覧取得のページ番号として Repository の paginate に渡ります。
         * 0 や負数をそのまま下流へ流すと、Repository 側に入力補正の責務が漏れるため、
         * Request から DTO を作る境界で 1 以上に丸める仕様を固定します。
         */
        $query = ApiCatalogListQueryDTO::fromRequest($this->request([
            'page' => '0',
        ]));

        $this->assertSame(1, $query->page);
    }

    public function test_from_request_clamps_per_page_to_supported_range(): void
    {
        /*
         * per_page はユーザー入力ですが、一覧の取得条件として直接DBページングに影響します。
         * 1未満は1へ、過大値は50へ丸め、Repository は正規化済みの件数だけを受け取る前提にします。
         */
        $tooSmall = ApiCatalogListQueryDTO::fromRequest($this->request([
            'per_page' => '0',
        ]));
        $tooLarge = ApiCatalogListQueryDTO::fromRequest($this->request([
            'per_page' => '999',
        ]));

        $this->assertSame(1, $tooSmall->perPage);
        $this->assertSame(50, $tooLarge->perPage);
    }

    public function test_from_request_normalizes_invalid_sort_to_updated_desc(): void
    {
        /*
         * sort に任意のカラム名やSQL断片を許すと、Repository が入力検証まで背負ってしまいます。
         * DTO 境界で許可済み sort key だけに閉じ、不正値は初期表示と同じ updated_desc に戻します。
         */
        $query = ApiCatalogListQueryDTO::fromRequest($this->request([
            'sort' => 'source_latest_updated_at desc',
        ]));

        $this->assertSame(ApiCatalogListQueryDTO::SORT_UPDATED_DESC, $query->sortKey);
    }

    public function test_from_request_normalizes_empty_filter_strings_to_null(): void
    {
        /*
         * keyword / provider_key / domain の空文字は「絞り込みなし」と同じ意味です。
         * 空文字のまま Repository へ渡すと、LIKE '%%' や provider_key='' のような
         * 意図しないDB条件になり得るため、DTOで null に寄せて取得条件を安定させます。
         */
        $query = ApiCatalogListQueryDTO::fromRequest($this->request([
            'keyword' => '   ',
            'provider_key' => '',
            'domain' => "\t\n",
        ]));

        $this->assertNull($query->keyword);
        $this->assertNull($query->providerKey);
        $this->assertNull($query->domain);
    }

    /**
     * Controller を通さず DTO の入力正規化だけを見るため、最小の Request をここで作ります。
     * HTTPレスポンスやInertia props はこのテストの対象外です。
     *
     * @param  array<string, mixed>  $query
     */
    private function request(array $query): Request
    {
        return Request::create('/api-catalog', 'GET', $query);
    }
}
