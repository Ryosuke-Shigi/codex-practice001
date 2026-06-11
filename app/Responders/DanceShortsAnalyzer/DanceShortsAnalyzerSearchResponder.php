<?php

namespace App\Responders\DanceShortsAnalyzer;

use App\DTO\DanceShortsAnalyzer\Search\DanceShortsAnalyzerSearchPageResultDTO;
use App\DTO\DanceShortsAnalyzer\Search\DanceShortsAnalyzerVideoDTO;
use Inertia\Inertia;
use Inertia\Response;

/**
 * DanceShortsAnalyzer PRODUCT 画面の Responder です。
 *
 * Query Action の結果を SearchField / CardsField 用 props へ変換します。
 * YouTube Shorts URL は DB 保存値ではなく youtube_video_id からここで生成し、
 * React 側では受け取った youtube_url を表示するだけにします。
 */
final readonly class DanceShortsAnalyzerSearchResponder
{
    public function index(DanceShortsAnalyzerSearchPageResultDTO $result): Response
    {
        return Inertia::render('DanceShortsAnalyzer/Index', [
            'searchField' => $this->searchFieldProps($result),
            'cardsField' => $this->cardsFieldProps($result),
        ]);
    }

    /**
     * @return array{
     *     keyword: string,
     *     action: string,
     *     analyze_action: string,
     *     placeholder: string,
     *     button_label: string
     * }
     */
    private function searchFieldProps(DanceShortsAnalyzerSearchPageResultDTO $result): array
    {
        return [
            'keyword' => $result->keyword ?? '',
            'action' => route('dance-shorts-analyzer.index', [], false),
            'analyze_action' => route('dance-shorts-analyzer.analyze', [], false),
            'placeholder' => 'キーワード入力',
            'button_label' => 'Search',
        ];
    }

    /**
     * @return array{
     *     videos: array<int, array<string, mixed>>,
     *     empty_message: string|null,
     *     end_message: string|null,
     *     has_searched: bool,
     *     has_more: bool,
     *     next_page: int|null,
     *     current_page: int,
     *     per_page: int,
     *     sort: string,
     *     sort_options: array<int, array{value: string, label: string}>
     * }
     */
    private function cardsFieldProps(DanceShortsAnalyzerSearchPageResultDTO $result): array
    {
        $videos = array_map(
            fn (DanceShortsAnalyzerVideoDTO $video): array => $this->videoProps($video),
            $result->videoList->videos,
        );

        return [
            'videos' => $videos,
            'empty_message' => $this->emptyMessage($result, $videos),
            'end_message' => $result->hasSearched && $videos !== [] && ! $result->videoList->hasMore
                ? 'これ以上の検索結果はありません。'
                : null,
            'has_searched' => $result->hasSearched,
            'has_more' => $result->videoList->hasMore,
            'next_page' => $result->videoList->hasMore
                ? $result->videoList->currentPage + 1
                : null,
            'current_page' => $result->videoList->currentPage,
            'per_page' => $result->videoList->perPage,
            'sort' => $result->sort,
            /*
             * CardsField の表示責務として扱う sort options です。
             * SearchResultField のような別 Field は作らず、検索結果カードと同じ
             * CardsField 内で Inertia 再取得を起こせる形にそろえます。
             */
            'sort_options' => [
                [
                    'value' => 'published_desc',
                    'label' => '登録日 ↓',
                ],
                [
                    'value' => 'published_asc',
                    'label' => '登録日 ↑',
                ],
            ],
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $videos
     */
    private function emptyMessage(DanceShortsAnalyzerSearchPageResultDTO $result, array $videos): ?string
    {
        /*
         * 初期表示と検索済み0件を分けて返します。
         * React 側では文言生成を行わず、Responder が画面文言の境界になります。
         */
        if (! $result->hasSearched) {
            return 'キーワードを入力してください。';
        }

        return $videos === [] ? '該当する保存済み動画はありません。' : null;
    }

    /**
     * @return array{
     *     video_id: int,
     *     youtube_video_id: string,
     *     title: string,
     *     channel_title: string|null,
     *     thumbnail_url: string|null,
     *     published_at: string|null,
     *     youtube_url: string,
     *     tracking_status: string
     * }
     */
    private function videoProps(DanceShortsAnalyzerVideoDTO $video): array
    {
        return [
            'video_id' => $video->videoId,
            'youtube_video_id' => $video->youtubeVideoId,
            'title' => $video->title,
            'channel_title' => $video->channelTitle,
            'thumbnail_url' => $video->thumbnailUrl,
            'published_at' => $video->publishedAt?->format('Y-m-d H:i'),
            /*
             * 既存 url カラムは使わず、保存済み youtube_video_id から Shorts URL を生成します。
             * React 側で URL 組み立てを行わないため、UI はリンク表示の有無だけを判断できます。
             */
            'youtube_url' => 'https://www.youtube.com/shorts/'.$video->youtubeVideoId,
            'tracking_status' => $video->trackingStatus,
        ];
    }
}
