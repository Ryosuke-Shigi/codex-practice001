<?php

namespace App\Responders\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingItemDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingRegionDTO;
use Inertia\Inertia;
use Inertia\Response;

/*
 * DanceShortsRadar 通常ランキング画面の Responder です。
 *
 * Responder は Query Action の DTO を Inertia / React が描きやすい props へ変換します。
 * ここでは href、表示ラベル、空状態メッセージ、region tab の active 状態など、出力形式に近い
 * 整形だけを扱います。DB query、YouTube API 呼び出し、snapshot metric の再計算は行いません。
 *
 * React 側が query 文字列を組み立てたり metric を再計算したりしないよう、選択肢ごとの href と
 * ranking item の表示値はここで明示的に渡します。
 */
final readonly class DanceShortVideoRankingResponder
{
    private const SORT_KEY_LABELS = [
        'views_per_hour' => '1時間あたり',
        'view_count_delta' => '視聴増加数',
        'view_growth_rate' => '伸び率',
        'current_view_count' => '現在視聴数',
    ];

    public function index(DanceShortVideoRankingPageDTO $page): Response
    {
        return Inertia::render('DanceShortsRadar/Index', [
            'filters' => [
                'region' => $page->selectedRegionCode,
                'comparisonDays' => $page->comparisonDays,
                'limit' => $page->limit,
                'sortKey' => $page->sortKey,
            ],
            'regionTabs' => array_map(
                fn (DanceShortVideoRankingRegionDTO $region): array => $this->regionTabProps($region, $page),
                $page->regions,
            ),
            'regions' => array_map(
                fn (DanceShortVideoRankingRegionDTO $region): array => $this->regionProps($region),
                $page->regions,
            ),
            /*
             * MOCK 画面で固めた通常ランキング相当の props shape です。
             * 本番側では Query Action が返した DTO だけを材料にして同じ shape へ整えます。
             * ここに固定 MOCK データ生成や candidate の sort 計算を置かないことで、
             * 「表示用 props 変換」と「ランキング取得・計算」の境界を分けたままにします。
             */
            'candidatesByRegion' => $this->candidatesByRegionProps($page),
            'allCandidates' => $this->allCandidateProps($page),
            'comparisonDayOptions' => array_map(
                fn (int $comparisonDays): array => $this->comparisonDayOptionProps($comparisonDays, $page),
                $page->comparisonDayOptions,
            ),
            'sortKeyOptions' => array_map(
                fn (string $sortKey): array => $this->sortKeyOptionProps($sortKey, $page),
                $page->sortKeyOptions,
            ),
            'ranking' => [
                'items' => array_map(
                    fn (DanceShortVideoRankingItemDTO $item): array => $this->rankingItemProps($item),
                    $page->rankingList->items,
                ),
                'total' => count($page->rankingList->items),
            ],
            'emptyMessage' => $page->selectedRegionCode === null
                ? '有効な地域がまだ登録されていません。'
                : '比較元 snapshot がある通常ランキング候補はまだありません。',
        ]);
    }

    private function regionProps(DanceShortVideoRankingRegionDTO $region): array
    {
        return [
            'code' => $region->code,
            'label' => $region->name,
            'description' => $region->name.'の保存済み snapshot ランキング',
        ];
    }

    private function regionTabProps(
        DanceShortVideoRankingRegionDTO $region,
        DanceShortVideoRankingPageDTO $page,
    ): array {
        return [
            'code' => $region->code,
            'label' => $region->name,
            'description' => $region->name.'の保存済み snapshot ランキング',
            'href' => $this->indexHref($region->code, $page->comparisonDays, $page->sortKey, $page->limit),
            'isActive' => $region->code === $page->selectedRegionCode,
        ];
    }

    /**
     * @return array<string, array<int, array<string, mixed>>>
     */
    private function candidatesByRegionProps(DanceShortVideoRankingPageDTO $page): array
    {
        $candidatesByRegion = [];

        foreach ($page->regions as $region) {
            /*
             * candidatesByRegion のキーは DB の active region code だけに限定します。
             * MOCK 側の ALL や RISING は UI タブ専用の概念なので、本番の地域別候補には混ぜません。
             * これにより React 側は MOCK と近い shape を受け取りつつ、保存対象地域と表示専用タブ値を
             * 取り違えずに済みます。
             */
            $rankingList = $page->rankingListsByRegion[$region->code] ?? null;
            $candidatesByRegion[$region->code] = $rankingList === null
                ? []
                : array_map(
                    fn (DanceShortVideoRankingItemDTO $item): array => $this->candidateProps($item),
                    $rankingList->items,
                );
        }

        return $candidatesByRegion;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function allCandidateProps(DanceShortVideoRankingPageDTO $page): array
    {
        $candidates = [];

        foreach ($page->regions as $region) {
            /*
             * allCandidates は MOCK 画面と同じく「まとめ表示」用の配列です。
             * candidatesByRegion['ALL'] を作らないのは、ALL を region code として見せないためです。
             * 並び順は各 region のランキング DTO が持つ順序をそのまま保ち、ここで再ソートや再計算はしません。
             */
            $rankingList = $page->rankingListsByRegion[$region->code] ?? null;

            if ($rankingList === null) {
                continue;
            }

            foreach ($rankingList->items as $item) {
                $candidates[] = $this->candidateProps($item);
            }
        }

        return $candidates;
    }

    private function comparisonDayOptionProps(int $comparisonDays, DanceShortVideoRankingPageDTO $page): array
    {
        return [
            'value' => $comparisonDays,
            'label' => $comparisonDays.'日',
            'href' => $this->indexHref($page->selectedRegionCode, $comparisonDays, $page->sortKey, $page->limit),
            'isActive' => $comparisonDays === $page->comparisonDays,
        ];
    }

    private function sortKeyOptionProps(string $sortKey, DanceShortVideoRankingPageDTO $page): array
    {
        return [
            'value' => $sortKey,
            'label' => self::SORT_KEY_LABELS[$sortKey] ?? $sortKey,
            'href' => $this->indexHref($page->selectedRegionCode, $page->comparisonDays, $sortKey, $page->limit),
            'isActive' => $sortKey === $page->sortKey,
        ];
    }

    private function rankingItemProps(DanceShortVideoRankingItemDTO $item): array
    {
        return [
            'videoId' => $item->videoId,
            'youtubeVideoId' => $item->youtubeVideoId,
            'title' => $item->title,
            'channelTitle' => $item->channelTitle,
            'thumbnailUrl' => $item->thumbnailUrl,
            'url' => $item->url,
            'publishedAt' => $item->publishedAt?->toIso8601String(),
            'region' => [
                'code' => $item->regionCode,
                'name' => $item->regionName,
            ],
            'currentViewCount' => $item->currentViewCount,
            'previousViewCount' => $item->previousViewCount,
            'viewCountDelta' => $item->viewCountDelta,
            'viewGrowthRate' => $item->viewGrowthRate,
            'viewsPerHour' => $item->viewsPerHour,
            'likeCount' => $item->likeCount,
            'commentCount' => $item->commentCount,
            'collectedAt' => $item->currentCollectedAt->toIso8601String(),
            'currentCollectedAt' => $item->currentCollectedAt->toIso8601String(),
            'previousCollectedAt' => $item->previousCollectedAt->toIso8601String(),
            'comparisonDays' => $item->comparisonDays,
        ];
    }

    private function candidateProps(DanceShortVideoRankingItemDTO $item): array
    {
        /*
         * 既存 MOCK の候補カード props は snake_case で固まっています。
         * 本番画面側もここで同じ表示入力へ寄せることで、React は既存カードを「受け取った値を表示する」
         * コンポーネントとして使い回せます。camelCase の RankingItemDTO は PHP レイヤー内の境界、
         * snake_case の candidate props は Inertia / React 表示境界、という変換点をここに閉じます。
         */
        return [
            'video_id' => $item->videoId,
            'youtube_video_id' => $item->youtubeVideoId,
            'region' => $item->regionCode,
            'title' => $item->title,
            'channel_title' => $item->channelTitle,
            'published_at' => $item->publishedAt?->format('Y-m-d H:i'),
            'collected_at' => $item->currentCollectedAt->format('Y-m-d H:i'),
            'like_count' => $item->likeCount,
            'comment_count' => $item->commentCount,
            'view_count' => $item->currentViewCount,
            'previous_view_count' => $item->previousViewCount,
            'view_diff' => $item->viewCountDelta,
            'view_growth_rate' => $item->viewGrowthRate,
            'views_per_hour' => $item->viewsPerHour,
            'thumbnail_url' => $item->thumbnailUrl,
            'youtube_url' => $item->url,
        ];
    }

    private function indexHref(
        ?string $regionCode,
        int $comparisonDays,
        string $sortKey,
        int $limit,
    ): string {
        $query = array_filter([
            'region' => $regionCode,
            'comparisonDays' => $comparisonDays,
            'sort' => $sortKey,
            'limit' => $limit,
        ], fn (mixed $value): bool => $value !== null);

        return route('dance-shorts-radar.index', [], false).'?'.http_build_query($query);
    }
}
