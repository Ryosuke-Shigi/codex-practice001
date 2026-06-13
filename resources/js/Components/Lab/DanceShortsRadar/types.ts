/**
 * DanceShortsRadar の画面 props / Component props で共有する型定義です。
 *
 * Laravel Responder が返すランキング/上昇候補/表示カードの境界を React 側で表し、UI state と業務判断を混ぜないために使います。
 */
export type DanceShortsRegionCode = 'JP' | 'US' | 'KR';
export const DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES = {
    RANKING: 'ranking',
    RISING: 'rising',
} as const;

export type DanceShortsDisplayCardFieldType =
    (typeof DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES)[keyof typeof DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES];

/*
 * 画面で選べる集計期間です。
 * ここでは文字列リテラルとして固定し、仕様外の期間値が UI 側へ入り込まないようにします。
 * 将来 API へ渡す値を number や enum に変える場合も、この型を入口にすれば影響範囲を追いやすくなります。
 */
export type DanceShortsAggregationPeriod =
    | '1日'
    | '3日'
    | '7日'
    | '14日'
    | '30日';
/*
 * タブ選択専用の型です。
 * ALL は「まとめ」タブのためだけに使い、候補データや保存対象地域の型には含めません。
 */
export type DanceShortsRegionTabCode = 'ALL' | DanceShortsRegionCode;
/*
 * RISING は画面表示専用の「上昇候補」タブです。
 * JP / US / KR のような保存対象地域ではないため、DanceShortsRegionCode には混ぜず、
 * タブ選択用の型だけを拡張します。
 */
export type DanceShortsTabCode = 'RISING' | DanceShortsRegionTabCode;

/*
 * Dance Shorts Radar モック画面で使う props 型です。
 *
 * Laravel 側の固定データは snake_case の項目名で渡しています。
 * これは今回の要件にあるモックデータ項目名に合わせるためで、React 側も同じキーを表示入力として扱います。
 * 後続で Component props 用 DTO を導入する段階では、camelCase へ寄せるかどうかを改めて判断します。
 */
export type DanceShortsRegion = {
    code: DanceShortsRegionCode;
    label: string;
    description: string;
};

export type DanceShortsRegionTab = {
    /*
     * ALL は画面タブ専用です。
     * 候補データの region や candidatesByRegion のキーには使わず、全件表示の選択状態だけを表します。
     */
    code: DanceShortsRegionTabCode;
    label: string;
    description: string;
};

export type DanceShortsTab = {
    code: DanceShortsTabCode;
    label: string;
    description: string;
};

export type DanceShortsFieldTab = DanceShortsTab & {
    href: string;
    isActive: boolean;
};

export type DanceShortsSelectOption<T extends string | number> = {
    value: T;
    label: string;
    href: string;
    isActive: boolean;
};

export type DanceShortsDisplaySelectField = {
    selectedTab: DanceShortsTabCode;
    comparisonDays: number;
    sortKey: string;
    showSortKeyOptions: boolean;
    regionTabs: DanceShortsFieldTab[];
    comparisonDayOptions: Array<DanceShortsSelectOption<number>>;
    sortKeyOptions: Array<DanceShortsSelectOption<string>>;
};

export type DanceShortsDisplayHeaderField = {
    title: string;
    description: string;
    selectedTabLabel: string;
    comparisonDaysLabel: string;
    cardCountLabel: string;
    sortLabel: string;
};

export type DanceShortsCandidate = {
    video_id?: number;
    youtube_video_id?: string;
    region: DanceShortsRegionCode;
    title: string;
    channel_title?: string | null;
    published_at: string | null;
    collected_at?: string | null;
    like_count: number | null;
    comment_count?: number | null;
    view_count: number;
    previous_view_count: number | null;
    view_diff: number | null;
    view_growth_rate?: number | null;
    views_per_hour: number | null;
    has_previous_snapshot?: boolean;
    comparison_status?: '比較済み' | '比較元なし';
    thumbnail_url: string | null;
    youtube_url: string | null;
};

export type DanceShortsDisplayCardPagination = {
    startRank: number;
    windowSize: number;
    hasPrev: boolean;
    hasNext: boolean;
    prevStartRank: number | null;
    nextStartRank: number | null;
};

export type DanceShortsCandidatesByRegion = Record<
    DanceShortsRegionCode,
    DanceShortsCandidate[]
>;

/*
 * 上昇候補カード専用の表示データです。
 * 地域別ランキングの DanceShortsCandidate は、現在視聴数や前回視聴数を持つランキング表示用です。
 * こちらは「海外先行の地域」「日本側の観測状態」「増加率」など、上昇候補タブで見たい意味を持たせます。
 */
export type DanceShortsRisingCandidate = {
    video_id?: number;
    youtube_video_id?: string;
    title: string;
    channel_title?: string | null;
    published_at?: string | null;
    source_region: DanceShortsRegionCode;
    source_region_label: string;
    source_current_view_count?: number;
    source_previous_view_count?: number | null;
    source_collected_at?: string | null;
    source_previous_collected_at?: string | null;
    japan_status: string;
    japan_current_view_count?: number | null;
    japan_previous_view_count?: number | null;
    japan_view_count_delta?: number | null;
    japan_view_growth_rate?: number | null;
    japan_views_per_hour?: number | null;
    japan_collected_at?: string | null;
    japan_previous_collected_at?: string | null;
    japan_comparison_status?: 'unobserved' | 'smaller_delta';
    view_count_delta: number;
    view_growth_rate: number | null;
    views_per_hour?: number | null;
    thumbnail_url: string | null;
    youtube_url: string | null;
    tags: string[];
    observation_note: string;
};

export type DanceShortsDisplayCardField =
    | {
          type: typeof DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES.RANKING;
          visibleCards: DanceShortsCandidate[];
          activeIndex: number;
          activeRank: number | null;
          pagination: DanceShortsDisplayCardPagination;
          emptyMessage: string | null;
      }
    | {
          type: typeof DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES.RISING;
          visibleCards: DanceShortsRisingCandidate[];
          activeIndex: number;
          activeRank: number | null;
          pagination: DanceShortsDisplayCardPagination;
          emptyMessage: string | null;
      };

export type DanceShortsDisplayCardWindowRequest = {
    tab: DanceShortsTabCode;
    comparisonDays: number;
    sortKey: string;
};

/*
 * snapshot 一覧画面専用の表示種別です。
 * 通常ランキングのタブ値や保存対象地域とは別に扱い、初回観測一覧 / 最新観測一覧を
 * view_count_delta や view_growth_rate の比較ランキングへ混ぜないための型です。
 *
 * ここに 'RISING' や 'ALL' を入れないことで、観測一覧の画面切り替えとランキングタブの選択状態を分離します。
 * React 側の state もこの型で分けるため、後続で snapshot 一覧の本データ接続を入れるときに
 * ランキング用 DTO / Repository / Query と同じ入口へ寄せてしまう事故を避けやすくします。
 */
export type DanceShortsSnapshotObservationKind = 'first' | 'latest';

/*
 * 初回観測一覧 / 最新観測一覧で使う MOCK 表示データです。
 * 比較ランキングではないため、view_count_delta / view_growth_rate / views_per_hour は持たせません。
 */
export type DanceShortsSnapshotObservation = {
    region: DanceShortsRegionCode;
    keyword: string;
    title: string;
    channel_title: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    published_at: string;
    observed_at: string;
    status: '比較元なし' | '最新観測';
};
