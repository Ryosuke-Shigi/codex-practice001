<?php

namespace App\DTO\DanceShortsAnalyzer\Search;

/*
 * DanceShortsAnalyzer の検索画面全体の結果 DTO です。
 *
 * keyword 未入力時は hasSearched=false と空の VideoListDTO を返し、
 * Action が DB 検索を行わなかったことを Responder / React へ明示します。
 */
final readonly class DanceShortsAnalyzerSearchPageResultDTO
{
    /**
     * @param  string|null  $keyword  画面に戻す検索語です。初期表示では null にします。
     * @param  string  $sort  CardsField の現在の並び替え状態です。
     * @param  bool  $hasSearched  DB 検索を実行した画面状態かどうかを表します。
     * @param  DanceShortsAnalyzerVideoListDTO  $videoList  画面へ渡す動画一覧とページング状態です。
     */
    public function __construct(
        public ?string $keyword,
        public string $sort,
        public bool $hasSearched,
        public DanceShortsAnalyzerVideoListDTO $videoList,
    ) {}
}
