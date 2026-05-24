import { Head } from '@inertiajs/react';

import PortfolioLpFeatureGrid from '@/Components/Lab/PortfolioLpFeatureGrid';
import PortfolioLpHero from '@/Components/Lab/PortfolioLpHero';
import PortfolioLpLinkButtons, {
    type PortfolioLpLink,
} from '@/Components/Lab/PortfolioLpLinkButtons';
import PortfolioLpTechSection from '@/Components/Lab/PortfolioLpTechSection';
import PortfolioLpTestSection from '@/Components/Lab/PortfolioLpTestSection';
import PublicLayout from '@/Layouts/PublicLayout';

/*
 * このページは API Discovery Hub 本体の仕様詳細ページではなく、ポートフォリオ用の紹介LPです。
 * 本体画面のDBキャッシュ取得、同期開始、メモ保存、status API polling は既存ページへ残し、
 * ここでは「何ができるか」「裏側で何を分けているか」「何をテストで守っているか」を静的に説明します。
 *
 * 表示データをページ内定数に置く理由は、LPが外部APIやRepositoryへ依存しないことを明確にするためです。
 * 将来CMS化やDB管理へ寄せるまでは、紹介文の変更だけで本体機能へ影響しない構成を優先します。
 */
const featureItems = [
    {
        title: 'APIs.guru からAPIカタログ取得',
        description:
            '公開APIの一覧を取得し、調査対象を探し始められる入口にしています。',
        label: 'Collect',
    },
    {
        title: 'DBキャッシュ',
        description:
            '外部APIレスポンスを毎回直接読むのではなく、保存済みカタログから一覧を表示します。',
        label: 'Cache',
    },
    {
        title: '検索・絞り込み',
        description:
            'API名、提供元、説明文、カテゴリなどから、見たいAPIへ短時間で絞り込めます。',
        label: 'Search',
    },
    {
        title: '詳細表示',
        description:
            '一覧からAPIの説明、バージョン、リンク、関連情報を確認できる画面へ進めます。',
        label: 'Detail',
    },
    {
        title: 'メモ保存',
        description:
            '調査中に気づいた用途、採用候補、確認事項をAPIごとに残せます。',
        label: 'Note',
    },
    {
        title: '検索補助リンク',
        description:
            'Google、GitHub、Docs、Sample検索へつなげ、調査の次の行動を短くします。',
        label: 'Assist',
    },
];

const techItems = [
    {
        title: 'payload_hash による差分判定',
        description:
            '取得済みデータと新規レスポンスを比較し、同じ内容は無駄に更新しない設計です。',
    },
    {
        title: 'insert / update / skip',
        description:
            '同期結果を新規、更新、スキップに分け、処理結果をレビューしやすくしています。',
    },
    {
        title: 'Queue / Scheduler',
        description:
            '同期処理をHTTP表示から分離し、時間のかかる取得をバックグラウンドで扱います。',
    },
    {
        title: 'status API',
        description:
            '同期の進行状態を画面から確認できるよう、表示と実処理を疎結合にしています。',
    },
    {
        title: 'ResponderでInertia propsを整形',
        description:
            'DB取得結果やDTOを、Reactが過剰に変換しなくてよい形へ寄せています。',
    },
    {
        title: 'AI駆動開発の固定点',
        description:
            '仕様、責務境界、テスト観点を先に置き、AIの実装支援をレビュー可能な差分にしています。',
    },
];

const architectureLayers = [
    /*
     * ここでの layer は実装を呼ぶための情報ではなく、面接・レビュー時に責務境界を説明するための文言です。
     * DTO / Repository / Service の役割が混ざっていないことを、LP上でも短く確認できるようにします。
     */
    {
        name: 'Controller',
        role: 'HTTP入口に限定し、一覧表示やメモ保存のユースケースへ渡します。',
    },
    {
        name: 'Action',
        role: '取得、同期、メモ操作などの手順をまとめます。',
    },
    {
        name: 'Service',
        role: '差分判定、同期結果の分類など、業務上の判断を担当します。',
    },
    {
        name: 'Repository',
        role: 'APIカタログキャッシュとメモの永続化を担当します。',
    },
    {
        name: 'DTO / ListDTO',
        role: '一覧、詳細、同期結果、ステータスをレイヤー間のデータとして運びます。',
    },
    {
        name: 'Responder / Component',
        role: 'Inertia propsへの整形とReact表示を分けて、画面責務を保ちます。',
    },
];

const testItems = [
    {
        title: '同期判定',
        description:
            'payload_hashの差分でinsert / update / skipが崩れないことを確認します。',
    },
    {
        title: '検索条件',
        description:
            'キーワード、提供元、カテゴリなどの絞り込み条件が期待通り効くことを固定します。',
    },
    {
        title: 'メモCRUD',
        description:
            '作成、更新、削除の保存結果と、対象APIへの紐づきが壊れないことを確認します。',
    },
    {
        title: 'Inertia props',
        description:
            '一覧や詳細画面へ渡すデータ形状を固定し、React側の期待を守ります。',
    },
    {
        title: 'status API',
        description:
            '同期状態のレスポンス形式と最新実行の見え方をFeatureテストで守ります。',
    },
];

const portfolioValues = [
    {
        title: '初見でも目的が分かる',
        description:
            '公開APIを探し、調べ、保存し、後で見返すという一連の価値を短く説明します。',
    },
    {
        title: '設計境界を説明できる',
        description:
            'DTO、Repository、Service、Action、Responderの分離を、機能の裏側として見せます。',
    },
    {
        title: '面接で話しやすい',
        description:
            '完成画面への導線と、なぜその設計にしたかを同じページで確認できます。',
    },
];

const links: PortfolioLpLink[] = [
    /*
     * 本体機能への導線はLP内で明示します。
     * 一覧・モック・API Previewを分けることで、「実データ確認」「UI確認」「外部API疎通確認」を
     * 初見の人が迷わず選べるようにしています。
     */
    {
        href: '/api-catalog',
        label: '本番一覧を開く',
        description: '/api-catalog',
        variant: 'primary',
    },
    {
        href: '/api-catalog/mock',
        label: 'モック一覧を見る',
        description: '/api-catalog/mock',
    },
    {
        href: '/api-preview',
        label: 'API Previewへ',
        description: '外部API疎通確認の入口',
    },
];

export default function ApiDiscoveryHubPp() {
    return (
        <PublicLayout className="bg-slate-950/45 px-4 py-5 sm:px-6 lg:px-8">
            <Head title="API Discovery Hub" />

            {/*
                article幅はモバイルで viewport から左右padding分を引いた値にします。
                長い日本語説明や英語キーワードがあるLPなので、画面幅を超えて横スクロールが出ないよう
                ページルートでも min-w-0 と overflow-wrap を指定しています。
            */}
            <article className="mx-auto flex min-h-screen min-w-0 w-[calc(100vw-2rem)] max-w-7xl flex-col gap-2 break-words pb-10 [overflow-wrap:anywhere] sm:w-[calc(100vw-3rem)] lg:w-full">
                <PortfolioLpHero
                    eyebrow="Portfolio Presentation"
                    title="API Discovery Hub"
                    lead="公開APIカタログを取得・検索・保存・調査できるポートフォリオ機能"
                    description="APIs.guruの公開API一覧を起点に、API調査を一覧、詳細、メモ、検索補助までつなげる機能です。紹介ページでは仕様詳細よりも、初見の人が短時間で何を作ったかを理解できることを優先します。"
                    status="完成済み"
                    keywords={[
                        'API Catalog',
                        'DB Cache',
                        'Queue',
                        'DTO',
                        'Responder',
                    ]}
                    metrics={[
                        {
                            label: 'Scope',
                            value: 'Search + Notes',
                            description:
                                'API調査の入口から保存メモまでを一つの流れにしています。',
                        },
                        {
                            label: 'Backend',
                            value: 'Layered',
                            description:
                                'Controller、Action、Service、Repository、DTO、Responderで責務を分けます。',
                        },
                        {
                            label: 'Testing',
                            value: 'Feature + Unit',
                            description:
                                '同期判定、検索、メモ、Inertia props、status APIをテストで守ります。',
                        },
                    ]}
                >
                    <PortfolioLpLinkButtons links={links} />
                </PortfolioLpHero>

                <PortfolioLpFeatureGrid
                    eyebrow="What It Does"
                    title="何ができるか"
                    description="実装済み機能の見どころを、ポートフォリオ紹介として短く読める粒度でまとめます。"
                    features={featureItems}
                />

                <PortfolioLpTechSection
                    eyebrow="Behind The Scenes"
                    title="裏側でやっていること"
                    description="本番機能側では、外部API取得、DBキャッシュ、差分同期、表示整形をそれぞれの責務に分けています。このLP自体は静的な紹介ページで、同期やDB取得は行いません。"
                    items={techItems}
                    layers={architectureLayers}
                />

                <PortfolioLpTestSection
                    eyebrow="Testing"
                    title="テストで守っていること"
                    description="API Discovery Hubは外部API、DB、メモ保存、Inertia表示が絡むため、壊れやすい境界をLaravel側のテストで固定しています。"
                    tests={testItems}
                />

                <PortfolioLpFeatureGrid
                    eyebrow="Portfolio Value"
                    title="ADR / テスト / AI駆動開発の価値"
                    description="単なるAPI一覧ではなく、責務分離とテストを通して、AIに実装を頼む前に人間が設計境界を決める開発姿勢を見せるページです。"
                    features={portfolioValues}
                />

                <div className="flex justify-center pt-4">
                    <PortfolioLpLinkButtons links={links.slice(0, 2)} />
                </div>
            </article>
        </PublicLayout>
    );
}
