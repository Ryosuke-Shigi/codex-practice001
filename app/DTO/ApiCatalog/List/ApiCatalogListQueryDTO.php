<?php

namespace App\DTO\ApiCatalog\List;

use Illuminate\Http\Request;

final readonly class ApiCatalogListQueryDTO
{
    public const SORT_UPDATED_DESC = 'updated_desc';
    public const SORT_UPDATED_ASC = 'updated_asc';
    public const SORT_NAME_ASC = 'name_asc';
    public const SORT_NAME_DESC = 'name_desc';

    private const SORT_KEYS = [
        self::SORT_UPDATED_DESC,
        self::SORT_UPDATED_ASC,
        self::SORT_NAME_ASC,
        self::SORT_NAME_DESC,
    ];

    /*
     * 一覧検索の入力条件だけを運ぶ DTO です。
     * Controller から Repository へ Request を直接渡さないための境界にしています。
     */
    public function __construct(
        public ?string $keyword,
        public ?string $providerKey,
        public ?string $domain,
        public string $sortKey,
        public int $page,
        public int $perPage,
    ) {
    }

    public static function fromRequest(Request $request): self
    {
        /*
         * 空文字は null に寄せ、Repository 側で「条件なし」として扱える形に揃えます。
         * domain は専用カラムではなく provider_key の末尾抽出条件として Repository へ渡します。
         * 1ページ件数はモック一覧と同じ6件を標準にし、過大指定だけ軽く抑えます。
         */
        return new self(
            keyword: self::nullableTrimmedString($request->query('keyword')),
            providerKey: self::nullableTrimmedString($request->query('provider_key')),
            domain: self::nullableTrimmedString($request->query('domain')),
            sortKey: self::normalizeSortKey($request->query('sort')),
            page: max(1, $request->integer('page', 1)),
            perPage: min(50, max(1, $request->integer('per_page', 6))),
        );
    }

    private static function normalizeSortKey(mixed $value): string
    {
        /*
         * sort は画面表示順を決める入力ですが、任意のカラム名を受け付けると Repository の責務が崩れます。
         * DTO 境界で許可済みキーだけに丸め、未指定・不正値は本番/モック共通の初期値にします。
         */
        if (! is_scalar($value)) {
            return self::SORT_UPDATED_DESC;
        }

        $sortKey = trim((string) $value);

        return in_array($sortKey, self::SORT_KEYS, true) ? $sortKey : self::SORT_UPDATED_DESC;
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
