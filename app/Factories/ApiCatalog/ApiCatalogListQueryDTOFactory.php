<?php

namespace App\Factories\ApiCatalog;

use App\DTO\ApiCatalog\List\ApiCatalogListQueryDTO;
use Illuminate\Http\Request;

final readonly class ApiCatalogListQueryDTOFactory
{
    private const SORT_KEYS = [
        ApiCatalogListQueryDTO::SORT_UPDATED_DESC,
        ApiCatalogListQueryDTO::SORT_UPDATED_ASC,
        ApiCatalogListQueryDTO::SORT_NAME_ASC,
        ApiCatalogListQueryDTO::SORT_NAME_DESC,
    ];

    public function fromRequest(Request $request): ApiCatalogListQueryDTO
    {
        /*
         * 空文字は null に寄せ、Repository 側で「条件なし」として扱える形に揃えます。
         * domain は専用カラムではなく provider_key の末尾抽出条件として Repository へ渡します。
         * 1ページ件数はモック一覧と同じ6件を標準にし、過大指定だけ軽く抑えます。
         */
        return new ApiCatalogListQueryDTO(
            keyword: $this->nullableTrimmedString($request->query('keyword')),
            providerKey: $this->nullableTrimmedString($request->query('provider_key')),
            domain: $this->nullableTrimmedString($request->query('domain')),
            sortKey: $this->normalizeSortKey($request->query('sort')),
            page: max(1, $request->integer('page', 1)),
            perPage: min(50, max(1, $request->integer('per_page', 6))),
        );
    }

    private function normalizeSortKey(mixed $value): string
    {
        /*
         * sort は画面表示順を決める入力ですが、任意のカラム名を受け付けると Repository の責務が崩れます。
         * Factory 境界で許可済みキーだけに丸め、未指定・不正値は本番/モック共通の初期値にします。
         */
        if (! is_scalar($value)) {
            return ApiCatalogListQueryDTO::SORT_UPDATED_DESC;
        }

        $sortKey = trim((string) $value);

        return in_array($sortKey, self::SORT_KEYS, true)
            ? $sortKey
            : ApiCatalogListQueryDTO::SORT_UPDATED_DESC;
    }

    private function nullableTrimmedString(mixed $value): ?string
    {
        // 配列など想定外の query 値は検索条件に使わず、一覧表示を壊さないようにします。
        if (! is_scalar($value)) {
            return null;
        }

        $trimmedValue = trim((string) $value);

        return $trimmedValue === '' ? null : $trimmedValue;
    }
}
