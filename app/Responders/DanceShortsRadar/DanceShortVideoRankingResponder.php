<?php

namespace App\Responders\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Display\DanceShortRankingDisplayCardDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortRisingDisplayCardDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingItemDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingRegionDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRisingCandidateDTO;
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
                /*
                 * region はブラウザ URL に残す現在タブの値です。
                 * 以前は RISING / ALL を null として返していましたが、React の操作を
                 * router.get() に寄せるには、表示専用タブも query 値として明示します。
                 */
                'region' => $page->selectedTabCode,
                'selectedTab' => $page->selectedTabCode,
                'comparisonDays' => $page->comparisonDays,
                'limit' => $page->limit,
                'sortKey' => $page->sortKey,
            ],
            'regionTabs' => $this->regionTabProps($page),
            'regions' => array_map(
                fn (DanceShortVideoRankingRegionDTO $region): array => $this->regionProps($region),
                $page->regions,
            ),
            /*
             * 既存の確認画面で固めた通常ランキング相当の props shape です。
             * 本番側では Query Action が返した DTO だけを材料にして同じ shape へ整えます。
             * ここに固定確認データ生成や candidate の sort 計算を置かないことで、
             * 「表示用 props 変換」と「ランキング取得・計算」の境界を分けたままにします。
             */
            'candidatesByRegion' => $this->candidatesByRegionProps($page),
            'allCandidates' => $this->allCandidateProps($page),
            'risingCandidates' => $this->risingCandidateProps($page),
            'displayCardField' => $this->displayCardFieldProps($page),
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
            'emptyMessage' => count($page->regions) === 0
                ? '有効な地域がまだ登録されていません。'
                : '表示できる通常ランキング候補はまだありません。',
            'risingEmptyMessage' => '表示できる上昇候補はまだありません。',
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

    /**
     * @return array<int, array{code: string, label: string, description: string, href: string, isActive: bool}>
     */
    private function regionTabProps(DanceShortVideoRankingPageDTO $page): array
    {
        /*
         * RISING と ALL はどちらも表示専用タブです。
         * RISING は上昇候補 Service が作った観測候補、ALL は Responder が地域別 DTO をまとめた表示であり、
         * どちらも dance_short_regions へ追加しません。href は Query Action が識別できる tab 値だけを
         * region query に置き、Repository へ RISING / ALL が渡らない境界は Action 側で保ちます。
         */
        $tabs = [[
            'code' => 'RISING',
            'label' => '上昇候補',
            'description' => '海外先行で伸びている候補',
            'href' => $this->indexHref('RISING', $page->comparisonDays, $page->sortKey, $page->limit),
            'isActive' => $page->selectedTabCode === 'RISING',
        ], [
            'code' => 'ALL',
            'label' => 'まとめ',
            'description' => '日本・アメリカ・韓国の保存済み snapshot ランキング',
            'href' => $this->indexHref('ALL', $page->comparisonDays, $page->sortKey, $page->limit),
            'isActive' => $page->selectedTabCode === 'ALL',
        ]];

        foreach ($page->regions as $region) {
            $tabs[] = [
                'code' => $region->code,
                'label' => $region->name,
                'description' => $region->name.'の保存済み snapshot ランキング',
                'href' => $this->indexHref($region->code, $page->comparisonDays, $page->sortKey, $page->limit),
                'isActive' => $region->code === $page->selectedTabCode,
            ];
        }

        return $tabs;
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
             * ALL や RISING は UI タブ専用の概念なので、本番の地域別候補には混ぜません。
             * これにより React 側は既存表示仕様と近い shape を受け取りつつ、保存対象地域と表示専用タブ値を
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
        /*
         * allCandidates は既存表示仕様と同じく「まとめ表示」用の配列です。
         * candidatesByRegion['ALL'] を作らないのは、ALL を region code として見せないためです。
         * 並び順と limit は Query Action が作った allRankingList に従い、Responder では
         * snake_case の候補カード props へ変換するだけに留めます。
         */
        return array_map(
            fn (DanceShortVideoRankingItemDTO $item): array => $this->candidateProps($item),
            $page->allRankingList->items,
        );
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function risingCandidateProps(DanceShortVideoRankingPageDTO $page): array
    {
        /*
         * 上昇候補は「日本で必ず伸びる動画」ではなく、US / KR の保存済み snapshot で先行して増加し、
         * JP 側が未観測または増加量の小さい優先観測候補です。
         * Service が固定順で作った DTO を、React が表示する snake_case props へ変換するだけに留めます。
         */
        return array_map(
            fn (DanceShortVideoRisingCandidateDTO $item): array => $this->risingCandidateCardProps($item),
            $page->risingCandidateList->items,
        );
    }

    /**
     * @return array{type: string, selectedTab: string, comparisonDays: int, sortKey: string, cards: array<int, array<string, mixed>>, emptyMessage: string}
     */
    private function displayCardFieldProps(DanceShortVideoRankingPageDTO $page): array
    {
        $field = $page->displayCardField;

        /*
         * displayCardField は React の主表示入口です。
         *
         * Action が type と cards を決め、Responder はカード DTO を既存カードコンポーネントが読める
         * snake_case props へ変換します。ここで region の選び直しやランキングの再計算を行わないことで、
         * 「表示対象の確定」は Action、「出力形への変換」は Responder という境界を保ちます。
         */
        return [
            'type' => $field->type,
            'selectedTab' => $field->selectedTab,
            'comparisonDays' => $field->comparisonDays,
            'sortKey' => $field->sortKey,
            'cards' => array_map(
                fn (DanceShortRankingDisplayCardDTO|DanceShortRisingDisplayCardDTO $card): array => $this->displayCardProps($card),
                $field->cards->cards,
            ),
            'emptyMessage' => $field->emptyMessage,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function displayCardProps(
        DanceShortRankingDisplayCardDTO|DanceShortRisingDisplayCardDTO $card,
    ): array {
        /*
         * カード種別ごとの配列変換だけをここで切り替えます。
         * 新しい displayCardField.type が増えた場合は、新しい DisplayCardDTO と変換メソッドを足せばよく、
         * 既存の通常ランキング DTO と上昇候補 DTO を無理に統合する必要はありません。
         */
        return match (true) {
            $card instanceof DanceShortRankingDisplayCardDTO => $this->candidateProps($card->rankingItem),
            $card instanceof DanceShortRisingDisplayCardDTO => $this->risingCandidateCardProps($card->risingCandidate),
        };
    }

    private function comparisonDayOptionProps(int $comparisonDays, DanceShortVideoRankingPageDTO $page): array
    {
        return [
            'value' => $comparisonDays,
            'label' => $comparisonDays.'日',
            'href' => $this->indexHref($page->selectedTabCode, $comparisonDays, $page->sortKey, $page->limit),
            'isActive' => $comparisonDays === $page->comparisonDays,
        ];
    }

    private function sortKeyOptionProps(string $sortKey, DanceShortVideoRankingPageDTO $page): array
    {
        return [
            'value' => $sortKey,
            'label' => self::SORT_KEY_LABELS[$sortKey] ?? $sortKey,
            'href' => $this->indexHref($page->selectedTabCode, $page->comparisonDays, $sortKey, $page->limit),
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
            'previousCollectedAt' => $item->previousCollectedAt?->toIso8601String(),
            'comparisonDays' => $item->comparisonDays,
            'hasPreviousSnapshot' => $item->hasPreviousSnapshot,
            'comparisonStatus' => $item->hasPreviousSnapshot ? '比較済み' : '比較元なし',
        ];
    }

    private function candidateProps(DanceShortVideoRankingItemDTO $item): array
    {
        /*
         * 既存の候補カード props は snake_case で固まっています。
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
            'has_previous_snapshot' => $item->hasPreviousSnapshot,
            'comparison_status' => $item->hasPreviousSnapshot ? '比較済み' : '比較元なし',
            'thumbnail_url' => $item->thumbnailUrl,
            'youtube_url' => $item->url,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function risingCandidateCardProps(DanceShortVideoRisingCandidateDTO $item): array
    {
        return [
            'video_id' => $item->videoId,
            'youtube_video_id' => $item->youtubeVideoId,
            'title' => $item->title,
            'channel_title' => $item->channelTitle,
            'published_at' => $item->publishedAt?->format('Y-m-d H:i'),
            'source_region' => $item->sourceRegionCode,
            'source_region_label' => $item->sourceRegionName,
            'source_current_view_count' => $item->sourceCurrentViewCount,
            'source_previous_view_count' => $item->sourcePreviousViewCount,
            'view_count_delta' => $item->sourceViewCountDelta,
            'view_growth_rate' => $item->sourceViewGrowthRate,
            'views_per_hour' => $item->sourceViewsPerHour,
            'source_collected_at' => $item->sourceCurrentCollectedAt->format('Y-m-d H:i'),
            'source_previous_collected_at' => $item->sourcePreviousCollectedAt?->format('Y-m-d H:i'),
            'japan_status' => $this->japanStatusLabel($item),
            'japan_current_view_count' => $item->japanCurrentViewCount,
            'japan_previous_view_count' => $item->japanPreviousViewCount,
            'japan_view_count_delta' => $item->japanViewCountDelta,
            'japan_view_growth_rate' => $item->japanViewGrowthRate,
            'japan_views_per_hour' => $item->japanViewsPerHour,
            'japan_collected_at' => $item->japanCurrentCollectedAt?->format('Y-m-d H:i'),
            'japan_previous_collected_at' => $item->japanPreviousCollectedAt?->format('Y-m-d H:i'),
            'japan_comparison_status' => $item->japanComparisonStatus,
            'thumbnail_url' => $item->thumbnailUrl,
            'youtube_url' => $item->url,
            'tags' => [],
            'observation_note' => $this->risingObservationNote($item),
        ];
    }

    private function japanStatusLabel(DanceShortVideoRisingCandidateDTO $item): string
    {
        return match ($item->japanComparisonStatus) {
            'unobserved' => '日本側は未観測',
            'smaller_delta' => '日本側の増加量は海外側より小さい',
            default => '日本側は確認中',
        };
    }

    private function risingObservationNote(DanceShortVideoRisingCandidateDTO $item): string
    {
        return match ($item->japanComparisonStatus) {
            'unobserved' => $item->sourceRegionName.'の保存済み snapshot では視聴数増加があり、日本側はまだ未観測の候補です。',
            'smaller_delta' => $item->sourceRegionName.'の保存済み snapshot では視聴数増加が先行し、日本側の増加量は海外側より小さい候補です。',
            default => $item->sourceRegionName.'の保存済み snapshot から継続観測したい候補です。',
        };
    }

    private function indexHref(
        ?string $regionCode,
        int $comparisonDays,
        string $sortKey,
        int $limit,
    ): string {
        /*
         * 各操作ボタンは React 側で query を組み立てず、この href を router.get() に渡します。
         * RISING / ALL も region query に残すことで、リロード、戻る/進む、URL共有時に
         * 同じ表示条件を Laravel 側の Request / Action / Responder から復元できます。
         */
        $query = array_filter([
            'region' => $regionCode,
            'comparisonDays' => $comparisonDays,
            'sort' => $sortKey,
            'limit' => $limit,
        ], fn (mixed $value): bool => $value !== null);

        return route('dance-shorts-radar.index', [], false).'?'.http_build_query($query);
    }
}
