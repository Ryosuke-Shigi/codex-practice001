<?php

namespace App\Repositories\DanceShortsAnalyzer;

use App\DTO\DanceShortsAnalyzer\Search\DanceShortsAnalyzerSearchInputDTO;
use App\DTO\DanceShortsAnalyzer\Search\DanceShortsAnalyzerVideoListDTO;

interface DanceShortsAnalyzerVideoRepositoryInterface
{
    /**
     * 保存済み dance_short_videos だけを対象に keyword 検索します。
     *
     * 実装側は snapshot / region / search_keywords / YouTube API を参照せず、
     * Action へ VideoListDTO とページング状態だけを返します。
     */
    public function searchByKeyword(DanceShortsAnalyzerSearchInputDTO $input): DanceShortsAnalyzerVideoListDTO;
}
