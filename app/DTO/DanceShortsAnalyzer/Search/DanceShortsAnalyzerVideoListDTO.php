<?php

namespace App\DTO\DanceShortsAnalyzer\Search;

/*
 * DanceShortsAnalyzer の動画検索結果一覧 DTO です。
 *
 * Repository が 20 件 + 1 件の lookahead で判定した hasMore と、
 * 実際に画面へ返す最大 20 件の DTO 配列を運びます。
 */
final readonly class DanceShortsAnalyzerVideoListDTO
{
    /**
     * @param  array<int, DanceShortsAnalyzerVideoDTO>  $videos
     * @param  bool  $hasMore  lookahead によって次ページが存在すると判定した状態です。
     * @param  int  $currentPage  1 始まりの現在ページです。
     * @param  int  $perPage  実際に返す最大件数です。
     */
    public function __construct(
        public array $videos,
        public bool $hasMore,
        public int $currentPage,
        public int $perPage,
    ) {
    }
}
