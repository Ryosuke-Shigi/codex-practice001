/*
 * DanceShortsRadar 本画面のタブ / 比較日数 / 並び順切り替えで使う
 * Inertia partial reload 対象 props です。
 *
 * displaySelectField は操作 UI と href / active 状態、displayHeaderField は
 * 現在状態の説明、displayCardField は Laravel 側で確定したカード表示だけを持ちます。
 * React 側では旧候補配列や旧 UI props から表示対象を選び直しません。
 */
export const DANCE_SHORTS_RADAR_RELOAD_ONLY_PROPS: string[] = [
    'displaySelectField',
    'displayHeaderField',
    'displayCardField',
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
