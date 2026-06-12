<?php

namespace App\Actions\DanceShortsAnalyzer\Queries;

use App\DTO\DanceShortsAnalyzer\Search\DanceShortsAnalyzerSearchInputDTO;
use App\DTO\DanceShortsAnalyzer\Search\DanceShortsAnalyzerSearchPageResultDTO;
use App\DTO\DanceShortsAnalyzer\Search\DanceShortsAnalyzerVideoListDTO;
use App\Repositories\DanceShortsAnalyzer\DanceShortsAnalyzerVideoRepositoryInterface;

/**
 * DanceShortsAnalyzer PRODUCT 画面の Search + Cards 用 Query Action です。
 *
 * PR1 では保存済み動画の検索だけを扱います。keyword 未入力時は DB 検索を行わず、
 * snapshot 取得、region 取得、metric 計算、YouTube API 呼び出しへは進みません。
 */
class GetDanceShortsAnalyzerSearchPageAction
{
    public function __construct(
        private readonly DanceShortsAnalyzerVideoRepositoryInterface $videoRepository,
    ) {}

    /**
     * PRODUCT 検索画面に必要な Search + Cards 用 DTO を返します。
     *
     * keyword が空のときは初期表示として扱い、Repository を呼びません。
     * この早期 return が「初期全件取得しない」「React 側で全件を受けて絞り込まない」
     * という PR1 の境界を守る役割を持ちます。
     */
    public function execute(DanceShortsAnalyzerSearchInputDTO $input): DanceShortsAnalyzerSearchPageResultDTO
    {
        if ($input->keyword === null || $input->keyword === '') {
            return new DanceShortsAnalyzerSearchPageResultDTO(
                keyword: null,
                sort: $input->sort,
                hasSearched: false,
                videoList: new DanceShortsAnalyzerVideoListDTO(
                    videos: [],
                    hasMore: false,
                    currentPage: 1,
                    perPage: DanceShortsAnalyzerSearchInputDTO::PER_PAGE,
                ),
            );
        }

        return new DanceShortsAnalyzerSearchPageResultDTO(
            keyword: $input->keyword,
            sort: $input->sort,
            hasSearched: true,
            videoList: $this->videoRepository->searchByKeyword($input),
        );
    }
}
