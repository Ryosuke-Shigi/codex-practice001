export type IdeaBoardTabId = 'overview' | 'top' | 'project' | 'coding';

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
    '概要',
    'TOP',
    '案件',
    'Coding',
] as const;

export const overviewCards: readonly IdeaBoardCard[] = [
    {
        title: 'LumiLaboは上位プロダクト',
        badge: '親ドメイン',
        body: 'LumiLaboを案件管理機能そのものとして扱わず、最初のサブシステムとして案件システムを置く。',
        tone: 'lemon',
    },
    {
        title: '今回作るもの',
        badge: 'IDEA BOARD',
        body: '案件作成MOCKへ進む前に、項目、考え方、表示方針、未確定事項を確認する。',
        tone: 'sky',
    },
    {
        title: '今回作らないもの',
        badge: '境界',
        body: 'MOCK、PRODUCT、保存可能フォーム、DB、Backend、API通信、カレンダーへ進まない。',
        tone: 'slate',
    },
    {
        title: 'カレンダーの扱い',
        badge: '後続',
        body: 'カレンダーは、案件、工程、入金、出金、請求などの各カードが日付を持った後に検討する。',
        tone: 'emerald',
    },
] as const;

export const topEntryCards: readonly IdeaBoardCard[] = [
    {
        title: '案件作成へ進む入口',
        badge: '主入口',
        body: '案件システムへ入った直後は、最初の入力入口である案件作成へ進む考え方を主に見せる。',
        tone: 'lemon',
    },
    {
        title: '親導線の確認',
        badge: '最低限',
        body: 'LumiLabo Hubから案件システムへ入る位置づけだけを示し、完成画面MOCKにはしない。',
        tone: 'sky',
    },
    {
        title: '後続の余白',
        badge: '後続',
        body: '案件一覧、案件詳細、工程は後続として見えるだけに留め、TOPタブで作り込まない。',
        tone: 'slate',
    },
] as const;

export const projectCreateInputCandidates: readonly IdeaBoardCard[] = [
    {
        title: '会社名',
        badge: '入力対象',
        body: '案件作成の主情報として扱う。初期項目に案件名を勝手に追加しない。',
        tone: 'sky',
    },
    {
        title: '担当者名',
        badge: '入力対象',
        body: '会社側の担当者として扱う。誰と話している案件かを後続で確認できるようにする。',
        tone: 'sky',
    },
    {
        title: '住所',
        badge: '入力対象',
        body: 'テキストのまま扱う。郵便番号、都道府県、市区町村へ勝手に分割しない。',
        tone: 'sky',
    },
    {
        title: 'メモ',
        badge: '任意入力',
        body: '業務補足を置く任意入力として扱う。保存可能フォームや入力フォームMOCKは作らない。',
        tone: 'sky',
    },
] as const;

export const projectCreateDisplayCandidates: readonly IdeaBoardCard[] = [
    {
        title: '登録日表示',
        badge: '表示対象',
        body: '入力欄にしない。将来PRODUCTでは created_at 表示相当として扱う。',
        tone: 'emerald',
    },
    {
        title: 'ステータス初期表示',
        badge: '表示対象',
        body: '初期表示は「進行中」候補。今回は保存処理もステータス変更UIも作らない。',
        tone: 'emerald',
    },
] as const;

export const projectCreateNotInputItems = [
    '登録日',
    '案件名',
    '郵便番号 / 都道府県 / 市区町村などへ分割した住所',
    'ステータス変更UI',
    '保存処理',
    '工程カード情報',
    'カレンダー情報',
    '完了判定に関わる情報',
] as const;

export const projectStatusConceptItems = [
    '初期表示は「進行中」候補に留める。',
    'キャンセル / 失注などを初期画面へ細かく増やしすぎない。',
    '今回は「進行中 / 完了 / 終了」の概念整理までに留める。',
    'ステータス変更UIや完了判定は作らない。',
] as const;

export const projectListFutureCards: readonly IdeaBoardCard[] = [
    {
        title: '会社名',
        badge: '表示候補',
        body: '登録後に作成した案件を見つけるための主情報として扱う。',
        tone: 'lemon',
    },
    {
        title: '担当者名',
        badge: '表示候補',
        body: '会社側の担当者を一覧で確認する候補にする。',
        tone: 'lemon',
    },
    {
        title: 'ステータス',
        badge: '表示候補',
        body: '状態は色だけではなく「進行中」などの文字でも表示する方針にする。',
        tone: 'lemon',
    },
    {
        title: '登録日',
        badge: '表示候補',
        body: 'created_at 表示相当を一覧の確認情報として扱う候補にする。',
        tone: 'lemon',
    },
    {
        title: '住所の短い表示候補',
        badge: '表示候補',
        body: '住所全文を詰め込まず、一覧では短く確認できる余地だけを示す。',
        tone: 'lemon',
    },
    {
        title: 'メモの有無 / 短いメモ表示候補',
        badge: '表示候補',
        body: 'メモがあるか、短い補足を見せるかを後続の一覧画面で検討する。',
        tone: 'lemon',
    },
] as const;

const projectDetailFutureCards: readonly IdeaBoardCard[] = [
    {
        title: '案件基本情報',
        badge: '後続',
        body: '会社名、担当者名、住所、メモ、登録日、ステータスを将来の詳細で確認する余地だけを残す。',
        tone: 'sky',
    },
    {
        title: '工程デッキ / 工程カードへの入口',
        badge: '後続',
        body: '工程デッキや工程カードは案件詳細以降の領域として扱い、今回のIDEA BOARDでは実装しない。',
        tone: 'slate',
    },
    {
        title: '状態判断は持ち込まない',
        badge: '境界',
        body: '工程カードの状態変更、完了判定、スルー判定は今回扱わない。',
        tone: 'rose',
    },
] as const;

const productResponsibilityCards: readonly IdeaBoardCard[] = [
    {
        title: 'Controller',
        badge: 'HTTP入口',
        body: '将来PRODUCT化する場合のHTTP入口。今回は作らない。',
        tone: 'slate',
    },
    {
        title: 'Request',
        badge: '入力形式',
        body: '入力形式バリデーションの境界。今回は作らない。',
        tone: 'slate',
    },
    {
        title: 'Action',
        badge: '手順',
        body: '1ユースケースの手順を担当する境界。今回は作らない。',
        tone: 'slate',
    },
    {
        title: 'Service',
        badge: '判断',
        body: '業務判断、状態判断、完了判定を担当する境界。React Componentへ置かない。',
        tone: 'slate',
    },
    {
        title: 'Repository',
        badge: 'DB境界',
        body: 'DB取得や保存の境界。IDEA BOARD段階では持たせない。',
        tone: 'slate',
    },
    {
        title: 'DTO',
        badge: 'データ境界',
        body: 'レイヤー間データの受け渡し。判断本体として扱わない。',
        tone: 'slate',
    },
    {
        title: 'Presenter / Responder',
        badge: '表示整形',
        body: 'Inertia propsなど表示用整形の境界。Reactへ業務判断を寄せない。',
        tone: 'slate',
    },
] as const;

export const ideaBoardTabs: readonly IdeaBoardTab[] = [
    {
        id: 'overview',
        label: '概要',
        kicker: '案件作成IDEA BOARD概要',
        title: '案件作成MOCKへ進む前に、項目と考え方を固める',
        lead: '今回の中心は案件作成IDEA BOARDです。案件システム全体の完成画面ではなく、次の案件作成MOCKへ進むための整理に絞ります。',
        sections: [
            {
                title: '今回の位置づけ',
                lead: 'LumiLabo、案件システム、案件作成IDEA BOARDの親子関係を確認します。',
                cards: overviewCards,
            },
            {
                title: '今回やらない範囲',
                lead: 'IDEA BOARDを越えてMOCK、PRODUCT、本実装へ進まないための境界です。',
                items: [
                    '入力フォームMOCKや保存可能フォームは作らない。',
                    '固定データ付き一覧MOCKは作らない。',
                    '案件詳細画面、工程詳細画面、工程デッキ、工程カードは作らない。',
                    'DB、Migration、Backend本実装、API通信、Docker変更は行わない。',
                ],
            },
        ],
    },
    {
        id: 'top',
        label: 'TOP',
        kicker: '親導線としてのTOP',
        title: 'LumiLabo Hubから案件システムへ入る位置を最低限だけ示す',
        lead: 'TOPは完成画面MOCKではありません。案件システムへ入った直後の位置づけと、案件作成へ進む入口を主に示します。',
        sections: [
            {
                title: 'TOPで示すこと',
                lead: '親導線は最低限にし、案件詳細や工程デッキをここで作り込みません。',
                cards: topEntryCards,
            },
            {
                title: '後続として見えるもの',
                lead: '案件一覧、案件詳細、工程は後続の余白として扱います。',
                items: [
                    '案件一覧は、登録後に作成した案件を確認する後続画面候補。',
                    '案件詳細は、案件基本情報と工程への入口を扱う後続画面候補。',
                    '工程デッキ / 工程カードは、案件詳細以降の後続領域。',
                    'カレンダーは、各カードが日付を持った後に検討する。',
                ],
            },
        ],
    },
    {
        id: 'project',
        label: '案件',
        kicker: '案件タブ内セクション',
        title: '登録を主対象に、一覧と詳細は後続として整理する',
        lead: '案件タブはルート案内ではありません。登録、一覧、詳細をセクションとして分け、今回の主対象である登録を中心に整理します。',
        sections: [
            {
                title: '登録',
                lead: '今回の主対象です。案件作成はLumiLabo案件システムの最初の入力入口として扱います。',
                cards: [
                    ...projectCreateInputCandidates,
                    ...projectCreateDisplayCandidates,
                ],
                note: '登録日表示は入力欄にせず、ステータス初期表示は「進行中」候補に留めます。',
            },
            {
                title: '登録へ混ぜないもの',
                lead: '初期項目や初期画面へ勝手に増やさないものです。',
                items: projectCreateNotInputItems,
            },
            {
                title: 'ステータスの扱い',
                lead: 'キャンセル / 失注などを初期画面に細かく増やしすぎないための整理です。',
                items: projectStatusConceptItems,
            },
            {
                title: '一覧',
                lead: '一覧は後続セクションです。上位タブにはせず、一覧画面そのものや固定データMOCKも作りません。',
                cards: projectListFutureCards,
                note: '後続の一覧画面では、1案件 = 1カードのモバイルファースト構想にする余地だけを示します。詳細へ進む操作はアイコンだけにしない方針です。',
            },
            {
                title: '詳細',
                lead: '詳細は後続セクションです。今回、案件詳細画面や工程デッキ / 工程カードは作りません。',
                cards: projectDetailFutureCards,
            },
        ],
    },
    {
        id: 'coding',
        label: 'Coding',
        kicker: 'IDEA BOARDの構成方針',
        title: '案件作成IDEA BOARDを、表示だけのReact構成として保つ',
        lead: 'Codingタブは、IDEA BOARD段階のPage / Component / data分離と、将来PRODUCT化する場合の責務境界を整理します。',
        sections: [
            {
                title: 'Page / Component / data',
                lead: 'React Componentはタブ切り替えと選択中タブの表示だけを担当します。',
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
                        body: 'タブ切り替え、選択中タブの描画、カード/リスト表示だけを担当する。',
                        tone: 'sky',
                    },
                    {
                        title: 'data',
                        badge: '静的データ',
                        body: '表示文言、カード内容、セクション構成は型付き静的データに分ける。',
                        tone: 'emerald',
                    },
                    {
                        title: '業務判断を置かない',
                        badge: '境界',
                        body: 'ComponentにDB、Backend、API通信、保存処理、完了判定を持たせない。',
                        tone: 'amber',
                    },
                ],
            },
            {
                title: '将来PRODUCT化する場合の責務境界',
                lead: 'PRODUCT化する場合の責務だけを示し、今回のPRでは本実装へ進みません。',
                cards: productResponsibilityCards,
            },
            {
                title: 'Reactへ置かない判断',
                lead: '完了判定や業務状態の最終判断は、将来Service側で扱います。',
                items: [
                    '保存処理、API通信、DB取得、権限判断は持たせない。',
                    '完了判定や状態判断は将来Service側で扱う。',
                    'DTOは判断本体ではなく、確定済み値の受け渡し境界として扱う。',
                    'Presenter / ResponderはInertia propsなど表示用配列を整える責務に分ける。',
                ],
            },
        ],
    },
] as const;

export function getIdeaBoardTabById(tabId: IdeaBoardTabId): IdeaBoardTab {
    return ideaBoardTabs.find((tab) => tab.id === tabId) ?? ideaBoardTabs[0];
}