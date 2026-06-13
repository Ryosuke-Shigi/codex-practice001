/**
 * Japan Quake Wave Map の idea-board / 紹介LP Page Component です。
 *
 * XML取得、map pin 同期、保存済み pin 表示は QuakeWave Preview 側へ分け、このページは機能紹介だけを扱います。
 */
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
 * このページは Japan Quake Wave Map の紹介LPであり、地震情報の同期・解析・保存を実行しません。
 * 本体機能は /quakewave-preview/map や /quakewave-preview/xml 側に残し、ここでは初見の人に
 * 「何を作ったか」「外部XMLをどう扱っているか」「失敗条件をどうテストしているか」を伝えることに限定します。
 *
 * 防災情報としての正確性や速報性を保証するページに見えないよう、注意書きはテストセクションの note で
 * 明示します。LPの表示データはページ内定数に閉じ、外部APIやDBの状態に影響されない入口にしています。
 */
const featureItems = [
    {
        title: '気象庁 Atom feed 取得',
        description:
            '地震情報のフィードを取得し、個別XMLへ進むための入口を保存します。',
        label: 'Feed',
    },
    {
        title: '個別XML取得',
        description:
            'feed entryから詳細XMLを読み、地震ごとの情報抽出へつなげます。',
        label: 'XML',
    },
    {
        title: '地震情報抽出',
        description:
            '発生時刻、震源、規模、震度など、地図表示に必要な情報を整理します。',
        label: 'Parse',
    },
    {
        title: '地図上にpin表示',
        description:
            '座標と震度を持つ地震情報を、Japan Quake Wave Map上で確認できます。',
        label: 'Map',
    },
    {
        title: '日付範囲・件数・震度フィルタ',
        description:
            '見たい範囲の地震情報へ絞り込み、地図上の情報量を調整できます。',
        label: 'Filter',
    },
    {
        title: '同期状態の確認',
        description:
            'feed同期とmap pin同期の状態をAPI経由で確認できるようにしています。',
        label: 'Status',
    },
];

const techItems = [
    {
        title: 'feed entry 保存',
        description:
            '取得したAtom feedのentryを保存し、詳細XML取得や再実行時の重複防止に使います。',
    },
    {
        title: 'map pin 生成',
        description:
            '地図表示に必要な座標、震度、時刻、震源情報をpin用データへ変換します。',
    },
    {
        title: '座標なし・震度なしデータの除外',
        description:
            '地図上で意味を持つpinだけを生成し、表示対象の品質を保ちます。',
    },
    {
        title: '部分失敗状態の管理',
        description:
            '一部XMLの取得や解析に失敗しても、全体の同期結果として状態を追えるようにします。',
    },
    {
        title: 'Queue / status API',
        description:
            '同期処理と画面表示を分離し、処理中や完了状態を画面から確認できる構成です。',
    },
    {
        title: 'Job / Responder分離',
        description:
            '非同期処理の実行責務と、Inertia / JSON向けの出力整形責務を混ぜないようにしています。',
    },
];

const architectureLayers = [
    /*
     * 地震マップは feed取得、XML解析、pin生成、status API など責務が増えやすい機能です。
     * そのためLP内でも、どのレイヤーが何を担当するのかを短く示して、
     * ControllerやComponentへ同期判断が漏れていないことを説明できるようにします。
     */
    {
        name: 'Controller',
        role: '地図表示、XML確認、同期開始、status APIのHTTP入口を担当します。',
    },
    {
        name: 'Action / Job',
        role: 'feed同期、pin同期、地図更新のユースケース進行を担当します。',
    },
    {
        name: 'Service',
        role: 'XML解析、entry抽出、pin生成条件などの判断を扱います。',
    },
    {
        name: 'Repository',
        role: 'feed entry、sync run、map pinの保存と取得を担当します。',
    },
    {
        name: 'DTO / ListDTO',
        role: '抽出結果、pin一覧、同期結果をデータキャリアとして運びます。',
    },
    {
        name: 'Responder / Component',
        role: '地図表示に必要なprops整形とReact表示を分けます。',
    },
];

const testItems = [
    {
        title: 'feed取得',
        description:
            'Atom feedの取得結果を保存し、次のXML取得へ進めることを確認します。',
    },
    {
        title: 'XML解析',
        description:
            '地震情報として必要な時刻、震源、震度、座標などを抽出できることを守ります。',
    },
    {
        title: 'pin生成条件',
        description:
            '座標なし、震度なしなど、地図表示に不向きなデータを除外する条件を固定します。',
    },
    {
        title: '重複防止',
        description:
            '同じentryやpinを再同期で増やさないことをRepositoryやFeatureテストで確認します。',
    },
    {
        title: '部分失敗',
        description:
            '一部のXML取得や解析に失敗しても、同期結果として追跡できることを確認します。',
    },
    {
        title: 'Request validation',
        description:
            '日付範囲、件数、震度フィルタの入力形式が壊れないことを固定します。',
    },
    {
        title: 'status API',
        description:
            'feed同期とmap pin同期の最新状態を、画面が期待する形式で返すことを守ります。',
    },
];

const portfolioValues = [
    {
        title: '地図で直感的に分かる',
        description:
            'XMLデータを読むだけでなく、震源と震度を地図上に置くことで初見でも理解しやすくします。',
    },
    {
        title: '失敗を前提に設計している',
        description:
            '外部XML取得や解析の部分失敗を扱い、同期処理の現実的な難しさを見せます。',
    },
    {
        title: 'レイヤード構成を説明できる',
        description:
            'XML取得、解析、保存、pin生成、表示整形を分けて、責務境界を説明しやすくしています。',
    },
];

const links: PortfolioLpLink[] = [
    /*
     * 地図表示とXML確認は、同じQuakeWave Preview配下でも見る観点が異なります。
     * LPから両方へ分けて誘導することで、可視化結果と元データ確認を初見でも切り替えやすくします。
     */
    {
        href: '/quakewave-preview/map',
        label: '地図表示を開く',
        description: '/quakewave-preview/map',
        variant: 'primary',
    },
    {
        href: '/quakewave-preview/xml',
        label: 'XML確認を見る',
        description: '/quakewave-preview/xml',
    },
    {
        href: '/quakewave-preview',
        label: 'Preview入口へ',
        description: 'モック、XML、同期確認',
    },
];

export default function QuakeWaveMapPp() {
    return (
        <PublicLayout className="bg-slate-950/45 px-4 py-5 sm:px-6 lg:px-8">
            <Head title="Japan Quake Wave Map" />

            <article className="mx-auto flex min-h-screen min-w-0 w-[calc(100vw-2rem)] max-w-7xl flex-col gap-2 break-words pb-10 [overflow-wrap:anywhere] sm:w-[calc(100vw-3rem)] lg:w-full">
                <PortfolioLpHero
                    eyebrow="Idea Board"
                    title="Japan Quake Wave Map"
                    lead="気象庁XMLを取得・解析し、地震情報を地図上に可視化するポートフォリオ機能"
                    description="Atom feedから個別XMLを取得し、地図表示に必要な地震情報を抽出してpinとして可視化します。紹介ページでは、外部データ同期、部分失敗、pin生成条件、表示導線の全体像を短く見せます。"
                    status="完成済み"
                    keywords={[
                        'JMA XML',
                        'Map Pins',
                        'Queue',
                        'Job',
                        'DTO',
                    ]}
                    metrics={[
                        {
                            label: 'Scope',
                            value: 'XML + Map',
                            description:
                                'feed取得から地図pin表示までを一つの流れで確認できます。',
                        },
                        {
                            label: 'Backend',
                            value: 'Async Sync',
                            description:
                                'Job、Service、Repositoryで同期と保存責務を分けています。',
                        },
                        {
                            label: 'Testing',
                            value: 'Failure Aware',
                            description:
                                'XML解析、pin生成条件、重複防止、部分失敗をテストで守ります。',
                        },
                    ]}
                >
                    <PortfolioLpLinkButtons links={links} />
                </PortfolioLpHero>

                <PortfolioLpFeatureGrid
                    eyebrow="What It Does"
                    title="何ができるか"
                    description="気象庁XMLを取得して終わりではなく、地図上で見える形にするまでをポートフォリオとして説明します。"
                    features={featureItems}
                />

                <PortfolioLpTechSection
                    eyebrow="Behind The Scenes"
                    title="裏側でやっていること"
                    description="本番機能側では、外部XML取得、解析、保存、pin生成、同期状態の整形を分離しています。このLP自体は静的な紹介ページで、XML取得や同期処理は行いません。"
                    items={techItems}
                    layers={architectureLayers}
                />

                <PortfolioLpTestSection
                    eyebrow="Testing"
                    title="テストで守っていること"
                    description="Japan Quake Wave Mapは外部XMLの揺らぎ、座標や震度の欠落、非同期処理が絡むため、失敗しやすい条件をテストで固定しています。"
                    tests={testItems}
                    note="このページおよび本機能はポートフォリオ用途の表示です。防災情報として正確性・速報性を保証するものではありません。"
                />

                <PortfolioLpFeatureGrid
                    eyebrow="Portfolio Value"
                    title="ADR / テスト / AI駆動開発の価値"
                    description="外部データを扱う機能ほど、AIに実装を任せる前に責務境界、失敗条件、テスト観点を整理する価値が見えます。"
                    features={portfolioValues}
                />

                <div className="flex justify-center pt-4">
                    <PortfolioLpLinkButtons links={links.slice(0, 2)} />
                </div>
            </article>
        </PublicLayout>
    );
}
