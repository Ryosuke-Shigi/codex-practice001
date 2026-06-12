<?php

namespace App\Repositories\DanceShortsAnalyzer;

use App\DTO\DanceShortsAnalyzer\Search\DanceShortsAnalyzerSearchInputDTO;
use App\DTO\DanceShortsAnalyzer\Search\DanceShortsAnalyzerVideoDTO;
use App\DTO\DanceShortsAnalyzer\Search\DanceShortsAnalyzerVideoListDTO;
use App\Models\DanceShortVideo;
use Illuminate\Database\Eloquent\Builder;

/**
 * DanceShortsAnalyzer検索画面の保存済み動画検索を担当する Repository です。
 *
 * dance_short_videos の検索・並び替え・lookahead取得だけを扱います。
 * snapshot分析、region比較、YouTube API取得は別のAction / Repositoryへ分けます。
 */
class DanceShortsAnalyzerVideoRepository implements DanceShortsAnalyzerVideoRepositoryInterface
{
    /**
     * keyword に一致する保存済み動画を 20 件単位で取得します。
     *
     * hasMore は count(*) ではなく 20 件 + 1 件の lookahead で判定します。
     * これにより「さらに取得」を表示するために必要な状態だけを返しつつ、
     * 初回検索や追加取得で全件取得しない仕様を守ります。
     */
    public function searchByKeyword(DanceShortsAnalyzerSearchInputDTO $input): DanceShortsAnalyzerVideoListDTO
    {
        /*
         * Repository は dance_short_videos だけを検索します。
         * snapshot / region / search_keywords は PR1 の Search + Cards では参照しません。
         */
        $keyword = (string) $input->keyword;
        $perPage = min(DanceShortsAnalyzerSearchInputDTO::PER_PAGE, max(1, $input->perPage));
        $page = max(1, $input->page);
        $lookaheadLimit = $perPage + 1;
        $offset = ($page - 1) * $perPage;

        $query = DanceShortVideo::query()
            ->select([
                'id',
                'youtube_video_id',
                'title',
                'channel_title',
                'thumbnail_url',
                'published_at',
                'tracking_status',
                'tags',
            ])
            ->where(function (Builder $query) use ($keyword): void {
                $this->applyKeywordConditions($query, $keyword);
            });

        $this->applySort($query, $input->sort);

        $videos = $query
            ->offset($offset)
            ->limit($lookaheadLimit)
            ->get();

        $hasMore = $videos->count() > $perPage;
        $visibleVideos = $videos
            ->take($perPage)
            ->map(fn (DanceShortVideo $video): DanceShortsAnalyzerVideoDTO => new DanceShortsAnalyzerVideoDTO(
                videoId: (int) $video->getKey(),
                youtubeVideoId: (string) $video->youtube_video_id,
                title: (string) $video->title,
                channelTitle: $video->channel_title,
                thumbnailUrl: $video->thumbnail_url,
                publishedAt: $video->published_at,
                trackingStatus: (string) $video->tracking_status,
            ))
            ->values()
            ->all();

        return new DanceShortsAnalyzerVideoListDTO(
            videos: $visibleVideos,
            hasMore: $hasMore,
            currentPage: $page,
            perPage: $perPage,
        );
    }

    private function applyKeywordConditions(Builder $query, string $keyword): void
    {
        $likeKeyword = '%'.$keyword.'%';

        /*
         * dance_short_search_keywords は PR1 では参照しません。
         * 保存済み動画との紐づきが未確定なので、検索対象は dance_short_videos の
         * youtube_video_id / title / description / channel_title / tags に限定します。
         */
        $query
            ->where('youtube_video_id', 'like', $likeKeyword)
            ->orWhere('title', 'like', $likeKeyword)
            ->orWhere('description', 'like', $likeKeyword)
            ->orWhere('channel_title', 'like', $likeKeyword)
            ->orWhere('tags', 'like', $likeKeyword);
    }

    private function applySort(Builder $query, string $sort): void
    {
        /*
         * PRODUCT の並び替えは Inertia の GET query で Laravel へ戻し、
         * DB 上の orderBy でカードを出し直します。React 側で取得済み配列を
         * 並べ替えると、未取得ページとの順序が崩れるためここで確定します。
         */
        if ($sort === DanceShortsAnalyzerSearchInputDTO::SORT_PUBLISHED_ASC) {
            $query
                ->orderBy('published_at')
                ->orderBy('id');

            return;
        }

        $query
            ->orderByDesc('published_at')
            ->orderByDesc('id');
    }
}
