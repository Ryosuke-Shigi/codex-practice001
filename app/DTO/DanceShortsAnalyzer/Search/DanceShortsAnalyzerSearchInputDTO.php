<?php

namespace App\DTO\DanceShortsAnalyzer\Search;

/*
 * DanceShortsAnalyzer の検索入力 DTO です。
 *
 * FormRequest で形式検証した keyword / page を Query Action へ渡します。
 * perPage は PRODUCT の検索仕様としてサーバー側で 20 件に固定し、
 * フロントエンドから任意の件数を受け取らない境界にします。
 */
final readonly class DanceShortsAnalyzerSearchInputDTO
{
    /**
     * PR1 のカード取得単位です。
     *
     * フロントエンドから per_page を自由入力させず、Repository でもこの値を上限として扱います。
     */
    public const PER_PAGE = 20;

    /**
     * 保存済み動画の登録日で並び替えるための許可済み sort key です。
     *
     * snapshot 由来の伸び率や増加量は PR2 以降の対象なので、ここには含めません。
     */
    public const SORT_PUBLISHED_DESC = 'published_desc';
    public const SORT_PUBLISHED_ASC = 'published_asc';

    /**
     * @param  string|null  $keyword  null の場合は初期表示扱いで DB 検索しません。
     * @param  int  $page  1 始まりの検索ページです。
     * @param  int  $perPage  サーバー側で固定するカード取得件数です。
     * @param  string  $sort  Request で許可済みにした sort key です。
     */
    public function __construct(
        public ?string $keyword,
        public int $page = 1,
        public int $perPage = self::PER_PAGE,
        public string $sort = self::SORT_PUBLISHED_DESC,
    ) {
    }
}
