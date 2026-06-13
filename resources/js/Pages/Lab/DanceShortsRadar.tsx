import type { ReactNode } from 'react';

/**
 * Dance Shorts Radar の idea-board Page Component です。
 *
 * YouTube API 接続や snapshot 保存は行わず、構想説明と導線表示だけを担当します。
 */
import { Head } from '@inertiajs/react';

import MermaidDiagram from '@/Components/Common/Visualizations/Diagrams/MermaidDiagram';
import PortfolioLpFeatureGrid from '@/Components/Lab/PortfolioLpFeatureGrid';
import PortfolioLpHero from '@/Components/Lab/PortfolioLpHero';
import PortfolioLpTechSection from '@/Components/Lab/PortfolioLpTechSection';
import PortfolioLpTestSection from '@/Components/Lab/PortfolioLpTestSection';
import PublicLayout from '@/Layouts/PublicLayout';

/*
 * このページは Dance Shorts Radar のアイデアボードです。
 * YouTube Data API 呼び出し、APIキー設定、DB保存、Command 実行はまだ行わず、
 * 「どの公開データを、どの責務境界で、どう断定せずに見せるか」を静的に整理します。
 */
const appMetadata = [
    ['表示名', 'Dance Shorts Radar'],
    ['Laravel APP_NAME', 'Dance Shorts Radar'],
    ['Google Cloud プロジェクト名', 'DanceShortsRadar'],
    ['Google Cloud プロジェクトID', 'dance-shorts-radar'],
    ['GitHub repo名', 'dance-shorts-radar'],
] as const;

const regionRoles = [
    ['JP', '日本の YouTuber / VTuber / 配信者が実際に乗り始めているかを見る'],
    ['US', '英語圏の dance challenge / viral dance の元ネタ候補を見る'],
    ['KR', 'K-POP / 振付 / ダンスチャレンジ系の元ネタ候補を見る'],
] as const;

const metrics = [
    '前回からの再生数増加',
    '時間あたり再生増加数',
    '24時間再生増加数',
    'いいね数増加',
    'コメント数増加',
    '投稿日からの経過時間',
    '複数地域で検出されているか',
];

const featureItems = [
    {
        title: 'ダンス Shorts 候補の発見',
        description:
            'JP / US / KR の初期キーワードから、投稿テーマの参考になりそうなダンス Shorts 候補を探します。',
        label: 'Discover',
    },
    {
        title: '公開統計の snapshot 化',
        description:
            'video_id ごとに view / like / comment を時系列保存し、単発の再生数ではなく伸び方を見る設計です。',
        label: 'Snapshot',
    },
    {
        title: '前回との差分計算',
        description:
            '前回 snapshot との差分から、短時間で伸びている可能性が高い候補を確認します。',
        label: 'Delta',
    },
    {
        title: '地域別の役割分担',
        description:
            'JP は日本勢の反応、US は英語圏の dance challenge、KR は K-POP / 振付系の元ネタ候補を見ます。',
        label: 'Region',
    },
    {
        title: '断定しない分析UI',
        description:
            '「必ず伸びる」ではなく、「このアプリの指標上、伸び率が高い動画」として扱います。',
        label: 'Tone',
    },
    {
        title: 'quota を意識した初期範囲',
        description:
            '1キーワード × 1地域あたり最大25件から始め、追跡期間と snapshot 削除対象を最初から決めます。',
        label: 'Quota',
    },
];

const techItems = [
    {
        title: 'search.list は候補発見用',
        description:
            '検索結果だけで伸びているとは判断せず、video_id の発見入口として扱います。',
    },
    {
        title: 'videos.list は statistics 取得用',
        description:
            '保存済み video_id の view_count / like_count / comment_count を取得し、snapshot 化します。',
    },
    {
        title: '動画本体と snapshot を分離',
        description:
            'youtube_videos は基本情報、youtube_video_snapshots は定期取得ごとの数値として保存します。',
    },
    {
        title: 'tracking_status で追跡を制御',
        description:
            'active / hot / inactive / archived を想定し、通常候補30日、急上昇候補90日を目安にします。',
    },
    {
        title: 'trend score は後続で段階導入',
        description:
            '最初から複雑なスコアリングは行わず、差分と時間あたり増加数から育てます。',
    },
    {
        title: 'Command / Schedule 前提',
        description:
            '取得、snapshot 更新、score 計算を Laravel Command と Schedule で分ける構想です。',
    },
];

const architectureLayers = [
    {
        name: 'Command',
        role: 'CLI入口として Schedule から呼ばれ、対象regionや処理種別を受けます。',
    },
    {
        name: 'Action',
        role: '候補発見、snapshot更新、score計算のユースケース手順を制御します。',
    },
    {
        name: 'Service',
        role: '伸び判定、score算出、追跡対象選定、tracking_status更新の判断を担当します。',
    },
    {
        name: 'Repository',
        role: 'youtube_videos、snapshots、trend_scores の保存・取得境界を担当します。',
    },
    {
        name: 'External Client',
        role: 'YouTube Data API search.list / videos.list の呼び出しだけを担当します。',
    },
    {
        name: 'DTO / Responder',
        role: 'APIレスポンスや画面表示データを運び、ランキング画面のpropsを整えます。',
    },
];

const testItems = [
    {
        title: 'API Client 境界',
        description:
            'search.list と videos.list のレスポンスをDTO化し、外部APIの揺らぎをMockで確認します。',
    },
    {
        title: '重複 video_id 保存防止',
        description:
            '複数キーワードや複数地域で同じ動画を見つけても、動画本体を重複保存しないことを守ります。',
    },
    {
        title: 'snapshot 差分',
        description:
            '前回からの再生数、いいね数、コメント数の増加を正しく計算できることを固定します。',
    },
    {
        title: '時間あたり増加数',
        description:
            'collected_at の差から時間あたり再生増加数を算出し、0除算や欠損を扱います。',
    },
    {
        title: '断定表現の回避',
        description:
            '画面文言が「必ず伸びる」「世界で流行中」のような断定にならないことをレビュー観点にします。',
    },
    {
        title: 'Command 成功条件',
        description:
            'youtube:fetch-dance-candidates --region=JP で候補取得と statistics ログ出力まで確認します。',
    },
];

const portfolioValues = [
    {
        title: '外部API連携を説明できる',
        description:
            'YouTube Data API の search.list と videos.list を用途ごとに分け、quota制限も設計に含めます。',
    },
    {
        title: '時系列データ設計を見せられる',
        description:
            '動画本体、snapshot、trend score を分けることで、差分計算とランキングの根拠を説明できます。',
    },
    {
        title: '分析UIの言い方まで設計する',
        description:
            'バズる断定ではなく、公開データから見える「候補」として扱う姿勢をポートフォリオ価値にします。',
    },
];

const initialKeywords = [
    ['JP', 'ダンス shorts / 踊ってみた shorts / ダンスチャレンジ / 振付 / 踊ってみた / shorts dance'],
    ['US', 'shorts dance / dance challenge / viral dance / trending dance / dance trend'],
    ['KR', 'shorts dance / dance challenge / kpop dance / dance trend'],
] as const;

const initialTables = [
    'youtube_regions',
    'youtube_search_keywords',
    'youtube_videos',
    'youtube_video_snapshots',
    'youtube_trend_scores',
];

const commands = [
    'php artisan youtube:fetch-dance-candidates --region=JP',
    'php artisan youtube:discover-dance-videos --region=JP',
    'php artisan youtube:refresh-video-snapshots',
    'php artisan youtube:calculate-trend-scores',
];

const firstScope = [
    'Google Cloud プロジェクト作成',
    'YouTube Data API v3 有効化',
    'APIキー作成と .env 設定',
    'YouTube API Client 作成',
    'search.list 疎通確認',
    'videos.list 疎通確認',
    'video_id と statistics の CLIログ出力',
];

const nextScope = [
    'youtube_regions / youtube_search_keywords 作成',
    'youtube_videos / youtube_video_snapshots 作成',
    'youtube_trend_scores 作成',
    '候補動画と snapshot 保存',
    '前回との差分計算',
    '時間あたり再生増加数の算出',
    '日本向けランキング画面',
];

const expressionRules = [
    ['使わない', '世界で流行中 / これをやれば伸びる / バズる動画 / 必ず再生数が稼げる'],
    ['使う', '伸びている候補 / 急上昇候補 / 複数地域で伸びている候補 / Shorts Trend Candidate'],
] as const;

const notDoing = [
    '必ず伸びる判定',
    '世界流行の断定',
    'Shorts音源トレンドの公式取得',
    'VTuber判定の厳密化',
    '投稿者タイプの自動断定',
    '最初から複雑なスコアリング',
    '最初からデザイン作り込み',
];

const acquisitionFlowChart = `flowchart TD
    TITLE["題: Dance Shorts Radar 取得・分析フロー"]
    START["Start"]
    A["検索キーワードを用意"]
    B["search.list で候補動画を取得"]
    C["video_id を youtube_videos に保存"]
    D["videos.list で statistics を取得"]
    E["youtube_video_snapshots に時系列保存"]
    F["前回 snapshot との差分を計算"]
    G["時間あたり再生増加数を算出"]
    H["youtube_trend_scores に保存"]
    I["ランキング画面で可視化"]
    END["End"]

    TITLE --> START
    START --> A
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> END`;

const laravelLayerChart = `flowchart TD
    TITLE["題: Laravel レイヤー構成"]
    START["Start"]
    A["Laravel Schedule"]
    B["Command"]
    C["Action"]
    D["Service"]
    E["Repository"]
    F["External YouTube API Client"]
    G["Database"]
    H["YouTube Data API"]
    END["End"]

    TITLE --> START
    START --> A
    A --> B
    B --> C
    C --> D
    D --> E
    D --> F
    E --> G
    F --> H
    H --> END`;

type SectionProps = {
    eyebrow: string;
    title: string;
    children: ReactNode;
};

function Section({ eyebrow, title, children }: SectionProps) {
    return (
        <section className="py-8">
            <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase text-cyan-100/72">
                    {eyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                    {title}
                </h2>
            </div>
            <div className="mt-5 min-w-0">{children}</div>
        </section>
    );
}

function CompactCard({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <article className="min-w-0 rounded-lg border border-white/14 bg-white/10 p-4 text-white backdrop-blur-xl">
            <h3 className="text-base font-semibold leading-6">{title}</h3>
            <div className="mt-3 break-all text-sm leading-6 text-slate-200/78">
                {children}
            </div>
        </article>
    );
}

function TableBlock({
    rows,
}: {
    rows: readonly (readonly [string, string])[];
}) {
    return (
        <dl className="grid overflow-hidden rounded-lg border border-white/14 bg-slate-950/42 text-sm sm:grid-cols-[220px_minmax(0,1fr)]">
            {rows.map(([label, value]) => (
                <div key={label} className="contents">
                    <dt className="border-b border-white/10 bg-white/8 px-4 py-3 font-semibold text-cyan-50 sm:border-r">
                        {label}
                    </dt>
                    <dd className="min-w-0 border-b border-white/10 px-4 py-3 text-slate-100/84 [overflow-wrap:anywhere]">
                        {value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

function PillList({ items }: { items: string[] }) {
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item) => (
                <span
                    key={item}
                    className="rounded-md border border-cyan-100/26 bg-cyan-100/10 px-2.5 py-1 text-xs font-semibold text-cyan-50"
                >
                    {item}
                </span>
            ))}
        </div>
    );
}

export default function DanceShortsRadar() {
    return (
        <PublicLayout className="bg-slate-950/45 px-4 py-5 sm:px-6 lg:px-8">
            <Head title="Dance Shorts Radar" />

            <article className="mx-auto flex min-h-screen min-w-0 w-[calc(100vw-2rem)] max-w-7xl flex-col gap-2 break-words pb-10 [overflow-wrap:anywhere] sm:w-[calc(100vw-3rem)] lg:w-full">
                <PortfolioLpHero
                    eyebrow="Idea Board"
                    title="Dance Shorts Radar"
                    lead="YouTube Shorts のダンス候補を、公開APIの統計snapshotと差分から検出する分析ツール"
                    description="日本の YouTuber / VTuber / 配信者が参考にしそうなダンス Shorts の投稿パターンを、YouTube Data API で取得できる公開データから候補として可視化する構想です。伸びることを断定せず、snapshot の差分から伸び率が高い可能性を見ます。"
                    status="ポートフォリオ候補"
                    keywords={[
                        'YouTube Data API',
                        'Shorts',
                        'Snapshot',
                        'Trend Score',
                        'JP / US / KR',
                    ]}
                    metrics={[
                        {
                            label: 'Scope',
                            value: 'Dance Shorts',
                            description:
                                '初期対象はダンス系 Shorts に絞り、地域ごとの役割を分けます。',
                        },
                        {
                            label: 'Signal',
                            value: 'Delta First',
                            description:
                                '再生数そのものではなく、前回からの増加と時間あたり増加数を見ます。',
                        },
                        {
                            label: 'Tone',
                            value: 'Candidate',
                            description:
                                '世界流行や必勝を断定せず、投稿テーマの参考候補として扱います。',
                        },
                    ]}
                />

                <PortfolioLpFeatureGrid
                    eyebrow="What It Does"
                    title="何を検出する候補か"
                    description="YouTube Shorts から、真似して投稿されやすそうなダンス、音源、振付、投稿パターンの候補を探します。"
                    features={featureItems}
                />

                <Section eyebrow="App Setup" title="アプリ名と初期対象">
                    <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
                        <CompactCard title="名称・外部サービス設定案">
                            <TableBlock rows={appMetadata} />
                        </CompactCard>
                        <CompactCard title="対象地域の役割">
                            <TableBlock rows={regionRoles} />
                        </CompactCard>
                    </div>
                </Section>

                <Section eyebrow="Signals" title="見る指標と初期キーワード">
                    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                        <CompactCard title="初期指標">
                            <PillList items={metrics} />
                        </CompactCard>
                        <CompactCard title="検索キーワード">
                            <TableBlock rows={initialKeywords} />
                        </CompactCard>
                    </div>
                </Section>

                <PortfolioLpTechSection
                    eyebrow="Behind The Scenes"
                    title="YouTube API と snapshot 設計"
                    description="search.list は候補発見、videos.list は保存済み video_id の statistics 更新に限定します。このアイデアボード自体はAPI通信やDB保存を行いません。"
                    items={techItems}
                    layers={architectureLayers}
                />

                <Section eyebrow="Flow" title="取得・分析フロー">
                    <div className="grid gap-5 xl:grid-cols-2">
                        <CompactCard title="YouTube 取得・分析フロー">
                            <MermaidDiagram
                                chart={acquisitionFlowChart}
                                title="Dance Shorts Radar 取得・分析フロー"
                                className="mt-2 [&>button_svg]:mx-auto [&>button_svg]:block [&>button_svg]:!h-auto [&>button_svg]:!w-full"
                                expandable
                            />
                        </CompactCard>
                        <CompactCard title="Laravel レイヤー構成">
                            <MermaidDiagram
                                chart={laravelLayerChart}
                                title="Laravel レイヤー構成"
                                className="mt-2 [&>button_svg]:mx-auto [&>button_svg]:block [&>button_svg]:!h-auto [&>button_svg]:!w-full"
                                expandable
                            />
                        </CompactCard>
                    </div>
                </Section>

                <Section eyebrow="Storage" title="保存方針と追跡制限">
                    <div className="grid gap-5 lg:grid-cols-3">
                        <CompactCard title="初期テーブル">
                            <PillList items={initialTables} />
                        </CompactCard>
                        <CompactCard title="保存方針">
                            動画本体は youtube_videos、定期取得ごとの数値は
                            youtube_video_snapshots に分けます。trend score は
                            snapshot 差分を元に後続で保存します。
                        </CompactCard>
                        <CompactCard title="保存件数制限">
                            search.list は 1キーワード × 1地域あたり最大25件。
                            同一 video_id は重複保存せず、通常候補30日、
                            急上昇候補90日の追跡から始めます。
                        </CompactCard>
                    </div>
                </Section>

                <Section eyebrow="Implementation" title="初期実装と次の実装">
                    <div className="grid gap-5 lg:grid-cols-2">
                        <CompactCard title="最初に作るもの">
                            <PillList items={firstScope} />
                        </CompactCard>
                        <CompactCard title="API疎通後に進めるもの">
                            <PillList items={nextScope} />
                        </CompactCard>
                    </div>
                    <div className="mt-5">
                        <CompactCard title="初期Command案">
                            <div className="grid gap-2 font-mono text-xs leading-6 text-cyan-50">
                                {commands.map((command) => (
                                    <p key={command}>{command}</p>
                                ))}
                            </div>
                        </CompactCard>
                    </div>
                </Section>

                <PortfolioLpTestSection
                    eyebrow="Testing"
                    title="後続実装でテスト固定したいこと"
                    description="外部API、時系列snapshot、差分計算、画面文言が絡むため、API境界とスコア算出の仕様を小さく固定してから広げます。"
                    tests={testItems}
                    note="最初の成功条件は、youtube:fetch-dance-candidates --region=JP で search.list の候補取得、video_id 取得、videos.list の statistics 取得、CLIログ確認まで通ることです。"
                />

                <Section eyebrow="UI Tone" title="断定しない表現ルール">
                    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                        <CompactCard title="文言ルール">
                            <TableBlock rows={expressionRules} />
                        </CompactCard>
                        <CompactCard title="初期実装でやらないこと">
                            <PillList items={notDoing} />
                        </CompactCard>
                    </div>
                </Section>

                <PortfolioLpFeatureGrid
                    eyebrow="Portfolio Value"
                    title="ポートフォリオとして見せる価値"
                    description="外部API連携だけではなく、quota、snapshot、差分計算、責務分離、分析UIの表現まで設計対象にする構想です。"
                    features={portfolioValues}
                />
            </article>
        </PublicLayout>
    );
}
