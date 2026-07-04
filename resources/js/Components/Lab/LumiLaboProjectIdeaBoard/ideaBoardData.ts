export type IdeaBoardTabId =
    | 'top'
    | 'project'
    | 'projectCreate'
    | 'projectList'
    | 'coding';

export type IdeaBoardTone =
    | 'lemon'
    | 'sky'
    | 'emerald'
    | 'amber'
    | 'rose'
    | 'slate';

export type IdeaBoardCard = {
    title: string;
    body: string;
    badge?: string;
    tone?: IdeaBoardTone;
};

export type IdeaBoardSection = {
    title: string;
    lead: string;
    items?: readonly string[];
    cards?: readonly IdeaBoardCard[];
    note?: string;
};

export type IdeaBoardTab = {
    id: IdeaBoardTabId;
    label: string;
    kicker: string;
    title: string;
    lead: string;
    sections: readonly IdeaBoardSection[];
};

export const requiredTabLabels = [
    'TOP',
    '案件',
    '案件作成',
    '案件一覧',
    'Coding',
] as const;

export const projectRouteFlow = [
    'LumiLabo Hub',
    '案件システム',
    '案件作成',
    '案件一覧',
    '案件詳細',
    '工程デッキ / 工程カード',
] as const;

export const projectCreateInputCandidates: readonly IdeaBoardCard[] = [
    {
        title: '会社名',
        badge: '入力候補',
        body: '案件を識別する主要表示項目として扱う。',
        tone: 'sky',
    },
    {
        title: '担当者名',
        badge: '入力候補',
        body: '会社側の担当者を記録する項目として扱う。',
        tone: 'sky',
    },
    {
        title: '住所',
        badge: '入力候補',
        body: 'まずは1つのテキストとして扱い、郵便番号や都道府県へ勝手に分割しない。',
        tone: 'sky',
    },
    {
        title: 'メモ',
        badge: '入力候補',
        body: '連絡事項、補足、初回確認で残したい内容を書く任意項目として扱う。',
        tone: 'sky',
    },
] as const;

export const projectCreateDisplayCandidates: readonly IdeaBoardCard[] = [
    {
        title: '登録日表示',
        badge: '表示候補',
        body: '入力欄にしない。将来のPRODUCTでは created_at 表示相当として扱う。',
        tone: 'emerald',
    },
    {
        title: 'ステータス表示',
        badge: '表示候補',
        body: '初期表示は「進行中」候補。色だけにせず文字で状態を示す。',
        tone: 'emerald',
    },
] as const;

export const projectCreateNotInputItems = [
    '登録日',
    '案件名',
    '郵便番号 / 都道府県 / 市区町村などへ分割した住所',
    '工程カード情報',
    'カレンダー情報',
    '完了判定に関わる情報',
] as const;

export const projectListFutureCards: readonly IdeaBoardCard[] = [
    {
        title: '会社名',
        badge: '将来の表示候補',
        body: '案件作成で入力した会社名を、一覧で見つける手がかりにする。',
        tone: 'lemon',
    },
    {
        title: '担当者名',
        badge: '将来の表示候補',
        body: '誰と話している案件かを一覧で確認できる候補として扱う。',
        tone: 'lemon',
    },
    {
        title: 'ステータス',
        badge: '将来の表示候補',
        body: '「進行中」など、色だけではなく文字で状態を確認する候補として扱う。',
        tone: 'lemon',
    },
    {
        title: '登録日',
        badge: '将来の表示候補',
        body: 'created_at 表示相当を一覧の確認情報として扱う候補にする。',
        tone: 'lemon',
    },
] as const;

export const readMarkdownFiles = [
    'AGENTS.md',
    'docs/index.md',
    'docs/ai/workflows/md-router.md',
    'docs/ai/rules/agent-working-policy.md',
    'docs/ai/rules/responsibility-boundaries.md',
    'docs/lumilabo/ui-design-guideline.md',
    'docs/ui-development-flow.md',
    'docs/frontend.md',
    'docs/ui.md',
] as const;

export const ideaBoardTabs: readonly IdeaBoardTab[] = [
    {
        id: 'top',
        label: 'TOP',
        kicker: 'LumiLabo 案件システム IDEA BOARD',
        title: 'LumiLaboの最初の実作業を、案件システムとして整理する',
        lead: 'LumiLaboは上位プロダクト / 上位ドメインです。案件作成を起点に、後続の案件一覧・案件詳細・工程へつなげる構想をIDEA BOARDとして確認します。',
        sections: [
            {
                title: 'LumiLaboの位置づけ',
                lead: '案件作成だけを切り出さず、案件システム全体の入口として整理します。',
                items: [
                    'LumiLaboは単なる案件管理機能ではなく、上位プロダクト / 上位ドメインとして扱う。',
                    '最初に作るサブシステムを案件システムとして扱う。',
                    '案件作成を入口にし、案件一覧以降への接続もIDEA BOARD内で確認する。',
                ],
            },
            {
                title: 'IDEA BOARDの扱い',
                lead: '画面は構想整理に絞り、実装判断はCodingタブへ分けます。',
                items: [
                    'MOCK / PRODUCTではなく、案件システムの構想整理として見る。',
                    'DB / Backend / カレンダーを画面へ混ぜない。',
                    'カレンダーは各カードが定義された後に別で扱う。',
                ],
            },
        ],
    },
    {
        id: 'project',
        label: '案件',
        kicker: '案件システムの位置づけ',
        title: 'LumiLabo配下の最初のサブシステムとして案件を見る',
        lead: '案件システムはLumiLabo配下の最初のサブシステムです。案件作成を入口にし、案件一覧以降は後続扱いとして整理します。',
        sections: [
            {
                title: '基本導線',
                lead: projectRouteFlow.join(' → '),
                cards: projectRouteFlow.map((step, index) => ({
                    title: step,
                    badge: `導線 ${index + 1}`,
                    body:
                        index <= 2
                            ? 'IDEA BOARDで入口として確認する範囲。'
                            : '後続PRで扱う接続先。',
                    tone: index <= 2 ? 'lemon' : 'slate',
                })),
            },
            {
                title: '分ける考え方',
                lead: '案件作成、案件一覧、案件詳細、工程は役割が違うため、同じ画面へ雑に詰め込まない。',
                items: [
                    '案件作成は最初の入力入口。',
                    '案件一覧は作成後の確認先。',
                    '案件詳細と工程デッキ / 工程カードは別工程で扱う。',
                    'LumiLaboを案件管理機能そのものとして扱わない。',
                ],
            },
        ],
    },
    {
        id: 'projectCreate',
        label: '案件作成',
        kicker: '中心タブ',
        title: '何を入力し、何を入力させないかを整理する',
        lead: '案件作成を中心に、初期項目、表示候補、入力させない情報、後続への起点を確認します。保存可能フォームにはしません。',
        sections: [
            {
                title: '入力させる候補',
                lead: '最初の案件作成で入力候補にする項目です。案件名はここへ追加しません。',
                cards: projectCreateInputCandidates,
            },
            {
                title: '表示する候補',
                lead: 'ユーザー入力にしないが、作成後に確認したい表示候補です。',
                cards: projectCreateDisplayCandidates,
            },
            {
                title: '入力させないもの',
                lead: '工程やカレンダー、完了判定に進む情報は、案件作成の入口へ混ぜません。',
                items: projectCreateNotInputItems,
                note: '入力フォーム風の見せ方をしても、保存可能フォームやMOCKとして扱いません。',
            },
            {
                title: '後続へ渡す起点',
                lead: '会社名、担当者名、住所、メモを起点に、将来の案件一覧や案件詳細へつなげる構想だけを整理します。',
                items: [
                    '案件一覧では会社名、担当者名、ステータス、登録日を確認する候補にする。',
                    '案件詳細、工程デッキ、工程カードは別工程で扱う。',
                    '完了判定や状態判断はReact Componentへ置かず、将来Service側で扱う。',
                ],
            },
        ],
    },
    {
        id: 'projectList',
        label: '案件一覧',
        kicker: '後続タブ',
        title: '案件作成後の確認先として概念だけ整理する',
        lead: '案件一覧は後続の確認先です。固定データMOCKにせず、案件作成後に何を確認したいかを概念として整理します。',
        sections: [
            {
                title: '将来表示する候補',
                lead: '一覧画面そのものは作らず、将来の表示候補だけを確認します。',
                cards: projectListFutureCards,
            },
            {
                title: '一覧タブで深掘りしないもの',
                lead: '一覧の確認候補だけに絞り、詳細画面や工程の中身へ進めません。',
                items: [
                    '一覧画面そのものは作らず、確認したい項目だけを見る。',
                    '固定データ付きの一覧MOCKにしない。',
                    '詳細画面への遷移は扱わない。',
                    '案件詳細や工程詳細へ踏み込まない。',
                ],
            },
        ],
    },
    {
        id: 'coding',
        label: 'Coding',
        kicker: '実装境界',
        title: '表示用IDEA BOARDだけを追加し、業務判断を持たせない',
        lead: 'React Componentはタブ切り替えと表示だけを担当します。DB、Migration、Backend本実装、カレンダー、保存処理は持たせません。',
        sections: [
            {
                title: '読んだMD',
                lead: '作業前に確認したMDです。PR本文にも読んだMDと反映内容を記載する前提にします。',
                items: readMarkdownFiles,
            },
            {
                title: '実装対象',
                lead: 'ブラウザで確認できるタブ型IDEA BOARDと、既存導線への最小追加です。',
                items: [
                    'LumiLabo 案件システム IDEA BOARD画面。',
                    'TOP / 案件 / 案件作成 / 案件一覧 / Coding の必須タブ。',
                    '表示中タブだけを表示する構成。',
                    'docs/index.md からLumiLabo docsへ辿れる導線。',
                    'Project HubからIDEA BOARDへ入る最小導線。',
                ],
            },
            {
                title: '対象外',
                lead: 'IDEA BOARDを越えて、MOCK / PRODUCT / Backend / Calendarへ踏み込ませません。',
                items: [
                    '保存可能な入力フォーム。',
                    'DB / Migration / Model。',
                    'Controller / Request / Action / Service / Repository / DTO。',
                    'Event / Listener / Job / Scheduler。',
                    'API通信 / Docker変更 / npm install / shadcn/ui / Storybook。',
                    'カレンダー / 案件詳細 / 工程詳細 / 工程デッキ / 工程カード実装。',
                ],
            },
            {
                title: '責務境界',
                lead: '将来PRODUCT化する場合の責務分離だけを明記し、この画面の実装には持ち込みません。',
                items: [
                    'IDEA BOARDは設計・構想整理のための表示であり、業務ロジックを持たせない。',
                    'React Componentに完了判定や業務判断を入れない。',
                    '将来PRODUCT化する場合は Controller / Request / Action / Service / Repository / DTO / Presenter の責務分離を前提にする。',
                    'DTOは判断本体ではなく、確定済み値の受け渡し境界として扱う。',
                    '状態判断や完了判定は将来Service側で扱う。',
                ],
            },
        ],
    },
] as const;

export function getIdeaBoardTabById(tabId: IdeaBoardTabId): IdeaBoardTab {
    return ideaBoardTabs.find((tab) => tab.id === tabId) ?? ideaBoardTabs[0];
}
