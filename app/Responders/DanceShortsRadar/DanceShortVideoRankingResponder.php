<?php

namespace App\Responders\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardFieldDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortRankingDisplayCardDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortRisingDisplayCardDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingItemDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRisingCandidateDTO;
use Illuminate\Http\JsonResponse;
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
        /*
         * 3Field 化後の本画面では、React が旧 props を横断して表示対象を組み立てません。
         *
         * - displaySelectField: 操作 UI と href / active 状態
         * - displayHeaderField: 現在条件の説明ラベル
         * - displayCardField: 下側に差し替えるカード一覧
         *
         * Responder はこの3つを同じ PageDTO から同時に作ることで、タブ、比較日数、並び順、
         * カード件数の表示が同じ query 条件から来ていることを保証します。
         */
        $regionTabs = $this->regionTabProps($page);
        $comparisonDayOptions = array_map(
            fn (int $comparisonDays): array => $this->comparisonDayOptionProps($comparisonDays, $page),
            $page->comparisonDayOptions,
        );
        $sortKeyOptions = array_map(
            fn (string $sortKey): array => $this->sortKeyOptionProps($sortKey, $page),
            $page->sortKeyOptions,
        );
        $displayCardField = $this->displayCardFieldProps($page->displayCardField);

        return Inertia::render('DanceShortsRadar/Index', [
            'displaySelectField' => $this->displaySelectFieldProps(
                page: $page,
                regionTabs: $regionTabs,
                comparisonDayOptions: $comparisonDayOptions,
                sortKeyOptions: $sortKeyOptions,
            ),
            'displayHeaderField' => $this->displayHeaderFieldProps(
                page: $page,
                regionTabs: $regionTabs,
            ),
            'displayCardField' => $displayCardField,
        ]);
    }

    /**
     * @param  array<int, array{code: string, label: string, description: string, href: string, isActive: bool}>  $regionTabs
     * @param  array<int, array{value: int, label: string, href: string, isActive: bool}>  $comparisonDayOptions
     * @param  array<int, array{value: string, label: string, href: string, isActive: bool}>  $sortKeyOptions
     * @return array{
     *     selectedTab: string,
     *     comparisonDays: int,
     *     sortKey: string,
     *     showSortKeyOptions: bool,
     *     regionTabs: array<int, array{code: string, label: string, description: string, href: string, isActive: bool}>,
     *     comparisonDayOptions: array<int, array{value: int, label: string, href: string, isActive: bool}>,
     *     sortKeyOptions: array<int, array{value: string, label: string, href: string, isActive: bool}>
     * }
     */
    private function displaySelectFieldProps(
        DanceShortVideoRankingPageDTO $page,
        array $regionTabs,
        array $comparisonDayOptions,
        array $sortKeyOptions,
    ): array {
        /*
         * select field は操作部品専用の props です。
         *
         * React 側はここに入っている href を router.get() へ渡すだけで、URL query を組み直しません。
         * showSortKeyOptions もここで確定し、上昇候補タブでは並び順 UI を出さないという表示制御を
         * card field 側へ漏らさないようにします。カード件数や説明文は header / card field に分けます。
         */
        return [
            'selectedTab' => $page->selectedTabCode,
            'comparisonDays' => $page->comparisonDays,
            'sortKey' => $page->sortKey,
            'showSortKeyOptions' => $page->selectedTabCode !== 'RISING',
            'regionTabs' => $regionTabs,
            'comparisonDayOptions' => $comparisonDayOptions,
            'sortKeyOptions' => $sortKeyOptions,
        ];
    }

    /**
     * @param  array<int, array{code: string, label: string, description: string, href: string, isActive: bool}>  $regionTabs
     * @return array{
     *     title: string,
     *     description: string,
     *     selectedTabLabel: string,
     *     comparisonDaysLabel: string,
     *     cardCountLabel: string,
     *     sortLabel: string
     * }
     */
    private function displayHeaderFieldProps(DanceShortVideoRankingPageDTO $page, array $regionTabs): array
    {
        /*
         * header field は「いま何を見ているか」を説明するだけの props です。
         *
         * href や active 状態を持たせると select field と責務が重なり、カード配列を持たせると
         * card field と責務が重なります。そのため、ここでは選択中タブ名、比較日数、件数、
         * 並び順の表示ラベルだけを返します。
         */
        $selectedTab = $this->selectedTabProps($page->selectedTabCode, $regionTabs);
        $selectedTabLabel = $selectedTab['label'] ?? $page->selectedTabCode;
        $description = $selectedTab['description'] ?? 'ダンスShortsランキング';

        return [
            'title' => $selectedTabLabel,
            'description' => $description,
            'selectedTabLabel' => $selectedTabLabel,
            'comparisonDaysLabel' => $page->comparisonDays.'日比較',
            'cardCountLabel' => count($page->displayCardField->visibleCards->cards).'件',
            'sortLabel' => $page->selectedTabCode === 'RISING'
                ? '上昇候補順'
                : (self::SORT_KEY_LABELS[$page->sortKey] ?? $page->sortKey),
        ];
    }

    /**
     * @param  array<int, array{code: string, label: string, description: string, href: string, isActive: bool}>  $regionTabs
     * @return array{code: string, label: string, description: string, href: string, isActive: bool}|null
     */
    private function selectedTabProps(string $selectedTabCode, array $regionTabs): ?array
    {
        foreach ($regionTabs as $regionTab) {
            if ($regionTab['code'] === $selectedTabCode) {
                return $regionTab;
            }
        }

        return null;
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
         * query に置き、Repository へ RISING / ALL が渡らない境界は Action 側で保ちます。
         */
        $tabs = [[
            'code' => 'RISING',
            'label' => '上昇候補',
            'description' => '海外先行で伸びている候補',
            'href' => $this->indexHref('RISING', $page->comparisonDays, $page->sortKey),
            'isActive' => $page->selectedTabCode === 'RISING',
        ], [
            'code' => 'ALL',
            'label' => 'まとめ',
            'description' => '日本・アメリカ・韓国のランキング',
            'href' => $this->indexHref('ALL', $page->comparisonDays, $page->sortKey),
            'isActive' => $page->selectedTabCode === 'ALL',
        ]];

        foreach ($page->regions as $region) {
            $tabs[] = [
                'code' => $region->code,
                'label' => $region->name,
                'description' => $region->name.'のランキング',
                'href' => $this->indexHref($region->code, $page->comparisonDays, $page->sortKey),
                'isActive' => $region->code === $page->selectedTabCode,
            ];
        }

        return $tabs;
    }

    /**
     * @return array{
     *     type: string,
     *     visibleCards: array<int, array<string, mixed>>,
     *     activeIndex: int,
     *     activeRank: int|null,
     *     pagination: array{
     *         startRank: int,
     *         windowSize: int,
     *         hasPrev: bool,
     *         hasNext: bool,
     *         prevStartRank: int|null,
     *         nextStartRank: int|null
     *     },
     *     emptyMessage: string|null
     * }
     */
    public function displayCardFieldProps(DanceShortDisplayCardFieldDTO $field): array
    {
        /*
         * displayCardField は下側の差し替え領域専用です。
         *
         * Action が type と visibleCards を決め、Responder はカード DTO を既存カードコンポーネントが読める
         * snake_case props へ変換します。ここで region の選び直しやランキングの再計算を行わないことで、
         * 「表示対象の確定」は Action、「出力形への変換」は Responder という境界を保ちます。
         *
         * selectedTab / comparisonDays / sortKey は意図的に返しません。カード表示側がそれらを見ると、
         * select/header の状態責務が card field に戻り、3Field 分離が崩れるためです。
         */
        return [
            'type' => $field->type,
            'visibleCards' => array_map(
                fn (DanceShortRankingDisplayCardDTO|DanceShortRisingDisplayCardDTO $card): array => $this->displayCardProps($card),
                $field->visibleCards->cards,
            ),
            'activeIndex' => $field->activeIndex,
            'activeRank' => $field->activeRank,
            'pagination' => $field->pagination->toArray(),
            'emptyMessage' => $field->emptyMessage,
        ];
    }

    public function cardWindow(DanceShortDisplayCardFieldDTO $field): JsonResponse
    {
        return response()->json([
            'displayCardField' => $this->displayCardFieldProps($field),
        ]);
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
            'href' => $this->indexHref($page->selectedTabCode, $comparisonDays, $page->sortKey),
            'isActive' => $comparisonDays === $page->comparisonDays,
        ];
    }

    private function sortKeyOptionProps(string $sortKey, DanceShortVideoRankingPageDTO $page): array
    {
        return [
            'value' => $sortKey,
            'label' => self::SORT_KEY_LABELS[$sortKey] ?? $sortKey,
            'href' => $this->indexHref($page->selectedTabCode, $page->comparisonDays, $sortKey),
            'isActive' => $sortKey === $page->sortKey,
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
            'unobserved' => $item->sourceRegionName.'で視聴数が伸び、日本側はまだ未観測の候補です。',
            'smaller_delta' => $item->sourceRegionName.'で視聴数増加が先行し、日本側の増加量は海外側より小さい候補です。',
            default => $item->sourceRegionName.'で継続観測したい候補です。',
        };
    }

    private function indexHref(
        ?string $regionCode,
        int $comparisonDays,
        string $sortKey,
    ): string {
        /*
         * 各操作ボタンは React 側で query を組み立てず、この href を router.get() に渡します。
         * RISING / ALL も tab query に残すことで、リロード、戻る/進む、URL共有時に
         * 同じ表示条件を Laravel 側の Request / Action / Responder から復元できます。
         */
        $query = array_filter([
            'tab' => $regionCode,
            'comparisonDays' => $comparisonDays,
            'sort' => $sortKey,
        ], fn (mixed $value): bool => $value !== null);

        return route('dance-shorts-radar.index', [], false).'?'.http_build_query($query);
    }
}
