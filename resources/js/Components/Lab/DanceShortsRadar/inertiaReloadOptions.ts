/*
 * DanceShortsRadar 本画面のタブ / 比較日数 / 並び順切り替えで使う
 * Inertia partial reload 対象 props です。
 *
 * displayCardField は、Laravel 側で region / comparisonDays / sort / limit を
 * 反映して確定した表示カード群です。React 側では allCandidates /
 * candidatesByRegion / risingCandidates から表示対象を選び直さないため、
 * 画面更新時に必ず再取得します。
 *
 * filters は header の limit 表示、regionTabs / comparisonDayOptions /
 * sortKeyOptions は href と active 状態が現在の query に依存します。
 * これらを only から外すと、カードだけは新しくなっても上部 UI の選択状態や
 * 次に押すリンクが古い query のまま残る可能性があります。
 *
 * 一方で allCandidates / candidatesByRegion / risingCandidates のような
 * 旧表示用の大きい候補配列 props はここに含めません。partial reload の体感を
 * displayCardField 中心に寄せるため、更新対象は query 依存の表示 props に絞ります。
 */
export const DANCE_SHORTS_RADAR_RELOAD_ONLY_PROPS: string[] = [
    'filters',
    'regionTabs',
    'displayCardField',
    'comparisonDayOptions',
    'sortKeyOptions',
];

/*
 * router.get() の共通 reload option です。
 *
 * preserveScroll は、一覧を見ている途中で条件を切り替えたときにスクロール位置を
 * 保つために使います。preserveState は Inertia のページコンポーネント state を
 * 遷移ごとに破棄しないための設定で、partial reload でも「画面全体が通常リンクで
 * refresh されたように見える」体感を減らす役割があります。
 *
 * この option を各クリック箇所に直接書かず共通化することで、タブ、比較日数、
 * 並び順のどれか一つだけ preserveState を忘れる事故を避けます。
 */
export const DANCE_SHORTS_RADAR_RELOAD_OPTIONS = {
    preserveScroll: true,
    preserveState: true,
    only: DANCE_SHORTS_RADAR_RELOAD_ONLY_PROPS,
} as const;
