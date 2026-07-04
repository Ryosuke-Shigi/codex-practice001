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
    '案件システムTOP',
    '案件作成',
    '案件一覧',
    '案件詳細',
    '工程デッキ / 工程カード',
] as const;

export const topEntryCards: readonly IdeaBoardCard[] = [
    {
        title: '案件作成へ進む入口',
        badge: '主入口',
        body: 'LumiLabo Hubから案件システムへ入った人が、最初の案件入力へ進むための入口として置く。',
        tone: 'lemon',
    },
    {
        title: '案件一覧を見る入口',
        badge: '確認入口',
        body: '作成済みの案件を確認し、会社名や担当者名から案件を探す入口として置く。',
        tone: 'sky',
    },
    {
        title: '現在位置',
        badge: 'TOP',
        body: 'ここがLumiLabo配下の案件システムTOPであり、案件作成と案件一覧の前段であることを示す。',
        tone: 'emerald',
    },
    {
        title: '後続の余白',
        badge: '拡張先',
        body: '案件詳細、工程、別サブシステムへ広げられる余白だけを見せ、画面自体は作り込まない。',
        tone: 'slate',
    },
] as const;

export const projectCreateInputCandidates: readonly IdeaBoardCard[] = [
    {
        title: '会社名',
        badge: '入力候補',
        body: '案件を識別し、一覧や詳細で探すための主要項目として扱う。',
        tone: 'sky',
    },
    {
        title: '担当者名',
        badge: '入力候補',
        body: '会社側の窓口を記録し、誰と話している案件かを後続で確認できるようにする。',
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
        badge: '表示候補',
        body: '案件作成で入力した会社名を、一覧で見つける手がかりにする。',
        tone: 'lemon',
    },
    {
        title: '担当者名',
        badge: '表示候補',
        body: '誰と話している案件かを一覧で確認できる候補として扱う。',
        tone: 'lemon',
    },
    {
        title: 'ステータス',
        badge: '表示候補',
        body: '「進行中」など、色だけではなく文字で状態を確認する候補として扱う。',
        tone: 'lemon',
    },
    {
        title: '登録日',
        badge: '表示候補',
        body: 'created_at 表示相当を一覧の確認情報として扱う候補にする。',
        tone: 'lemon',
    },
] as const;

const productResponsibilityCards: readonly IdeaBoardCard[] = [
    {
        title: 'Controller / Request',
        badge: '入口',
        body: '将来PRODUCT化する場合、HTTP入口と入力形式の検証を担当する。',
        tone: 'slate',
    },
    {
        title: 'Action',
        badge: '手順',
        body: '案件作成や一覧取得など、1ユースケースの手順を担当する。',
        tone: 'slate',
    },
    {
        title: 'Service',
        badge: '判断',
        body: '完了判定や業務状態の判断はReactではなくService側へ置く。',
        tone: 'slate',
    },
    {
        title: 'Repository / DTO / Presenter',
        badge: '境界',
        body: 'DB取得、レイヤー間データ、Inertia表示用propsの整形を分ける。',
        tone: 'slate',
    },
] as const;

export const ideaBoardTabs: readonly IdeaBoardTab[] = [
    {
        id: 'top',
        label: 'TOP',
        kicker: '案件システムTOP構想',
        title: 'LumiLabo Hubから案件システムへ入った最初の画面を考える',
        lead: 'LumiLabo Hubから案件システムへ入り、案件作成と案件一覧へ進むためのTOP画面として整理します。',
        sections: [
            {
                title: 'TOPで見せる入口',
                lead: '案件システムへ入った直後に、次に進む場所と現在位置が分かる構成にします。',
                cards: topEntryCards,
            },
            {
                title: 'TOPからの流れ',
                lead: 'TOPは案件作成だけに閉じず、案件一覧、案件詳細、工程へ進む前段として扱います。',
                items: [
                    'LumiLabo Hubから案件システムTOPへ入る。',
                    '新しい案件は案件作成へ進む。',
                    '作成済みの案件は案件一覧で確認する。',
                    '案件詳細、工程、別サブシステムは後続で扱える余白として残す。',
                ],
                note: 'ここでは実画面MOCKを作らず、TOP画面の考え方だけをIDEA BOARDとして見せます。',
            },
        ],
    },
    {
        id: 'project',
        label: '案件',
        kicker: '案件システム概要',
        title: '案件をLumiLaboの業務工程へつなげる起点として見る',
        lead: '案件タブは、案件作成の前に「案件とは何か」「案件システムで何を扱うか」を理解する場所です。',
        sections: [
            {
                title: '案件システムの目的',
                lead: '案件を会社・担当者・住所・メモのまとまりとして登録し、後続の工程へつなげる考え方を整理します。',
                cards: [
                    {
                        title: '案件を業務の起点にする',
                        badge: '目的',
                        body: '案件を作ることで、一覧確認、詳細確認、工程への接続が始まる。',
                        tone: 'lemon',
                    },
                    {
                        title: 'LumiLabo配下の最初のサブシステム',
                        badge: '位置づけ',
                        body: 'LumiLaboを単なる案件管理機能ではなく、上位プロダクトとして扱う。',
                        tone: 'emerald',
                    },
                    {
                        title: '案件詳細へつなげる',
                        badge: '後続',
                        body: '作成と一覧の後に、案件詳細で基本情報と工程の見通しを確認できる形へ育てる。',
                        tone: 'sky',
                    },
                    {
                        title: '工程デッキ / 工程カードへつなげる',
                        badge: '後続',
                        body: '工程は案件から派生する後続領域として扱い、案件タブ内では作り込まない。',
                        tone: 'slate',
                    },
                ],
            },
            {
                title: '基本導線',
                lead: projectRouteFlow.join(' → '),
                cards: projectRouteFlow.map((step, index) => ({
                    title: step,
                    badge: `導線 ${index + 1}`,
                    body:
                        index <= 3
                            ? 'IDEA BOARDで関係を見る地点。'
                            : '後続で扱う接続先。ここでは実装やMOCKへ進まない。',
                    tone: index <= 3 ? 'lemon' : 'slate',
                })),
            },
        ],
    },
    {
        id: 'projectCreate',
        label: '案件作成',
        kicker: '最初の入力入口',
        title: '案件作成画面が何を受け取り、何を混ぜないかを考える',
        lead: '案件作成はLumiLabo案件システムの最初の入力入口です。入力候補だけでなく、作成後に一覧へつながる流れまで整理します。',
        sections: [
            {
                title: '案件作成画面の役割',
                lead: '必要な最小情報を受け取り、作成後に案件一覧で確認できる状態へつなげる画面として扱います。',
                cards: [
                    {
                        title: '最初の入力入口',
                        badge: '入口',
                        body: '案件システムで最初に入力する場所として、会社名、担当者名、住所、メモを扱う。',
                        tone: 'lemon',
                    },
                    {
                        title: '一覧へつながる',
                        badge: '次の画面',
                        body: '作成後は案件一覧で会社名、担当者名、ステータス、登録日を確認する流れにする。',
                        tone: 'emerald',
                    },
                ],
            },
            {
                title: '入力させる候補',
                lead: '案件作成で扱う入力候補です。案件名はここへ追加しません。',
                cards: projectCreateInputCandidates,
            },
            {
                title: '画面上の表示候補',
                lead: 'ユーザー入力にしないが、案件作成画面や作成後の確認で見せたい候補です。',
                cards: projectCreateDisplayCandidates,
            },
            {
                title: '案件作成へ混ぜないもの',
                lead: '工程、カレンダー、完了判定へ進む情報は、最初の案件作成入口へ混ぜません。',
                items: projectCreateNotInputItems,
                note: '入力フォーム風に見せる場合でも、保存可能フォームや案件作成MOCKとして扱いません。',
            },
        ],
    },
    {
        id: 'projectList',
        label: '案件一覧',
        kicker: '作成後の確認先',
        title: '作成した案件をどう確認し、詳細へ進むかを考える',
        lead: '案件一覧タブは、案件作成後に作成した案件をどう確認するかを整理する場所です。固定データMOCKや本実装にはしません。',
        sections: [
            {
                title: '一覧画面の役割',
                lead: '作成した案件を探し、状態を見て、必要なら案件詳細へ進む入口として整理します。',
                cards: [
                    {
                        title: '作成した案件を確認する',
                        badge: '確認',
                        body: '案件作成で生まれた案件を、一覧で見つけられる状態にする。',
                        tone: 'lemon',
                    },
                    {
                        title: '主要項目で探す',
                        badge: '一覧',
                        body: '会社名、担当者名、ステータス、登録日を表示候補として扱う。',
                        tone: 'sky',
                    },
                    {
                        title: '案件詳細への入口',
                        badge: '後続',
                        body: '一覧は案件詳細へ進む入口になる。ただし詳細画面への実遷移は作らない。',
                        tone: 'emerald',
                    },
                    {
                        title: '工程へ踏み込まない',
                        badge: '境界',
                        body: '工程詳細や工程デッキは一覧タブで扱わず、案件詳細以降の後続領域に分ける。',
                        tone: 'slate',
                    },
                ],
            },
            {
                title: '表示候補',
                lead: '一覧画面そのものは作らず、将来確認したい項目だけを概念として見せます。',
                cards: projectListFutureCards,
            },
        ],
    },
    {
        id: 'coding',
        label: 'Coding',
        kicker: 'IDEA BOARDの組み方',
        title: 'タブ構成、表示データ、将来の責務分離を分けて育てる',
        lead: 'CodingタブはPR注意書きではなく、このIDEA BOARDをどう組み、PRODUCT化でどこへ責務を移すかを整理する場所です。',
        sections: [
            {
                title: 'タブ切り替えの構造',
                lead: '画面は5タブを持ち、React Componentは選んだタブのUI状態だけを管理します。',
                cards: [
                    {
                        title: 'Page',
                        badge: '入口',
                        body: 'Inertia PageはLayout、Head、Project Hubへ戻る導線、IDEA BOARD本体の配置だけを担当する。',
                        tone: 'lemon',
                    },
                    {
                        title: 'Component',
                        badge: '表示',
                        body: 'Componentはタブ切り替え、選んだタブの描画、カード/リスト表示だけを担当する。',
                        tone: 'sky',
                    },
                    {
                        title: 'data',
                        badge: '構造',
                        body: '各タブの文言、カード、導線は型付きの静的データとして分ける。',
                        tone: 'emerald',
                    },
                    {
                        title: '選んだタブだけ描画',
                        badge: 'UI状態',
                        body: '全タブ内容を1枚に縦並びせず、選んだタブの内容だけを表示する。',
                        tone: 'amber',
                    },
                ],
            },
            {
                title: '表示データの持ち方',
                lead: 'IDEA BOARD段階ではDBやAPIへ接続せず、画面で確認する構想だけを静的に持ちます。',
                items: [
                    'RouteはInertia Pageを返すだけにする。',
                    'タブ、カード、導線、表示候補はTypeScriptの型で固定する。',
                    '保存処理、API通信、DB取得、権限判断は持たせない。',
                    'カレンダーは各カードが日付を持った後に別で扱う。',
                ],
            },
            {
                title: '将来PRODUCT化する場合の責務',
                lead: '本実装へ進む場合は、Reactへ業務判断を置かず、Backend側の責務へ分けます。',
                cards: productResponsibilityCards,
            },
            {
                title: 'Reactへ置かない判断',
                lead: '完了判定や業務状態の最終判断は、表示の都合でComponentへ押し込みません。',
                items: [
                    '完了判定や状態判断は将来Service側で扱う。',
                    'DTOは判断本体ではなく、確定済み値の受け渡し境界として扱う。',
                    'PresenterはInertia propsや表示用配列を整える責務に分ける。',
                    'Componentは受け取った表示用propsとUI状態を描画する。',
                ],
            },
        ],
    },
] as const;

export function getIdeaBoardTabById(tabId: IdeaBoardTabId): IdeaBoardTab {
    return ideaBoardTabs.find((tab) => tab.id === tabId) ?? ideaBoardTabs[0];
}
