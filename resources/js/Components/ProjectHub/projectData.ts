export type ProjectId =
    | 'api-discovery-hub'
    | 'dance-shorts-radar'
    | 'dance-shorts-analyzer'
    | 'japan-quake-wave-map'
    | 'lumilab'
    | 'construction-order'
    | 'event-card-calendar'
    | 'logs';

export type StageProjectId = Exclude<ProjectId, 'logs'>;

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

export type Stage = {
    kind: StageKind;
    name: string;
    description: string;
    status: StageStatus;
    iconKey: ProjectIconKey;
    route: string;
};

type ProjectBase = {
    name: string;
    description: string;
    theme: ProjectTheme;
    iconKey: ProjectIconKey;
};

export type StagedProject = ProjectBase & {
    kind: 'staged';
    id: StageProjectId;
    stages: [Stage, ...Stage[]];
};

export type DedicatedProject = ProjectBase & {
    kind: 'dedicated';
    id: 'logs';
    stages: [];
    action: {
        name: string;
        description: string;
        route: string;
        iconKey: ProjectIconKey;
    };
};

export type Project = StagedProject | DedicatedProject;

const projectSelectStageOrder: StageKind[] = [
    'product',
    'prototype',
    'mock',
    'idea-board',
];

export const projects: Project[] = [
    {
        kind: 'staged',
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
                route: '/api-catalog',
            },
        ],
    },
    {
        kind: 'staged',
        id: 'dance-shorts-radar',
        name: 'DanceShortsRadar',
        description:
            'YouTube Shorts のダンス候補を収集し、地域別ランキングと snapshot 差分を確認するProjectです。',
        iconKey: 'radar',
        theme: {
            background: '#10131f',
            backgroundGlow: '#22d3ee',
            sphere: '#14b8a6',
            sphereShadow: 'rgba(20, 184, 166, 0.44)',
            accent: '#67e8f9',
            surface: 'rgba(15, 23, 42, 0.64)',
            text: '#f0fdfa',
            muted: '#99f6e4',
        },
        stages: [
            {
                kind: 'product',
                name: 'PRODUCT',
                description:
                    '収集した候補の snapshot 差分と地域別ランキングを確認する本体画面です。',
                status: 'available',
                iconKey: 'rocket',
                route: '/dance-shorts-radar',
            },
            {
                kind: 'mock',
                name: 'MOCK',
                description:
                    '地域別の候補一覧と snapshot 差分表示を固定データで確認します。',
                status: 'available',
                iconKey: 'layout',
                route: '/lab/dance-shorts-radar-mock',
            },
            {
                kind: 'idea-board',
                name: 'IDEA BOARD',
                description:
                    '候補収集、snapshot 設計、地域別ランキングの仕様を整理します。',
                status: 'available',
                iconKey: 'lightbulb',
                route: '/lab/dance-shorts-radar-idea-board',
            },
        ],
    },
    {
        kind: 'staged',
        id: 'dance-shorts-analyzer',
        name: 'DanceShortsAnalyzer',
        description:
            '保存済み動画を検索・選択し、snapshot の推移と差分を比較分析するProjectです。',
        iconKey: 'bar-chart',
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
                kind: 'product',
                name: 'PRODUCT',
                description:
                    '保存済み動画を検索・選択し、snapshot を比較分析する本体画面です。',
                status: 'available',
                iconKey: 'rocket',
                route: '/dance-shorts-analyzer',
            },
            {
                kind: 'mock',
                name: 'MOCK',
                description:
                    '保存済み動画の検索・選択と比較分析UIを固定データで確認します。',
                status: 'available',
                iconKey: 'layout',
                route: '/lab/dance-shorts-analyzer-mock',
            },
            {
                kind: 'idea-board',
                name: 'IDEA BOARD',
                description:
                    '保存済み動画と snapshot を使った比較分析画面の仕様を整理します。',
                status: 'available',
                iconKey: 'lightbulb',
                route: '/lab/dance-shorts-analyzer-idea-board',
            },
        ],
    },
    {
        kind: 'staged',
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
                route: '/quakewave-preview',
            },
            {
                kind: 'product',
                name: 'PRODUCT',
                description:
                    '保存済み地震ピンを地図上に表示する本体画面へ入ります。',
                status: 'available',
                iconKey: 'rocket',
                route: '/quakewave-preview/map',
            },
        ],
    },
    {
        kind: 'staged',
        id: 'lumilab',
        name: 'LumiLab',
        description:
            'LumiLabは案件システムを最初のサブシステムとして育てる上位プロダクトです。',
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
                kind: 'mock',
                name: 'MOCK',
                description:
                    'LumiLabの開始UIを固定表示で確認します。',
                status: 'available',
                iconKey: 'layout',
                route: '/lab/lumilab-project-mock',
            },
            {
                kind: 'idea-board',
                name: 'IDEA BOARD',
                description:
                    'LumiLabと案件システムの考え方を、お客様向けの機能説明資料として整理します。',
                status: 'available',
                iconKey: 'lightbulb',
                route: '/lab/lumilab-project-idea-board',
            },
        ],
    },
    {
        kind: 'staged',
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
        kind: 'staged',
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
        kind: 'dedicated',
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
        action: {
            name: 'アプリログ',
            description: 'API連携ログとエラーログを確認します。',
            route: '/projects/logs',
            iconKey: 'clipboard',
        },
    },
];

export function getProjectById(projectId: string | undefined): Project | null {
    return projects.find((project) => project.id === projectId) ?? null;
}

export function getProjectStageSelectHref(projectId: string): string {
    return isStageProjectId(projectId)
        ? `/projects?project=${projectId}&view=stages`
        : '/projects';
}

export function sortStagesForProjectSelect(
    stages: readonly Stage[],
): Stage[] {
    return [...stages].sort(
        (left, right) =>
            projectSelectStageOrder.indexOf(left.kind) -
            projectSelectStageOrder.indexOf(right.kind),
    );
}

export function isProjectId(projectId: string): projectId is ProjectId {
    return projects.some((project) => project.id === projectId);
}

export function isStageProjectId(
    projectId: string,
): projectId is StageProjectId {
    return projects.some(
        (project) => project.kind === 'staged' && project.id === projectId,
    );
}

export function getAdjacentProjectIndex(
    currentIndex: number,
    offset: -1 | 1,
): number {
    return (currentIndex + offset + projects.length) % projects.length;
}
