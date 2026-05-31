export type DanceShortsRegionCode = 'JP' | 'US' | 'KR';
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

export type DanceShortsCandidate = {
    region: DanceShortsRegionCode;
    title: string;
    published_at: string;
    like_count: number;
    view_count: number;
    previous_view_count: number;
    view_diff: number;
    views_per_hour: number;
    thumbnail_url: string;
    youtube_url: string;
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
    title: string;
    source_region: DanceShortsRegionCode;
    source_region_label: string;
    japan_status: string;
    view_count_delta: number;
    view_growth_rate: number;
    thumbnail_url: string;
    youtube_url: string;
    tags: string[];
    observation_note: string;
};
