<?php

namespace App\DTO\ApiCatalog\List;

use Illuminate\Http\Request;

final readonly class ApiCatalogListQueryDTO
{
    /*
     * 一覧検索の入力条件だけを運ぶ DTO です。
     * Controller から Repository へ Request を直接渡さないための境界にしています。
     */
    public function __construct(
        public ?string $keyword,
        public ?string $providerKey,
        public int $page,
        public int $perPage,
    ) {
    }

    public static function fromRequest(Request $request): self
    {
        /*
         * 空文字は null に寄せ、Repository 側で「条件なし」として扱える形に揃えます。
         * 1ページ件数はモック一覧と同じ6件を標準にし、過大指定だけ軽く抑えます。
         */
        return new self(
            keyword: self::nullableTrimmedString($request->query('keyword')),
            providerKey: self::nullableTrimmedString($request->query('provider_key')),
            page: max(1, $request->integer('page', 1)),
            perPage: min(50, max(1, $request->integer('per_page', 6))),
        );
    }

    private static function nullableTrimmedString(mixed $value): ?string
    {
        // 配列など想定外の query 値は検索条件に使わず、一覧表示を壊さないようにします。
        if (! is_scalar($value)) {
            return null;
        }

        $trimmedValue = trim((string) $value);

        return $trimmedValue === '' ? null : $trimmedValue;
    }
}
