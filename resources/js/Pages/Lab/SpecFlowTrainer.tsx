/**
 * Spec Flow Trainer の idea-board Page Component です。
 *
 * 実保存やエディタ機能は持たせず、構想と画面イメージを静的に説明する入口です。
 */
import type { ReactNode } from 'react';
import type { EChartsOption } from 'echarts';

import { Head, Link } from '@inertiajs/react';

import EChartsViewer from '@/Components/Common/Visualizations/Charts/EChartsViewer';
import MermaidDiagram from '@/Components/Common/Visualizations/Diagrams/MermaidDiagram';
import PublicLayout from '@/Layouts/PublicLayout';

/*
 * このページは SpecFlowTrainer 本体の CRUD ではなく、アイデアボード用の構想紹介です。
 * そのため、DB スキーマ候補や Mermaid / React Flow の話も「将来の設計方針」として静的に表示します。
 * 実データ取得や保存責務を混ぜないよう、表示用の文言配列をこのページ内に閉じています。
 */
const heroKeywords = [
    '仕様',
    'DTO',
    'ListDTO',
    'ADR',
    'TDD',
    'AI指示',
    '人間レビュー',
];

// 「作る前に毎回通る確認項目」をカード化するための表示データです。
const designChecks = [
    '仕様があるか',
    '入力・出力が整理されているか',
    'DTO / ListDTO が決まっているか',
    'ADR責務が分かれているか',
    'テスト観点があるか',
    'AIエージェントへの指示が作れるか',
    '人間レビューの観点があるか',
];

/*
 * 仕様から実装依頼までを一本道で見せるためのステップです。
 * ここでは実際の進行管理や状態保存は行わず、LP内の説明用フローとして扱います。
 */
const workflowSteps = [
    '仕様を書く',
    '入力・出力を整理',
    'DTOを作る',
    'ListDTOを作る',
    'ADR責務を割り当てる',
    'テスト観点を作る',
    'GPT相談用テキストを生成',
    'CodexApp / AIエージェントへ指示',
    '生成物を人間がレビュー',
    '完了',
];

/*
 * DTO / ListDTO はこの構想の中核なので、例示データとレイヤー間フローを分けて持ちます。
 * 実装時は DTO 定義や edges を DB に保存する想定ですが、このアイデアボードでは静的な見本だけを表示します。
 */
const dtoFields = ['API名', 'Provider', 'メモ本文', '保存日時'];
const listDtoFields = ['SavedApiDTO[]', 'totalCount', 'currentPage'];
const dtoFlow = [
    'Repository',
    'SavedApiDTO',
    'SavedApiListDTO',
    'Responder',
    '画面用Props / JSON',
    'React Component',
];

// ListDTO からフロントエンドの表示単位へ読み替える観点です。
const frontendPoints = [
    '1件DTO = 1カード',
    'ListDTO = カード一覧',
    'ページ情報 = Pagination',
    '検索条件 = Filter UI',
    'DTO項目 = Props設計',
];

/*
 * ADR / レイヤード責務マップは、既存プロジェクトの責務分離方針に合わせた説明にします。
 * Controller や Repository に表示判断を混ぜない、というレビュー観点につながるようにしています。
 */
const responsibilityMap = [
    ['Controller', 'HTTP入口'],
    ['Request', '入力形式バリデーション'],
    ['Action', 'ユースケース進行'],
    ['Service', '業務判断'],
    ['Repository', 'DB操作'],
    ['DTO / ListDTO', 'レイヤー間のデータ契約'],
    ['Responder', '画面用データ整形'],
    ['React Component', '画面表示'],
];

const responsibilityChecks = [
    'Repositoryに表示整形を置かない',
    'ServiceにHTTPレスポンスを置かない',
    'Responderに業務判断を置かない',
    'DTO / ListDTO はデータ保持と配列変換に徹する',
];

// テスト種別ごとの確認対象を短く並べ、TDD を「仕様確認の通過点」として見せます。
const testViewpoints = [
    ['Feature Test', 'Action全体 / HTTP経由 / DB保存'],
    ['Unit Test', 'Service判断 / Factory / Strategy'],
    ['DB Assertion', '保存された値 / 不要保存なし'],
    ['Mock', '外部API / Repository境界'],
    ['DTO Test', 'DTO / ListDTO の値'],
];

// AI エージェント実行後も、人間レビューが完了条件であることを見せるチェックリストです。
const agentChecklist = [
    '仕様作成済み',
    '責務分離確認済み',
    'DTO設計済み',
    'ListDTO設計済み',
    'テスト観点作成済み',
    'テスト確認済み',
    '実装確認済み',
    'テスト通過確認済み',
    'レビュー完了',
];

/*
 * GPT / CodexApp に渡す相談文の順序を固定するためのテンプレートです。
 * ページ内では生成機能を実装せず、将来の出力イメージとして表示します。
 */
const promptTemplate = [
    'プロジェクト：',
    'ユースケース：',
    '現在のステップ：',
    '仕様：',
    '入力 / 出力：',
    'DTO / ListDTO：',
    'ADR責務：',
    'テスト観点：',
    '確認してほしいこと：',
];

const promptPatterns = [
    '仕様レビュー依頼',
    'DTO / ListDTOレビュー依頼',
    'ADR責務分離レビュー依頼',
    'テスト観点レビュー依頼',
    'CodexApp実装指示',
    '作業完了報告',
];

// MVP と後回しを分け、構想ページだけで本体機能まで実装したように見せないための表示データです。
const mvpScope = [
    'プロジェクト作成',
    'ユースケース作成',
    '入力・出力項目表',
    'DTO作成',
    'ListDTO作成',
    'ADR責務マップ',
    'テスト観点',
    'AI指示文生成',
    'Mermaid自動生成',
    'GPT相談用まとめ生成',
];

const deferredScope = [
    'React Flow本格編集',
    'ドラッグ操作',
    'PNG出力',
    'SVG出力',
    '複雑な自動配置',
];

const toolValues = [
    '仕様を忘れない',
    '責務分離を崩さない',
    'DTO / ListDTO を先に決める',
    'テスト観点を抜かさない',
    'AI指示を毎回整えられる',
    'GPT相談文を定型化できる',
    '人間レビューを通過点にできる',
];

const portfolioValues = [
    '仕様駆動開発の実践',
    'ADR / レイヤードの責務設計',
    'TDDの通過点管理',
    'AIエージェント運用の具体化',
    'バックエンドとフロントエンドの接続設計',
    '開発プロセスそのもののツール化',
];

const specDrivenDevelopmentFlowChart = `flowchart TD
    spec["仕様を作る"] --> split["責務を分ける"]
    split --> dto["DTO / ListDTO を決める"]
    dto --> test["テスト観点を作る"]
    test --> agent["AIエージェントへ指示する"]
    agent --> review["生成コードをレビューする"]
    review --> verify["テストで確認する"]
`;

const adrResponsibilityMapChart = `flowchart TD
    controller["Controller"] --> request["Request"]
    request --> action["Action"]
    action --> service["Service"]
    service --> repository["Repository"]
    repository --> dto["DTO / ListDTO"]
    dto --> responder["Responder"]
    responder --> component["React Component"]
`;

const branchingDesignChart = `flowchart TD
    spec["仕様を作る"] --> pattern["処理パターンが複数あるか確認する"]
    pattern --> enum["Enumで選択肢を定義する"]
    enum --> service["Serviceが業務判断を行う"]
    service --> factory["FactoryがEnumから実装を選ぶ"]
    factory --> strategy["Strategyが処理差分を実行する"]
    strategy --> responder["Responderが出力差分を整形する"]
`;

const branchingDesignChecks = [
    'Controller / Action に match 分岐を散らさない',
    '分岐責務は Factory に集約する',
    'Repository の Interface 解決は ServiceProvider 側の責務として別に扱う',
];

const designElementCounts = [
    ['DTO', 4],
    ['ListDTO', 2],
    ['Service', 3],
    ['Repository', 2],
    ['Action', 4],
    ['Responder', 2],
    ['Factory', 2],
    ['Strategy', 3],
    ['Test', 8],
] as const;

const designElementChartOption: EChartsOption = {
    backgroundColor: 'transparent',
    color: ['#67e8f9'],
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow',
        },
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        borderColor: 'rgba(103, 232, 249, 0.35)',
        textStyle: {
            color: '#f8fafc',
        },
    },
    grid: {
        left: 112,
        right: 32,
        top: 28,
        bottom: 28,
    },
    xAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: {
            lineStyle: {
                color: 'rgba(226, 232, 240, 0.12)',
            },
        },
        axisLabel: {
            color: '#cbd5e1',
        },
    },
    yAxis: {
        type: 'category',
        inverse: true,
        data: designElementCounts.map(([label]) => label),
        axisLabel: {
            color: '#e2e8f0',
            fontWeight: 700,
        },
        axisTick: {
            show: false,
        },
        axisLine: {
            lineStyle: {
                color: 'rgba(226, 232, 240, 0.24)',
            },
        },
    },
    series: [
        {
            name: '定義数',
            type: 'bar',
            barMaxWidth: 18,
            data: designElementCounts.map(([, value]) => value),
            label: {
                show: true,
                position: 'right',
                color: '#cffafe',
                fontWeight: 700,
            },
            itemStyle: {
                borderRadius: [0, 8, 8, 0],
            },
        },
    ],
};

const agentInstructionProgress = [
    ['仕様整理', 100],
    ['責務分離', 100],
    ['DTO設計', 88],
    ['テスト観点', 82],
    ['実装指示', 72],
    ['生成コード確認', 54],
    ['テスト確認', 38],
    ['レビュー完了', 24],
] as const;

const agentInstructionProgressChartOption: EChartsOption = {
    backgroundColor: 'transparent',
    color: ['#34d399'],
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow',
        },
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        borderColor: 'rgba(110, 231, 183, 0.35)',
        textStyle: {
            color: '#f8fafc',
        },
    },
    grid: {
        left: 120,
        right: 44,
        top: 28,
        bottom: 28,
    },
    xAxis: {
        type: 'value',
        max: 100,
        axisLabel: {
            color: '#cbd5e1',
            formatter: '{value}%',
        },
        splitLine: {
            lineStyle: {
                color: 'rgba(226, 232, 240, 0.12)',
            },
        },
    },
    yAxis: {
        type: 'category',
        inverse: true,
        data: agentInstructionProgress.map(([label]) => label),
        axisLabel: {
            color: '#e2e8f0',
            fontWeight: 700,
        },
        axisTick: {
            show: false,
        },
        axisLine: {
            lineStyle: {
                color: 'rgba(226, 232, 240, 0.24)',
            },
        },
    },
    series: [
        {
            name: '人間確認ベースの進捗',
            type: 'bar',
            barMaxWidth: 18,
            showBackground: true,
            backgroundStyle: {
                color: 'rgba(255, 255, 255, 0.08)',
                borderRadius: [0, 8, 8, 0],
            },
            data: agentInstructionProgress.map(([, value]) => value),
            label: {
                show: true,
                position: 'right',
                formatter: '{c}%',
                color: '#d1fae5',
                fontWeight: 700,
            },
            itemStyle: {
                borderRadius: [0, 8, 8, 0],
            },
        },
    ],
};

type SectionProps = {
    eyebrow: string;
    title: string;
    children: ReactNode;
};

/*
 * アイデアボード内の各ブロックを同じ見た目にそろえるための小さな表示コンポーネントです。
 * このページ専用なので共通 Components へ切り出さず、不要な抽象化を避けています。
 */
function Section({ eyebrow, title, children }: SectionProps) {
    return (
        <section className="min-w-0 rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                {eyebrow}
            </p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-white">
                {title}
            </h2>
            <div className="mt-5 min-w-0">{children}</div>
        </section>
    );
}

// タグは短いキーワードを折り返して表示し、スマホ幅でも横にはみ出さないことを優先します。
function TagList({ items }: { items: string[] }) {
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item) => (
                <span
                    key={item}
                    className="rounded-md border border-cyan-100/30 bg-cyan-100/12 px-2.5 py-1 text-xs font-semibold text-cyan-50"
                >
                    {item}
                </span>
            ))}
        </div>
    );
}

// チェック項目はモバイルでは1列、sm以上で2列にし、読む順番を崩さないようにします。
function CheckList({ items }: { items: string[] }) {
    return (
        <ul className="grid min-w-0 gap-2 sm:grid-cols-2">
            {items.map((item) => (
                <li
                    key={item}
                    className="flex min-w-0 items-start gap-3 rounded-lg border border-white/12 bg-white/8 p-3 text-sm leading-6 text-slate-100/88"
                >
                    <span className="mt-1 h-3 w-3 rounded-sm border border-cyan-100/70 bg-cyan-100/18" />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

/*
 * ワークフローはモバイルでは縦積みと下向き矢印で読ませます。
 * md以上ではグリッド化するため、矢印はモバイルだけに出して情報量を抑えます。
 */
function FlowList({ items }: { items: string[] }) {
    return (
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {items.map((item, index) => (
                <li key={item} className="flex min-w-0 flex-col gap-2">
                    <article className="h-full rounded-lg border border-cyan-100/25 bg-cyan-100/10 p-4 text-cyan-50">
                        <p className="text-xs font-semibold text-cyan-100/70">
                            Step {String(index + 1).padStart(2, '0')}
                        </p>
                        <h3 className="mt-2 text-sm font-semibold leading-6">
                            {item}
                        </h3>
                    </article>
                    {index < items.length - 1 && (
                        <p className="text-center text-lg font-bold text-cyan-100/80 md:hidden">
                            ↓
                        </p>
                    )}
                </li>
            ))}
        </ol>
    );
}

// 個別説明の枠です。Section と同じく、この LP 内だけで使うためページ内に閉じています。
function CompactCard({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <article className="min-w-0 overflow-hidden rounded-lg border border-white/14 bg-white/8 p-4 text-white">
            <h3 className="font-semibold">{title}</h3>
            <div className="mt-3 min-w-0 text-sm leading-6 text-slate-200/78">
                {children}
            </div>
        </article>
    );
}

export default function SpecFlowTrainer() {
    return (
        <PublicLayout className="bg-slate-950/45 px-4 py-5 sm:px-6 lg:px-8">
            <Head title="SpecFlowTrainer" />

            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 pb-10">
                <nav aria-label="アイデアボードページの戻り導線">
                    <Link
                        href="/projects/spec-flow-trainer"
                        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/16 bg-white/10 px-4 text-sm font-semibold text-cyan-50 transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                    >
                        Project Hubへ戻る
                    </Link>
                </nav>

                {/*
                    Hero はモバイルを基準に縦積みで作り、lg以上だけ横並びにします。
                    アイデアボードページとしてまず「構想・設計中」であることを明示し、完成アプリに見えすぎないようにします。
                */}
                <header className="rounded-lg border border-white/20 bg-slate-950/62 p-5 shadow-[0_22px_54px_rgba(2,6,23,0.24)] backdrop-blur-2xl sm:p-7">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-4xl">
                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-md border border-cyan-100/35 bg-cyan-100/14 px-2.5 py-1 text-xs font-semibold text-cyan-50">
                                    アイデアボード
                                </span>
                                <span className="rounded-md border border-emerald-100/30 bg-emerald-100/12 px-2.5 py-1 text-xs font-semibold text-emerald-50">
                                    構想・設計中
                                </span>
                            </div>

                            <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-5xl">
                                SpecFlowTrainer
                            </h1>
                            <p className="mt-3 text-lg font-semibold text-cyan-100">
                                仕様駆動開発ワークフロー支援ツール
                            </p>
                            <p className="mt-4 max-w-4xl text-base leading-8 text-slate-100/88">
                                コードを書く前の設計を、仕様・DTO /
                                ListDTO・ADR責務・TDD・AIエージェント指示・人間レビューとして整理し、視覚化する。
                            </p>
                            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200/78">
                                主目的は、自分の開発補助ツールとして作ること。結果として、開発思想を説明できるポートフォリオにもなる。
                            </p>
                            <div className="mt-5">
                                <TagList items={heroKeywords} />
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px] lg:grid-cols-1">
                            <div className="rounded-lg border border-white/14 bg-white/8 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/70">
                                    Core Flow
                                </p>
                                <div className="mt-3 grid gap-2 text-sm font-semibold text-white">
                                    {['Spec', 'DTO', 'ADR', 'TDD', 'AI', 'Review'].map(
                                        (item, index) => (
                                            <div
                                                key={item}
                                                className="flex items-center gap-2"
                                            >
                                                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-cyan-100/30 bg-cyan-100/12 text-xs text-cyan-50">
                                                    {index + 1}
                                                </span>
                                                <span>{item}</span>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <Section
                    eyebrow="Why"
                    title="開発前の設計を、毎回通過できる形にする"
                >
                    <p className="max-w-4xl text-sm leading-7 text-slate-200/80">
                        AIエージェントにいきなり「作って」と投げるのではなく、人間が先に仕様、入力、出力、DTO
                        / ListDTO、責務分離、テスト観点を整理する。そのうえで、CodexAppやChatGPTへ渡す指示文を生成する。
                    </p>
                    <div className="mt-5">
                        <CheckList items={designChecks} />
                    </div>
                </Section>

                <Section
                    eyebrow="Workflow"
                    title="仕様からAI指示までを一つの流れにする"
                >
                    <FlowList items={workflowSteps} />
                </Section>

                <Section
                    eyebrow="Visual Prototype"
                    title="コードを書く前の通過点を図とグラフで見る"
                >
                    <div className="grid min-w-0 gap-5">
                        <CompactCard title="仕様駆動開発の全体フロー">
                            <p>
                                SpecFlowTrainerが、実装の前に仕様・責務・DTO・テスト・AI指示・レビューを通すための場所であることを固定する。
                            </p>
                            <MermaidDiagram
                                chart={specDrivenDevelopmentFlowChart}
                                title="仕様駆動開発の全体フロー"
                                className="mt-4 [&>button_svg]:mx-auto [&>button_svg]:block [&>button_svg]:!h-auto [&>button_svg]:!w-[min(100%,220px)]"
                                expandable
                            />
                        </CompactCard>

                        <CompactCard title="ADR責務マップ">
                            <p>
                                どの責務をどのレイヤーに置くかを、上から下へ読みやすい流れで確認する。
                            </p>
                            <MermaidDiagram
                                chart={adrResponsibilityMapChart}
                                title="ADR責務マップ"
                                className="mt-4 [&>button_svg]:mx-auto [&>button_svg]:block [&>button_svg]:!h-auto [&>button_svg]:!w-[min(100%,200px)]"
                                expandable
                            />
                            <div className="mt-4">
                                <CheckList items={responsibilityChecks} />
                            </div>
                        </CompactCard>

                        <CompactCard title="Enum / Factory / Strategy / Responder 分岐設計">
                            <p>
                                切り替え処理を Controller や Action に散らさず、選択と処理差分と出力差分を分けて見える化する。
                            </p>
                            <MermaidDiagram
                                chart={branchingDesignChart}
                                title="Enum / Factory / Strategy / Responder 分岐設計"
                                className="mt-4 [&>button_svg]:mx-auto [&>button_svg]:block [&>button_svg]:!h-auto [&>button_svg]:!w-[min(100%,220px)]"
                                expandable
                            />
                            <div className="mt-4">
                                <CheckList items={branchingDesignChecks} />
                            </div>
                        </CompactCard>

                        <div className="grid min-w-0 gap-5 xl:grid-cols-2">
                            <CompactCard title="DTO / ListDTO・テスト観点グラフ">
                                <p>
                                    仕様を作ったあと、どの設計要素がどれだけ定義されているかを静的サンプルで確認する。
                                </p>
                                <div className="mt-4 min-w-0 overflow-hidden rounded-lg border border-white/12 bg-slate-950/42 p-3">
                                    <EChartsViewer
                                        option={designElementChartOption}
                                        height={380}
                                        renderer="svg"
                                    />
                                </div>
                            </CompactCard>

                            <CompactCard title="AIエージェント指示ステップ進捗">
                                <p>
                                    AIが実行した時点ではなく、人間が確認した時点を完了として扱う考え方を進捗で見せる。
                                </p>
                                <div className="mt-4 min-w-0 overflow-hidden rounded-lg border border-white/12 bg-slate-950/42 p-3">
                                    <EChartsViewer
                                        option={agentInstructionProgressChartOption}
                                        height={380}
                                        renderer="svg"
                                    />
                                </div>
                            </CompactCard>
                        </div>
                    </div>
                </Section>

                <Section
                    eyebrow="DTO / ListDTO"
                    title="DTO / ListDTO を設計の中心に置く"
                >
                    <p className="max-w-4xl text-sm leading-7 text-slate-200/80">
                        このツールのキモは、DTO / ListDTO
                        を設計対象として作成し、視覚的に見えるようにすること。DTO /
                        ListDTO
                        は、バックエンド内部だけでなく、フロントエンドのProps設計、テスト観点、AI指示にもつながる。
                    </p>

                    <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.1fr_0.95fr]">
                        <CompactCard title="入力項目">
                            <ul className="grid gap-2">
                                <li>APIカタログID</li>
                                <li>メモ本文</li>
                            </ul>
                        </CompactCard>
                        <CompactCard title="DTO / ListDTO">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <p className="font-semibold text-cyan-50">
                                        SavedApiDTO
                                    </p>
                                    <ul className="mt-2 grid gap-1">
                                        {dtoFields.map((field) => (
                                            <li key={field}>- {field}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-semibold text-cyan-50">
                                        SavedApiListDTO
                                    </p>
                                    <ul className="mt-2 grid gap-1">
                                        {listDtoFields.map((field) => (
                                            <li key={field}>- {field}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </CompactCard>
                        <CompactCard title="出力">
                            <ul className="grid gap-2">
                                <li>Responder</li>
                                <li>画面用Props</li>
                                <li>React Component</li>
                            </ul>
                        </CompactCard>
                    </div>

                    {/*
                        レイヤー間の流れはスマホでは縦に読み、広い画面では横並びの簡易図にします。
                        Mermaid 自体はまだ生成しないため、React の静的なカード列で説明します。
                    */}
                    <div className="mt-5 grid gap-2 rounded-lg border border-cyan-100/20 bg-cyan-100/10 p-4 text-center text-sm font-semibold text-cyan-50 md:grid-cols-6 md:items-center">
                        {dtoFlow.map((item, index) => (
                            <div key={item} className="contents md:block">
                                <div className="rounded-lg border border-cyan-100/25 bg-slate-950/42 px-3 py-3">
                                    {item}
                                </div>
                                {index < dtoFlow.length - 1 && (
                                    <p className="text-lg text-cyan-100 md:hidden">
                                        ↓
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </Section>

                <Section
                    eyebrow="Frontend"
                    title="DTOを見ると、フロントの表示単位も見える"
                >
                    <p className="max-w-4xl text-sm leading-7 text-slate-200/80">
                        ListDTO
                        が見えることで、フロントエンド側は一覧コンポーネント、カードコンポーネント、ページネーション、フィルターUIの必要性を判断しやすくなる。
                    </p>
                    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
                        <CompactCard title="設計対応">
                            <div className="grid gap-2 text-cyan-50">
                                <p>SavedApiListDTO</p>
                                <p className="pl-5">└ SavedApiDTO[]</p>
                                <p className="pt-3">React:</p>
                                <p className="pl-5">SavedApiList</p>
                                <p className="pl-10">└ SavedApiCard × 件数分</p>
                            </div>
                        </CompactCard>
                        <CompactCard title="判断ポイント">
                            <ul className="grid gap-2">
                                {frontendPoints.map((point) => (
                                    <li key={point}>{point}</li>
                                ))}
                            </ul>
                        </CompactCard>
                    </div>
                </Section>

                <Section
                    eyebrow="ADR"
                    title="処理の流れと責務境界を見える化する"
                >
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {responsibilityMap.map(([layer, role]) => (
                            <article
                                key={layer}
                                className="rounded-lg border border-white/14 bg-white/8 p-4"
                            >
                                <h3 className="font-semibold text-white">
                                    {layer}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-200/78">
                                    {role}
                                </p>
                            </article>
                        ))}
                    </div>
                    <div className="mt-5">
                        <CheckList items={responsibilityChecks} />
                    </div>
                </Section>

                <Section eyebrow="TDD" title="仕様をテスト観点へ変換する">
                    <p className="max-w-4xl text-sm leading-7 text-slate-200/80">
                        TDDはテストコードを暗記することではなく、仕様の確認点を先に決めること。SpecFlowTrainerでは、成功条件・失敗条件・DTO値・DB状態・Mock対象を整理する。
                    </p>
                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                        {testViewpoints.map(([title, detail]) => (
                            <CompactCard key={title} title={title}>
                                {detail}
                            </CompactCard>
                        ))}
                    </div>
                </Section>

                <Section
                    eyebrow="AI Agent"
                    title="AIに作業を任せる。進行判定は人間が行う。"
                >
                    <CheckList items={agentChecklist} />
                    <p className="mt-5 rounded-lg border border-emerald-100/25 bg-emerald-100/10 p-4 text-sm font-semibold leading-7 text-emerald-50">
                        AIが実行したら完了ではない。人間が確認したら完了。
                    </p>
                </Section>

                <Section
                    eyebrow="GPT Prompt"
                    title="GPTが読み取りやすい定型文を生成する"
                >
                    <p className="max-w-4xl text-sm leading-7 text-slate-200/80">
                        各ステップの設計状態を、ChatGPTやCodexAppに渡しやすい定型文に変換する。毎回同じ順番で渡すことで、レビュー、命名相談、責務確認、テスト観点確認がしやすくなる。
                    </p>
                    <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                        <CompactCard title="テンプレート例">
                            <div className="grid gap-1 font-mono text-xs leading-6 text-cyan-50">
                                {promptTemplate.map((line) => (
                                    <p key={line}>{line}</p>
                                ))}
                            </div>
                        </CompactCard>
                        <CompactCard title="生成パターン">
                            <TagList items={promptPatterns} />
                        </CompactCard>
                    </div>
                </Section>

                <Section
                    eyebrow="Visualization"
                    title="Mermaidから始め、React Flowへ拡張できる構造にする"
                >
                    <p className="max-w-4xl text-sm leading-7 text-slate-200/80">
                        元データはDBに保存する。Mermaid文字列を直接保存するのではなく、projects、use_cases、design_nodes、design_edges、dto_definitions、list_dto_definitions
                        などの構造化データを保存する。
                    </p>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <CompactCard title="MVP">
                            Mermaid生成
                        </CompactCard>
                        <CompactCard title="後続">
                            <ul className="grid gap-2">
                                <li>React Flow編集</li>
                                <li>PNG / SVG出力</li>
                                <li>ドラッグ操作</li>
                                <li>自動配置</li>
                            </ul>
                        </CompactCard>
                    </div>
                    <p className="mt-5 rounded-lg border border-cyan-100/25 bg-cyan-100/10 p-4 text-sm font-semibold leading-7 text-cyan-50">
                        MermaidもReact Flowも保存データではなく、DB上の設計情報から生成する出力として扱う。
                    </p>
                </Section>

                <Section eyebrow="MVP" title="最初に作る最小実用版">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <CompactCard title="最初に作るもの">
                            <CheckList items={mvpScope} />
                        </CompactCard>
                        <CompactCard title="後回し">
                            <CheckList items={deferredScope} />
                        </CompactCard>
                    </div>
                </Section>

                <Section eyebrow="Value" title="自分の開発補助が主目的">
                    <p className="max-w-4xl text-sm leading-7 text-slate-200/80">
                        SpecFlowTrainerは、見せるためだけのアプリではない。自分が実際に開発するときに、仕様忘れ、責務混在、DTO設計漏れ、テスト観点漏れ、AI指示のブレを防ぐためのツール。
                    </p>
                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        <CompactCard title="開発補助としての価値">
                            <CheckList items={toolValues} />
                        </CompactCard>
                        <CompactCard title="ポートフォリオとしての見せ方">
                            <CheckList items={portfolioValues} />
                        </CompactCard>
                    </div>
                </Section>

                <div className="flex justify-center">
                    <Link
                        href="/projects/spec-flow-trainer"
                        className="inline-flex min-h-12 items-center justify-center rounded-lg border border-cyan-100/40 bg-cyan-100 px-5 text-sm font-bold text-slate-950 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                    >
                        Project Hubへ戻る
                    </Link>
                </div>
            </div>
        </PublicLayout>
    );
}
