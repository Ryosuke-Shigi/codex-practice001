<?php

namespace App\Repositories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortSearchConditionDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchItemDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchResultDTO;

/*
 * YouTube Data API v3 への外部通信境界です。
 *
 * 呼び出し側には DTO の配列だけを返し、HTTP client やレスポンス配列の構造を漏らしません。
 * DB保存、snapshot保存、Shorts判定、増加量計算はこの Interface の責務に含めません。
 */
interface YouTubeVideoApiRepositoryInterface
{
    /**
     * search.list で候補動画IDを取得します。
     *
     * @return array<int, YouTubeVideoSearchItemDTO>
     */
    public function searchVideos(DanceShortSearchConditionDTO $condition): array;

    /**
     * search.list で候補動画IDと次ページ token を取得します。
     */
    public function searchVideoPage(
        DanceShortSearchConditionDTO $condition,
        ?string $pageToken = null,
    ): YouTubeVideoSearchResultDTO;

    /**
     * videos.list で候補動画の詳細を取得します。
     *
     * @param  array<int, string>  $youtubeVideoIds
     * @return array<int, YouTubeVideoDetailDTO>
     */
    public function fetchVideoDetails(array $youtubeVideoIds): array;
}
