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
            'collectedAt' => $item->currentCollectedAt->toIso8601String(),
            'currentCollectedAt' => $item->currentCollectedAt->toIso8601String(),
            'previousCollectedAt' => $item->previousCollectedAt->toIso8601String(),
            'comparisonDays' => $item->comparisonDays,
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
            'comparison_days' => $comparisonDays,
            'sort_key' => $sortKey,
            'limit' => $limit,
        ], fn (mixed $value): bool => $value !== null);

        return route('dance-shorts-radar.index', [], false).'?'.http_build_query($query);
    }
}
