<?php

namespace App\Actions\Lab\Queries;

/*
 * Dance Shorts Radar の API 疎通前モック用 Query Action です。
 *
 * この Action が守る境界:
 * - YouTube Data API には接続しない
 * - DB や snapshot テーブルには触らない
 * - 画面で見たい固定データを、Inertia props に渡しやすい形へ並べるだけにする
 *
 * 後続で本実装へ進むときは、この固定配列を YouTube API / DB 由来の DTO に差し替えます。
 * React 側の候補カードは props を表示するだけにしているため、差し替え時の影響範囲を
 * 「候補を集めて並べる境界」へ寄せられる想定です。
 */
final readonly class GetDanceShortsRadarMockCandidatesAction
{
    /**
     * 地域タブの定義です。
     *
     * 画面ラベルは React 側へ直書きせず、候補データと同じ props として渡します。
     * これにより、後続で region マスタや設定ファイルへ移した場合も、タブの表示責務は
     * RegionTabs のまま維持できます。
     *
     * @var array<int, array{code: string, label: string, description: string}>
     */
    private const REGIONS = [
        [
            'code' => 'JP',
            'label' => 'JP',
            'description' => '日本向けのダンスShorts候補',
        ],
        [
            'code' => 'US',
            'label' => 'US',
            'description' => '英語圏向けのダンスShorts候補',
        ],
        [
            'code' => 'KR',
            'label' => 'KR',
            'description' => '韓国・K-POP文脈のダンスShorts候補',
        ],
    ];

    /**
     * API 接続前に画面イメージを確認するための固定候補です。
     *
     * YouTube API 由来に見える値も、ここではすべて仮データとして扱います。
     * previous_view_count / view_diff / views_per_hour は本計算をまだ行わず、
     * 表示ラベル、数値の桁、カード内の密度、地域切り替えの操作感を確認するための入力です。
     *
     * thumbnail_url はリポジトリ内の静的SVGを指します。外部サムネイルへ依存させないことで、
     * YouTube APIキーやネットワーク状態がなくてもモック画面を開けるようにしています。
     *
     * @var array<int, array{
     *     region: string,
     *     title: string,
     *     published_at: string,
     *     like_count: int,
     *     view_count: int,
     *     previous_view_count: int,
     *     view_diff: int,
     *     views_per_hour: int,
     *     thumbnail_url: string,
     *     youtube_url: string
     * }>
     */
    private const CANDIDATES = [
        [
            'region' => 'JP',
            'title' => '放課後スタジオのミラー振付 Shorts',
            'published_at' => '2026-05-30 21:10',
            'like_count' => 58300,
            'view_count' => 1268400,
            'previous_view_count' => 1096800,
            'view_diff' => 171600,
            'views_per_hour' => 28600,
            'thumbnail_url' => '/images/dance-shorts-radar/mock-jp.svg',
            'youtube_url' => 'https://www.youtube.com/shorts/mock-jp-studio-mirror',
        ],
        [
            'region' => 'JP',
            'title' => '駅前ステップを3人で合わせる Shorts',
            'published_at' => '2026-05-29 18:42',
            'like_count' => 41200,
            'view_count' => 904500,
            'previous_view_count' => 791700,
            'view_diff' => 112800,
            'views_per_hour' => 18800,
            'thumbnail_url' => '/images/dance-shorts-radar/mock-jp.svg',
            'youtube_url' => 'https://www.youtube.com/shorts/mock-jp-station-step',
        ],
        [
            'region' => 'JP',
            'title' => 'サビ前だけを切り出した15秒振付 Shorts',
            'published_at' => '2026-05-28 20:05',
            'like_count' => 36700,
            'view_count' => 816200,
            'previous_view_count' => 730600,
            'view_diff' => 85600,
            'views_per_hour' => 14266,
            'thumbnail_url' => '/images/dance-shorts-radar/mock-jp.svg',
            'youtube_url' => 'https://www.youtube.com/shorts/mock-jp-hook-step',
        ],
        [
            'region' => 'US',
            'title' => '週末ルーフトップのペアダンス Shorts',
            'published_at' => '2026-05-30 11:25',
            'like_count' => 31600,
            'view_count' => 889000,
            'previous_view_count' => 761800,
            'view_diff' => 127200,
            'views_per_hour' => 21200,
            'thumbnail_url' => '/images/dance-shorts-radar/mock-us.svg',
            'youtube_url' => 'https://www.youtube.com/shorts/mock-us-rooftop-pair',
        ],
        [
            'region' => 'US',
            'title' => 'ワンカウント遅らせるシャッフル Shorts',
            'published_at' => '2026-05-29 23:18',
            'like_count' => 44200,
            'view_count' => 980000,
            'previous_view_count' => 862000,
            'view_diff' => 118000,
            'views_per_hour' => 21200,
            'thumbnail_url' => '/images/dance-shorts-radar/mock-us.svg',
            'youtube_url' => 'https://www.youtube.com/shorts/mock-us-delay-shuffle',
        ],
        [
            'region' => 'US',
            'title' => '手元クラップから始まるダンス Shorts',
            'published_at' => '2026-05-28 16:30',
            'like_count' => 27500,
            'view_count' => 702800,
            'previous_view_count' => 623600,
            'view_diff' => 79200,
            'views_per_hour' => 13200,
            'thumbnail_url' => '/images/dance-shorts-radar/mock-us.svg',
            'youtube_url' => 'https://www.youtube.com/shorts/mock-us-clap-start',
        ],
        [
            'region' => 'KR',
            'title' => '練習室フォーメーション切り替え Shorts',
            'published_at' => '2026-05-30 19:02',
            'like_count' => 77000,
            'view_count' => 1710000,
            'previous_view_count' => 1561200,
            'view_diff' => 148800,
            'views_per_hour' => 24800,
            'thumbnail_url' => '/images/dance-shorts-radar/mock-kr.svg',
            'youtube_url' => 'https://www.youtube.com/shorts/mock-kr-formation-switch',
        ],
        [
            'region' => 'KR',
            'title' => 'ポイント振付だけを反復する Shorts',
            'published_at' => '2026-05-30 14:44',
            'like_count' => 83000,
            'view_count' => 1560000,
            'previous_view_count' => 1411200,
            'view_diff' => 148800,
            'views_per_hour' => 24800,
            'thumbnail_url' => '/images/dance-shorts-radar/mock-kr.svg',
            'youtube_url' => 'https://www.youtube.com/shorts/mock-kr-point-repeat',
        ],
        [
            'region' => 'KR',
            'title' => 'サイドカメラで見せる8カウント Shorts',
            'published_at' => '2026-05-29 22:12',
            'like_count' => 51900,
            'view_count' => 1015500,
            'previous_view_count' => 919500,
            'view_diff' => 96000,
            'views_per_hour' => 16000,
            'thumbnail_url' => '/images/dance-shorts-radar/mock-kr.svg',
            'youtube_url' => 'https://www.youtube.com/shorts/mock-kr-side-camera',
        ],
    ];

    /**
     * DanceShortsRadarMock ページへ渡す props を組み立てます。
     *
     * ここでは「固定データを地域ごとに並べ替えて返す」までを担当します。
     * Inertia::render() は Responder、タブ選択やカード描画は React 側へ分離し、
     * Controller にモックデータの配列や表示整形が漏れないようにしています。
     *
     * @return array{
     *     regions: array<int, array{code: string, label: string, description: string}>,
     *     candidatesByRegion: array<string, array<int, array<string, mixed>>>,
     *     mockNotice: string
     * }
     */
    public function execute(): array
    {
        $candidatesByRegion = [];

        foreach (self::REGIONS as $region) {
            $candidatesByRegion[$region['code']] = $this->sortedCandidatesForRegion($region['code']);
        }

        return [
            'regions' => self::REGIONS,
            'candidatesByRegion' => $candidatesByRegion,
            'mockNotice' => 'この一覧は YouTube Data API には接続していないモックデータです。',
        ];
    }

    /**
     * 指定地域の候補を、今回の画面仕様に沿って表示順へ並べ替えます。
     *
     * 並び替え優先度:
     * 1. views_per_hour が多い順
     * 2. 同値なら view_diff が多い順
     * 3. 同値なら view_count が多い順
     * 4. 同値なら like_count が多い順
     *
     * この順序は「伸びている候補として見たい順」であり、成果や流行を断定する判定ではありません。
     * カード側へ sort を置かないことで、表示コンポーネントを受け取った順に描くだけの責務へ保ちます。
     *
     * @return array<int, array<string, mixed>>
     */
    private function sortedCandidatesForRegion(string $region): array
    {
        $candidates = array_values(array_filter(
            self::CANDIDATES,
            fn (array $candidate): bool => $candidate['region'] === $region,
        ));

        usort($candidates, function (array $first, array $second): int {
            return ($second['views_per_hour'] <=> $first['views_per_hour'])
                ?: ($second['view_diff'] <=> $first['view_diff'])
                ?: ($second['view_count'] <=> $first['view_count'])
                ?: ($second['like_count'] <=> $first['like_count']);
        });

        return $candidates;
    }
}
