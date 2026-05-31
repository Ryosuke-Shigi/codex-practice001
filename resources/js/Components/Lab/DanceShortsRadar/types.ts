export type DanceShortsRegionCode = 'JP' | 'US' | 'KR';

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
