<?php

namespace App\Repositories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailFetchResultDTO;

/*
 * videos.list の詳細DTOとchunk取得結果の集計値を返すRepository境界です。
 *
 * 既存の fetchVideoDetails() 配列返却は通常同期との互換性のため残し、
 * snapshot専用同期のように部分失敗数が必要な処理だけがこのResult DTOを使います。
 */
interface YouTubeVideoDetailFetchResultRepositoryInterface
{
    /**
     * videos.list で候補動画の詳細とchunk失敗の集計値を取得します。
     *
     * @param  array<int, string>  $youtubeVideoIds
     */
    public function fetchVideoDetailsResult(array $youtubeVideoIds): YouTubeVideoDetailFetchResultDTO;
}
