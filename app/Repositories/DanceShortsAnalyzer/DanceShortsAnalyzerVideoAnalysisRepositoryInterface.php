<?php

namespace App\Repositories\DanceShortsAnalyzer;

use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerSelectedVideoDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerSnapshotPointDTO;

/**
 * Analyze 画面が必要とする保存済み動画と snapshot の取得境界です。
 */
interface DanceShortsAnalyzerVideoAnalysisRepositoryInterface
{
    /**
     * @param  array<int, int>  $videoIds
     * @return array<int, DanceShortsAnalyzerSelectedVideoDTO>
     */
    public function findVideosByIds(array $videoIds): array;

    /**
     * @param  array<int, int>  $videoIds
     * @return array<int, DanceShortsAnalyzerSnapshotPointDTO>
     */
    public function findSnapshotsByVideoIds(array $videoIds): array;
}
