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

export const topEntryCards: readonly IdeaBoardCard[] = [
    {
        title: '案件作成へ進む入口',
        badge: '主入口',
        body: 'LumiLabo Hubから案件システムへ入った人が、最初の案件入力へ進む入口として置く。',
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
        title: '後続余白',
        badge: '後続',
        body: '案件詳細、工程、別サブシステムへ広げる余白だけを残し、TOPでは作り込まない。',
        tone: 'slate',
    },
] as const;

export const projectDefinitionCards: readonly IdeaBoardCard[] = [
    {
        title: '案件とは何か',
        badge: '定義',
        body: '会社とのやり取りを始めるための最小単位。会社名、担当者名、住所、メモ、登録日表示、ステータス表示を初期情報として扱う。',
        tone: 'lemon',
    },
    {
        title: '何を1案件として扱うか',
        badge: '単位',
        body: '1つの会社・担当者・住所・補足メモを持つ業務の起点として扱う。案件名は初期項目へ勝手に追加しない。',
        tone: 'sky',
    },
    {
        title: '案件システムで扱うこと',
        badge: '範囲',
        body: '案件作成、案件一覧、将来の案件詳細へつなげるための情報を整理する。カレンダーや工程実装はここへ混ぜない。',
        tone: 'emerald',
    },
    {
        title: 'LumiLabo内の位置づけ',
        badge: '親子関係',
        body: 'LumiLaboは上位プロダクトであり、案件システムは最初のサブシステムとして扱う。',
        tone: 'slate',
    },
] as const;

export const projectSystemScopeItems = [
    '案件作成は、最初の入力入口として会社名、担当者名、住所、メモを受ける。',
    '案件一覧は、作成済み案件をカード型リストで確認する後続画面構想を扱う。',
    '案件詳細は、案件基本情報と工程デッキ / 工程カードへの入口になる後続領域として扱う。',
    '工程デッキ / 工程カードは案件から派生する後続領域であり、今回のIDEA BOARDでは作り込まない。',
] as const;

export const projectStatusConceptItems = [
    '初期作成時は「進行中」候補として扱う。',
    '完了は、必要な工程を通り切った状態として扱う。',
    '終了は、キャンセル、失注、対象外など途中で閉じる状態として扱う。',
    '今回はステータス変更UIや完了判定を作らない。',
] as const;

export const projectCreateInputCandidates: readonly IdeaBoardCard[] = [
    {
        title: '会社名',
        badge: '入力対象',
        body: '案件作成の主情報として扱う。案件名は初期項目へ勝手に追加しない。',
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
    '登録日入力',
    '案件名',
    '郵便番号 / 都道府県 / 市区町村などへ分割した住所',
    'ステータス変更UI',
    '保存処理',
    '工程カード情報',
    'カレンダー情報',
    '完了判定に関わる情報',
] as const;

export const projectListFutureCards: readonly IdeaBoardCard[] = [
    {
        title: '会社名',
        badge: '主表示',
        body: '1案件カードの主表示として扱う。登録後に作成した案件を見つけるための最初の手がかりにする。',
        tone: 'lemon',
    },
    {
        title: '担当者名',
        badge: '副情報',
        body: '会社側の担当者を一覧で確認する候補にする。',
        tone: 'lemon',
    },
    {
        title: 'ステータス',
        badge: '副情報',
        body: '状態は色だけではなく「進行中」などの文字でも表示する方針にする。',
        tone: 'lemon',
    },
    {
        title: '登録日',
        badge: '副情報',
        body: 'created_at 表示相当を一覧の確認情報として扱う候補にする。',
        tone: 'lemon',
    },
    {
        title: '住所の短い表示候補',
        badge: '補足',
        body: '住所全文を詰め込まず、一覧では短く確認できる余地だけを示す。',
        tone: 'lemon',
    },
    {
        title: 'メモの有無 / 短いメモ表示候補',
        badge: '補足',
        body: 'メモがあるか、短い補足を見せるかを後続の一覧画面で検討する。',
        tone: 'lemon',
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
                title: 'TOPで作り込まないもの',
                lead: 'TOPは長い導線説明ではなく、案件システムへ入った直後の位置づけを軽く見せる場所です。',
                items: [
                    '案件詳細や工程デッキをTOPで作り込まない。',
                    '固定データ付き一覧MOCKや入力フォームMOCKをTOPで作らない。',
                    'カレンダータブ、カレンダーMOCK、日付別カードカレンダーは作らない。',
                    '後続余白は示すが、詳細画面や工程画面の実装へ進まない。',
                ],
            },
        ],
    },
    {
        id: 'project',
        label: '案件',
        kicker: '案件システム概要',
        title: '案件とは何か、何を1案件として扱うかを整理する',
        lead: '案件タブは導線を見せる場所ではありません。案件の定義、扱う情報、状態、後続工程への起点を整理します。',
        sections: [
            {
                title: '案件とは何か',
                lead: 'LumiLabo案件システムで扱う案件の単位と、上位プロダクトとの関係を整理します。',
                cards: projectDefinitionCards,
            },
            {
                title: '案件システムで扱うこと',
                lead: '案件作成、案件一覧、案件詳細がそれぞれ何を担当するかを整理します。',
                items: projectSystemScopeItems,
            },
            {
                title: '1案件として扱う初期情報',
                lead: '初期情報は必要最小限にし、案件名や分割住所を勝手に増やしません。',
                items: [
                    '会社名',
                    '担当者名',
                    '住所',
                    '郵便番号、都道府県、市区町村へ勝手に分割しない',
                    'メモ',
                    '登録日表示',
                    'ステータス表示',
                ],
                note: '登録日は入力欄ではなく、将来PRODUCTでは created_at 表示相当として扱います。',
            },
            {
                title: '案件ステータス',
                lead: 'ステータスは初期表示候補だけを整理し、変更UIや完了判定には進みません。',
                items: projectStatusConceptItems,
            },
            {
                title: '後続工程の起点',
                lead: '案件は将来の工程デッキ / 工程カードの起点になります。ただし今回、工程の画面やカードは作りません。',
                items: [
                    '案件詳細は、案件基本情報と工程への入口を扱う後続領域。',
                    '工程デッキ / 工程カードは、案件詳細以降で扱う後続領域。',
                    '工程カードの状態変更、完了判定、スルー判定は今回扱わない。',
                ],
            },
        ],
    },
    {
        id: 'projectCreate',
        label: '案件作成',
        kicker: '最初の入力入口',
        title: '案件作成画面が何を受け取り、何を混ぜないかを考える',
        lead: '案件作成はLumiLabo案件システムの最初の入力入口です。入力対象と表示対象を分けて整理します。',
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
                title: '入力対象',
                lead: '案件作成で扱う入力対象です。案件名はここへ追加しません。',
                cards: projectCreateInputCandidates,
            },
            {
                title: '表示対象',
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
        title: '1件の案件をどう見せ、詳細へ進むかを考える',
        lead: '案件一覧タブは、案件作成後に作成済み案件をどう確認するかを整理する場所です。固定データMOCKや本実装にはしません。',
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
                        title: '1案件 = 1カード',
                        badge: 'モバイル',
                        body: 'モバイルでは横長テーブルではなく、カード型リストを基本にする。',
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
                title: '1件の案件カードで見せる候補',
                lead: '一覧画面そのものは作らず、将来確認したい項目だけを概念として見せます。',
                cards: projectListFutureCards,
                note: '状態は色だけでなく文字で表示し、詳細へ進む操作はアイコンだけにしない方針です。',
            },
            {
                title: '今回作らない一覧機能',
                lead: '一覧画面構想に留め、固定データMOCKやDB取得へ進みません。',
                items: [
                    '固定データ付き一覧MOCKは作らない。',
                    '検索 / 絞り込み / ソート実装は作らない。',
                    'DB取得やAPI通信は作らない。',
                    '案件詳細画面、工程詳細、工程デッキ、カレンダーは作らない。',
                ],
            },
        ],
    },
    {
        id: 'coding',
        label: 'Coding',
        kicker: 'IDEA BOARDの組み方',
        title: 'タブ構成、表示データ、将来の責務分離を分けて育てる',
        lead: 'Codingタブは、このIDEA BOARDをどう組み、PRODUCT化でどこへ責務を移すかを整理する場所です。',
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
                        badge: '静的データ',
                        body: '各タブの文言、カード、表示候補は型付きの静的データとして分ける。',
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
                    'タブ、カード、表示候補はTypeScriptの型で固定する。',
                    '保存処理、API通信、DB取得、権限判断は持たせない。',
                    'カレンダーは各カードが日付を持った後に別で扱う。',
                ],
            },
            {
                title: '将来PRODUCT化する場合の責務境界',
                lead: '本実装へ進む場合は、Reactへ業務判断を置かず、Backend側の責務へ分けます。',
                cards: productResponsibilityCards,
            },
            {
                title: 'Reactへ置かない判断',
                lead: '完了判定や業務状態の最終判断は、表示の都合でComponentへ押し込みません。',
                items: [
                    '完了判定や状態判断は将来Service側で扱う。',
                    'DTOは判断本体ではなく、確定済み値の受け渡し境界として扱う。',
                    'Presenter / ResponderはInertia propsなど表示用配列を整える責務に分ける。',
                    'Componentは受け取った表示用propsとUI状態を描画する。',
                ],
            },
        ],
    },
] as const;

export function getIdeaBoardTabById(tabId: IdeaBoardTabId): IdeaBoardTab {
    return ideaBoardTabs.find((tab) => tab.id === tabId) ?? ideaBoardTabs[0];
}
