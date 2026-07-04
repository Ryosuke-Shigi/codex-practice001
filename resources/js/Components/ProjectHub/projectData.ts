export type ProjectId =
    | 'api-discovery-hub'
    | 'dance-shorts'
    | 'japan-quake-wave-map'
    | 'lumilabo'
    | 'construction-order'
    | 'event-card-calendar'
    | 'logs';

export type ProjectIconKey =
    | 'bar-chart'
    | 'building'
    | 'calendar'
    | 'clipboard'
    | 'globe'
    | 'layout'
    | 'lightbulb'
    | 'play'
    | 'radar'
    | 'rocket';

export type StageKind = 'product' | 'prototype' | 'mock' | 'idea-board';

export type StageStatus = 'available';

export type ProjectTheme = {
    background: string;
    backgroundGlow: string;
    sphere: string;
    sphereShadow: string;
    accent: string;
    surface: string;
    text: string;
    muted: string;
};

export type ProjectModule = {
    id: string;
    name: string;
    description: string;
    route?: string;
    iconKey: ProjectIconKey;
};

export type Stage = {
    kind: StageKind;
    name: string;
    description: string;
    status: StageStatus;
    iconKey: ProjectIconKey;
    route?: string;
    modules?: ProjectModule[];
};

export type Project = {
    id: ProjectId;
    name: string;
    description: string;
    theme: ProjectTheme;
    iconKey: ProjectIconKey;
    stages: Stage[];
};

const projectHubStageOrder: StageKind[] = [
    'product',
    'prototype',
    'mock',
    'idea-board',
];

export const projects: Project[] = [
    {
        id: 'api-discovery-hub',
        name: 'API Discovery Hub',
        description:
            '公開APIカタログを取得・検索・保存・調査できるポートフォリオProjectです。',
        iconKey: 'globe',
        theme: {
            background: '#0e1b2b',
            backgroundGlow: '#38bdf8',
            sphere: '#22d3ee',
            sphereShadow: 'rgba(34, 211, 238, 0.38)',
            accent: '#facc15',
            surface: 'rgba(15, 23, 42, 0.62)',
            text: '#eef6ff',
            muted: '#bae6fd',
        },
        stages: [
            {
                kind: 'idea-board',
                name: 'IDEA BOARD',
                description:
                    'API Discovery Hub の目的、対象データ、検索・保存・責務分離の仕様を固める入口です。',
                status: 'available',
                iconKey: 'lightbulb',
                route: '/lab/api-discovery-hub-idea-board',
            },
            {
                kind: 'mock',
                name: 'MOCK',
                description:
                    'APIカタログ一覧と詳細の見た目を固定データで確認する入口です。',
                status: 'available',
                iconKey: 'layout',
                route: '/api-catalog/mock',
            },
            {
                kind: 'product',
                name: 'PRODUCT',
                description:
                    '公開APIカタログ本体へ入ります。同期、検索、メモ保存は既存画面側で扱います。',
                status: 'available',
                iconKey: 'rocket',
                modules: [
                    {
                        id: 'api-catalog',
                        name: 'API Catalog',
                        description:
                            '公開APIを検索し、詳細と保存メモを確認する本体一覧です。',
                        route: '/api-catalog',
                        iconKey: 'globe',
                    },
                ],
            },
        ],
    },
    {
        id: 'dance-shorts',
        name: 'DanceShorts',
        description:
            'YouTube Shorts のダンス候補を集め、伸び方と比較分析を見せるポートフォリオProjectです。',
        iconKey: 'play',
        theme: {
            background: '#10131f',
            backgroundGlow: '#e94584',
            sphere: '#ff4f8b',
            sphereShadow: 'rgba(255, 79, 139, 0.44)',
            accent: '#7dd3fc',
            surface: 'rgba(15, 23, 42, 0.64)',
            text: '#fff7fb',
            muted: '#c7d2fe',
        },
        stages: [
            {
                kind: 'idea-board',
                name: 'IDEA BOARD',
                description:
                    'Radar と Analyzer の仕様、データの流れ、説明の出し方を確認・相談する入口です。',
                status: 'available',
                iconKey: 'lightbulb',
                modules: [
                    {
                        id: 'radar-idea',
                        name: 'Radar',
                        description:
                            'Shorts の候補収集、snapshot 設計、ランキング表示の仕様を整理します。',
                        route: '/lab/dance-shorts-radar-idea-board',
                        iconKey: 'radar',
                    },
                    {
                        id: 'analyzer-idea',
                        name: 'Analyzer',
                        description:
                            '保存済み動画と snapshot を使った比較分析画面の仕様を整理します。',
                        route: '/lab/dance-shorts-analyzer-idea-board',
                        iconKey: 'bar-chart',
                    },
                ],
            },
            {
                kind: 'mock',
                name: 'MOCK',
                description:
                    'Radar と Analyzer の操作感を、固定データだけで確認する入口です。',
                status: 'available',
                iconKey: 'layout',
                modules: [
                    {
                        id: 'radar-mock',
                        name: 'Radar MOCK',
                        description:
                            '地域別の候補一覧と差分表示を固定データで確認します。',
                        route: '/lab/dance-shorts-radar-mock',
                        iconKey: 'radar',
                    },
                    {
                        id: 'analyzer-mock',
                        name: 'Analyzer MOCK',
                        description:
                            '検索、選択、比較分析UIを固定データで確認します。',
                        route: '/lab/dance-shorts-analyzer-mock',
                        iconKey: 'bar-chart',
                    },
                ],
            },
            {
                kind: 'product',
                name: 'PRODUCT',
                description:
                    '保存済み動画と snapshot を使う本体画面です。Analyzer と Radar へ入れます。',
                status: 'available',
                iconKey: 'rocket',
                modules: [
                    {
                        id: 'analyzer',
                        name: 'Analyzer',
                        description:
                            '保存済み動画を検索し、選択した Shorts の snapshot を比較分析します。',
                        route: '/dance-shorts-analyzer',
                        iconKey: 'bar-chart',
                    },
                    {
                        id: 'radar',
                        name: 'Radar',
                        description:
                            '保存済み snapshot の差分から、地域別のランキング候補を確認します。',
                        route: '/dance-shorts-radar',
                        iconKey: 'radar',
                    },
                ],
            },
        ],
    },
    {
        id: 'japan-quake-wave-map',
        name: 'Japan Quake Wave Map',
        description:
            '気象庁XML由来の地震情報を保存し、震源・震度・波紋を地図上で確認するProjectです。',
        iconKey: 'radar',
        theme: {
            background: '#13211f',
            backgroundGlow: '#60a5fa',
            sphere: '#38bdf8',
            sphereShadow: 'rgba(56, 189, 248, 0.34)',
            accent: '#fb7185',
            surface: 'rgba(15, 42, 44, 0.58)',
            text: '#ecfeff',
            muted: '#a7f3d0',
        },
        stages: [
            {
                kind: 'idea-board',
                name: 'IDEA BOARD',
                description:
                    'XML取得、解析、pin生成、部分失敗管理の仕様を確認・相談する入口です。',
                status: 'available',
                iconKey: 'lightbulb',
                route: '/lab/quake-wave-map-idea-board',
            },
            {
                kind: 'mock',
                name: 'MOCK',
                description:
                    '地震マップのモック、XML確認、同期状態を確認する開発入口です。',
                status: 'available',
                iconKey: 'layout',
                modules: [
                    {
                        id: 'preview-tools',
                        name: 'Preview',
                        description:
                            '地図、XML、同期状態を確認する QuakeWave Preview 入口です。',
                        route: '/quakewave-preview',
                        iconKey: 'radar',
                    },
                    {
                        id: 'map-mock',
                        name: 'Map MOCK',
                        description:
                            'DB保存済みpinを使わず、地図表示だけを確認するモックです。',
                        route: '/quakewave-preview/map/mock',
                        iconKey: 'layout',
                    },
                ],
            },
            {
                kind: 'product',
                name: 'PRODUCT',
                description:
                    '保存済み地震ピンを地図上に表示する本体画面へ入ります。',
                status: 'available',
                iconKey: 'rocket',
                modules: [
                    {
                        id: 'quake-map',
                        name: 'Map',
                        description:
                            '気象庁XMLから保存した震源・震度・波紋を地図で確認します。',
                        route: '/quakewave-preview/map',
                        iconKey: 'radar',
                    },
                ],
            },
        ],
    },
    {
        id: 'lumilabo',
        name: 'LumiLabo',
        description:
            'LumiLaboは案件システムを最初のサブシステムとして育てる上位プロダクトです。',
        iconKey: 'lightbulb',
        theme: {
            background: '#111827',
            backgroundGlow: '#facc15',
            sphere: '#facc15',
            sphereShadow: 'rgba(250, 204, 21, 0.36)',
            accent: '#ca8a04',
            surface: 'rgba(17, 24, 39, 0.72)',
            text: '#fffbea',
            muted: '#fde68a',
        },
        stages: [
            {
                kind: 'idea-board',
                name: 'IDEA BOARD',
                description:
                    '案件作成を中心に、案件一覧、案件詳細、工程へつなげる案件システム構想を整理します。',
                status: 'available',
                iconKey: 'lightbulb',
                modules: [
                    {
                        id: 'project-system-idea-board',
                        name: '案件システム',
                        description:
                            'TOP、案件、案件作成、案件一覧、Codingをタブで切り替えて確認します。',
                        route: '/lab/lumilabo-project-idea-board',
                        iconKey: 'clipboard',
                    },
                ],
            },
        ],
    },
    {
        id: 'construction-order',
        name: '工事発注管理',
        description:
            '案件、作業カード、見積・請求・領収の流れを、現場向けの入力体験として整理するProjectです。',
        iconKey: 'building',
        theme: {
            background: '#12201c',
            backgroundGlow: '#f7c948',
            sphere: '#4ade80',
            sphereShadow: 'rgba(74, 222, 128, 0.36)',
            accent: '#fbbf24',
            surface: 'rgba(20, 83, 45, 0.44)',
            text: '#f7fee7',
            muted: '#d9f99d',
        },
        stages: [
            {
                kind: 'idea-board',
                name: 'IDEA BOARD',
                description:
                    '案件中心の発注、作業カード、請求、領収の仕様を整理・相談する入口です。',
                status: 'available',
                iconKey: 'lightbulb',
                route: '/lab/construction-order-workflow-idea-board',
            },
            {
                kind: 'mock',
                name: 'MOCK',
                description:
                    'CSV投入、案件詳細、帳票プレビューを固定データで確認するUI MOCKです。',
                status: 'available',
                iconKey: 'clipboard',
                route: '/lab/construction-order-workflow-mock',
            },
        ],
    },
    {
        id: 'event-card-calendar',
        name: 'イベント・カードカレンダー',
        description:
            'イベントを背景・生成元として扱い、入金・出金・請求カードをカレンダー、表、可視化へ広げる構想Projectです。',
        iconKey: 'calendar',
        theme: {
            background: '#111716',
            backgroundGlow: '#34d399',
            sphere: '#f59e0b',
            sphereShadow: 'rgba(245, 158, 11, 0.34)',
            accent: '#38bdf8',
            surface: 'rgba(20, 83, 45, 0.34)',
            text: '#f8fafc',
            muted: '#bbf7d0',
        },
        stages: [
            {
                kind: 'idea-board',
                name: 'IDEA BOARD',
                description:
                    'イベントとカードの責務、日付軸、生成フロー、可視化責務を固定データで整理する入口です。',
                status: 'available',
                iconKey: 'lightbulb',
                route: '/lab/event-card-calendar-idea-board',
            },
        ],
    },
    {
        id: 'logs',
        name: 'アプリログ',
        description:
            'アプリ内で保存したAPI連携ログとエラーログを確認するための入口です。',
        iconKey: 'clipboard',
        theme: {
            background: '#111827',
            backgroundGlow: '#14b8a6',
            sphere: '#f97316',
            sphereShadow: 'rgba(249, 115, 22, 0.34)',
            accent: '#facc15',
            surface: 'rgba(17, 24, 39, 0.68)',
            text: '#f8fafc',
            muted: '#bfdbfe',
        },
        stages: [],
    },
];

export function getProjectById(projectId: string | undefined): Project | null {
    return projects.find((project) => project.id === projectId) ?? null;
}

export function getProjectHubHref(project: Project): string {
    return `/projects/${project.id}`;
}

export function sortStagesForProjectHub(stages: Stage[]): Stage[] {
    return [...stages].sort(
        (left, right) =>
            projectHubStageOrder.indexOf(left.kind) -
            projectHubStageOrder.indexOf(right.kind),
    );
}

export function getAdjacentProjectIndex(
    currentIndex: number,
    offset: -1 | 1,
): number {
    return (currentIndex + offset + projects.length) % projects.length;
}
