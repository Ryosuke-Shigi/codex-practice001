import type { DanceShortsSnapshotObservation } from './types';

/*
 * 初回観測一覧用のフロント MOCK データです。
 *
 * previous snapshot がまだ無い動画を想定するため、通常ランキング用の差分値や伸び率は持たせません。
 * 初回取得直後に「どの動画が観測できたか」を確認するための一覧として、地域・キーワード・現在値だけを置きます。
 *
 * ここで重要なのは、view_count が大きい順に並べているわけではない、という点です。
 * 初回観測は比較元が無いため「伸びている順」や「増加率順」として扱えません。
 * MOCK でも status を必ず「比較元なし」に固定し、後続の本データ接続時に
 * previous snapshot 不在の動画へ view_count_delta / view_growth_rate を表示しない仕様を先に固定します。
 */
export const firstSnapshotObservationMockData: DanceShortsSnapshotObservation[] =
    [
        {
            region: 'JP',
            keyword: 'ダンス shorts',
            title: '体育館の放課後ステップ Shorts',
            channel_title: 'Studio After School',
            view_count: 284300,
            like_count: 12600,
            comment_count: 412,
            published_at: '2026-05-31 20:15',
            observed_at: '2026-06-01 08:30',
            status: '比較元なし',
        },
        {
            region: 'US',
            keyword: 'dance challenge',
            title: 'Mirror Count Practice Shorts',
            channel_title: 'Eight Count Lab',
            view_count: 517800,
            like_count: 21800,
            comment_count: 736,
            published_at: '2026-05-31 11:45',
            observed_at: '2026-06-01 08:32',
            status: '比較元なし',
        },
        {
            region: 'KR',
            keyword: 'kpop dance',
            title: 'Practice Room Point Move Shorts',
            channel_title: 'K Move Archive',
            view_count: 642900,
            like_count: 38900,
            comment_count: 1180,
            published_at: '2026-05-30 22:05',
            observed_at: '2026-06-01 08:35',
            status: '比較元なし',
        },
    ];

/*
 * 最新観測一覧用のフロント MOCK データです。
 *
 * 最新 snapshot を持つ動画の現在状態を確認するための一覧です。
 * こちらも比較ランキングではないため、現在の視聴数・いいね数・コメント数を中心に表示します。
 *
 * 「最新観測」は current snapshot の棚卸しに近い表示です。
 * previous snapshot が存在する可能性はありますが、この一覧では比較を主目的にしません。
 * そのため、通常ランキング用の候補データとは別配列にして、Action / Repository 側のランキング取得へ
 * 誤って混ぜ込まれないようにしています。
 */
export const latestSnapshotObservationMockData: DanceShortsSnapshotObservation[] =
    [
        {
            region: 'JP',
            keyword: '踊ってみた shorts',
            title: 'サビだけ合わせる駅前ダンス Shorts',
            channel_title: 'Tokyo Step Notes',
            view_count: 1268400,
            like_count: 58300,
            comment_count: 1940,
            published_at: '2026-05-30 21:10',
            observed_at: '2026-06-01 08:40',
            status: '最新観測',
        },
        {
            region: 'US',
            keyword: 'shorts dance',
            title: 'Rooftop Pair Dance Shorts',
            channel_title: 'Weekend Motion',
            view_count: 889000,
            like_count: 31600,
            comment_count: 920,
            published_at: '2026-05-30 11:25',
            observed_at: '2026-06-01 08:42',
            status: '最新観測',
        },
        {
            region: 'KR',
            keyword: 'dance trend',
            title: 'Formation Switch Practice Shorts',
            channel_title: 'Seoul Practice Grid',
            view_count: 1710000,
            like_count: 77000,
            comment_count: 2840,
            published_at: '2026-05-30 19:02',
            observed_at: '2026-06-01 08:45',
            status: '最新観測',
        },
    ];
