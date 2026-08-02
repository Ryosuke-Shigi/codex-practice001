export type IdeaBoardTabId =
    | 'overview'
    | 'flow'
    | 'feature'
    | 'screens'
    | 'diagram'
    | 'graph'
    | 'code';

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

export type IdeaBoardFlowStep = {
    label: string;
    description: string;
    badge?: string;
    state?: 'current' | 'candidate';
};

export type IdeaBoardDiagramGroup = {
    title: string;
    description: string;
    nodes: readonly IdeaBoardCard[];
};

export type IdeaBoardGraphBar = {
    label: string;
    value: number;
    description: string;
    tone?: IdeaBoardTone;
};

export type IdeaBoardScreenCandidate = {
    title: string;
    role: string;
    mockFocus: readonly string[];
    boundary: string;
};

export type IdeaBoardCodeNote = {
    title: string;
    description: string;
    items: readonly string[];
};

export type IdeaBoardBlock =
    | { type: 'cards'; title: string; lead: string; cards: readonly IdeaBoardCard[]; note?: string }
    | { type: 'list'; title: string; lead: string; items: readonly string[]; note?: string }
    | { type: 'flow'; title: string; lead: string; steps: readonly IdeaBoardFlowStep[]; note?: string }
    | { type: 'diagram'; title: string; lead: string; groups: readonly IdeaBoardDiagramGroup[]; note?: string }
    | { type: 'graph'; title: string; lead: string; caption: string; bars: readonly IdeaBoardGraphBar[]; note?: string }
    | { type: 'screens'; title: string; lead: string; screens: readonly IdeaBoardScreenCandidate[]; note?: string }
    | { type: 'code'; title: string; lead: string; notes: readonly IdeaBoardCodeNote[]; note?: string };

export type IdeaBoardTag = {
    id: string;
    label: string;
    title: string;
    lead: string;
    blocks: readonly IdeaBoardBlock[];
};

export type IdeaBoardTab = {
    id: IdeaBoardTabId;
    label: string;
    kicker: string;
    title: string;
    lead: string;
    tags: readonly IdeaBoardTag[];
};

export const requiredTabLabels = [
    '概要',
    'フロー',
    '機能説明',
    '画面候補',
    '図解',
    'グラフ',
    'code',
] as const;

export const initialActiveTagIds: Record<IdeaBoardTabId, string> = {
    overview: 'positioning',
    flow: 'main-flow',
    feature: 'project-system',
    screens: 'mock-phase',
    diagram: 'product-map',
    graph: 'concept-expansion',
    code: 'boundary',
};

export const projectInitialFieldLabels = [
    '会社名',
    '担当者名',
    '登録日表示',
    '住所',
    'メモ',
    'ステータス表示',
] as const;

export const projectStatusConceptItems = [
    '進行中: 初期作成後に動いている案件として扱う。',
    '完了: 必要な業務フローを通り切った状態として扱う。',
    '終了: キャンセル、失注、対象外など途中で閉じた状態を含み得る。',
] as const;

export const processCardStatusItems = [
    '未実行: まだ対応していない工程カード。',
    'スルー: この案件では不要だと明示した工程カード。',
    '実行済: 実際に対応した工程カード。',
] as const;

export const screenCandidateLabels = [
    'TOP',
    '案件登録',
    '案件一覧',
    '案件詳細',
] as const;

const positionCards: readonly IdeaBoardCard[] = [
    {
        title: 'LumiLabo は上位プロダクト',
        badge: '親',
        body: '単なる案件管理機能ではなく、複数のサブシステムを置ける上位プロダクトとして説明します。',
        tone: 'lemon',
    },
    {
        title: '最初のサブシステムは案件システム',
        badge: '最初',
        body: '最初に扱う入口を案件システムに絞り、案件登録、案件一覧、案件詳細へ進む考え方を整理します。',
        tone: 'sky',
    },
    {
        title: '後から広がる余地を残す',
        badge: '候補',
        body: '工程デッキ、工程カード、見積、元調、請求、発注、カレンダーは拡張候補として扱い、確定PRODUCT仕様とは断定しません。',
        tone: 'emerald',
    },
];

const projectFieldCards: readonly IdeaBoardCard[] = [
    {
        title: '会社名',
        badge: '入力対象',
        body: '案件登録の主情報です。案件名は初期固定項目へ追加しません。',
        tone: 'sky',
    },
    {
        title: '担当者名',
        badge: '入力対象',
        body: '会社側の担当者として扱い、誰と話している案件かを確認できるようにします。',
        tone: 'sky',
    },
    {
        title: '登録日表示',
        badge: '表示対象',
        body: 'ユーザー入力ではなく、将来PRODUCTでは created_at 表示相当として扱います。',
        tone: 'emerald',
    },
    {
        title: '住所',
        badge: '入力対象',
        body: '初期段階ではテキスト入力に留め、郵便番号、都道府県、市区町村へ分割しません。',
        tone: 'sky',
    },
    {
        title: 'メモ',
        badge: '入力対象',
        body: '業務補足を残す任意入力です。工程カード情報や完了判定は混ぜません。',
        tone: 'sky',
    },
    {
        title: 'ステータス表示',
        badge: '表示対象',
        body: '進行中、完了、終了の考え方を説明します。キャンセル / 失注を初期ステータスとして増やしません。',
        tone: 'emerald',
    },
];

const mainFlowSteps: readonly IdeaBoardFlowStep[] = [
    { label: 'LumiLabo', badge: '上位', description: '複数のサブシステムを束ねる上位プロダクト。', state: 'current' },
    { label: '案件システム', badge: '最初', description: '最初に作るサブシステム。案件を起点に扱う。', state: 'current' },
    { label: '案件登録', description: '会社名、担当者名、住所、メモを入力対象として考える。', state: 'current' },
    { label: '案件一覧', description: '登録済み案件をカード型リストで確認する考え方。', state: 'current' },
    { label: '案件詳細', description: '1件の案件基本情報と後続工程への入口になる画面候補。', state: 'candidate' },
    { label: '工程デッキ', badge: '拡張候補', description: '初回対応、追加対応、別ルート対応などを分ける中間実体の候補。', state: 'candidate' },
    { label: '工程カード', badge: '拡張候補', description: '見積、元調、請求、発注などを後から追加できるカード候補。', state: 'candidate' },
];

const screenCandidates: readonly IdeaBoardScreenCandidate[] = [
    {
        title: 'TOP',
        role: 'LumiLaboから案件システムへ入った最初の現在位置を見せる候補。',
        mockFocus: ['案件登録へ進む入口', '案件一覧を見る入口', '後続サブシステムへ広がる余白'],
        boundary: 'TOP画面の実UIはこのIDEA BOARDでは作り込みません。',
    },
    {
        title: '案件登録',
        role: '最初の入力入口として、会社名、担当者名、住所、メモを扱う画面候補。',
        mockFocus: ['入力対象と表示対象の分離', '登録日を入力欄にしない見せ方', '主要操作の分かりやすさ'],
        boundary: '保存可能フォーム、DB保存、ステータス変更UIは作りません。',
    },
    {
        title: '案件一覧',
        role: '登録済み案件を見つけ、詳細へ進む入口になる画面候補。',
        mockFocus: ['モバイルの1案件1カード', '会社名と担当者名の見せ方', 'ステータスを文字でも見せる方針'],
        boundary: '固定データ付き一覧MOCK、検索、絞り込み、ソート実装は作りません。',
    },
    {
        title: '案件詳細',
        role: '1件の基本情報と、将来の工程デッキへ進む入口になる画面候補。',
        mockFocus: ['基本情報と工程入口の分け方', '工程デッキへ広げる余地', '工程詳細を詰め込まない構成'],
        boundary: '案件詳細の実画面、工程詳細、工程カード実装は作りません。',
    },
];

const conceptGraphBars: readonly IdeaBoardGraphBar[] = [
    { label: '案件基本情報', value: 36, description: '会社名、担当者名、住所、メモ、登録日表示、ステータス表示を扱う初期範囲。', tone: 'lemon' },
    { label: '工程デッキ', value: 58, description: '初回対応、追加対応、別ルート対応などを分ける拡張候補。', tone: 'sky' },
    { label: '工程カード', value: 76, description: '見積、元調、請求、発注などをカードとして追加していく候補。', tone: 'emerald' },
    { label: '横断ビュー', value: 92, description: 'カレンダーや横断確認で見える情報量が増える将来候補。', tone: 'amber' },
];

export const ideaBoardTabs: readonly IdeaBoardTab[] = [
    {
        id: 'overview',
        label: '概要',
        kicker: 'LumiLaboの位置づけ',
        title: '案件システムから始める上位プロダクトとして説明する',
        lead: 'LumiLaboを案件管理単体ではなく、案件を起点に複数のサブシステムへ広げられる上位プロダクトとして整理します。',
        tags: [
            {
                id: 'positioning',
                label: '位置づけ',
                title: 'LumiLaboと案件システムの親子関係',
                lead: 'お客様に最初に伝えるのは、LumiLabo全体の中で案件システムがどこにあるかです。',
                blocks: [{ type: 'cards', title: '上位プロダクトとしてのLumiLabo', lead: '最初の実装候補は案件システムですが、LumiLabo自体はその上にある入れ物として説明します。', cards: positionCards }],
            },
            {
                id: 'value',
                label: '価値',
                title: '案件から始めることで分かりやすくする',
                lead: '案件を起点にすると、入力、確認、詳細、工程への広がりを段階的に説明できます。',
                blocks: [{ type: 'cards', title: 'お客様に伝える価値', lead: 'どこから始めるか、何を後から広げるかを分けて見せます。', cards: [
                    { title: '入口が分かる', badge: '入口', body: 'まず案件を登録し、一覧で確認し、詳細から後続工程へ進む流れを理解できます。', tone: 'lemon' },
                    { title: '情報を増やせる', badge: '起点', body: '案件基本情報を起点に、後から工程単位の情報を増やす考え方を示します。', tone: 'sky' },
                    { title: '未確定を分ける', badge: '境界', body: '工程デッキや横断カレンダーは便利な広がりとして見せ、今回の範囲とは分けます。', tone: 'slate' },
                ] }],
            },
            {
                id: 'scope',
                label: '範囲',
                title: '今回扱う範囲と扱わない範囲',
                lead: 'IDEA BOARDは機能説明資料です。MOCK、PRODUCT、Backend実装へ進まない境界を明示します。',
                blocks: [
                    { type: 'list', title: '扱うこと', lead: 'お客様向けに機能の目的、価値、流れ、構造を伝えます。', items: ['LumiLaboが上位プロダクトであること。', '最初のサブシステムが案件システムであること。', '案件登録、案件一覧、案件詳細へ進む考え方。', '将来の工程デッキ、工程カード、横断ビューへ広げる余地。'] },
                    { type: 'list', title: '作らないこと', lead: '画面そのものや本番実装は、次のMOCK / PRODUCT段階で扱います。', items: ['MOCK画面、保存可能フォーム、固定データ付き一覧。', 'DB / Migration / API / Backend層。', '工程デッキ、工程カード、カレンダーの確定PRODUCT仕様。', '案件名、住所分割、キャンセル / 失注ステータスの初期固定追加。'] },
                ],
            },
        ],
    },
    {
        id: 'flow',
        label: 'フロー',
        kicker: '流れの説明',
        title: 'LumiLaboから案件、案件から工程候補へ進む流れを見せる',
        lead: '実装済み導線と将来候補を混同せず、最初の案件システムから後続候補へ広がる流れを図として見せます。',
        tags: [
            { id: 'main-flow', label: '基本導線', title: 'LumiLaboから案件システムへ入る基本フロー', lead: 'どの順番で機能が広がるかを追える構成にします。', blocks: [{ type: 'flow', title: '概念フローチャート', lead: '現在の説明対象と、今後広げる余地を分けて並べます。', steps: mainFlowSteps, note: '工程デッキ以降は拡張候補です。今回のIDEA BOARDでは画面やデータ構造を確定しません。' }] },
            { id: 'status-flow', label: '状態', title: '案件ステータスと工程カード状態の違い', lead: '案件そのものの状態と、工程カードごとの状態を分けて説明します。', blocks: [
                { type: 'list', title: '案件ステータス', lead: '初期案は進行中、完了、終了の3つです。完了と終了は分けて扱います。', items: projectStatusConceptItems },
                { type: 'list', title: '工程カード状態', lead: 'スルーを未実行ではなく「この案件では不要」と分けて見せます。', items: processCardStatusItems },
            ] },
            { id: 'future-flow', label: '拡張候補', title: '後から広げられる余地', lead: '将来候補は便利な広がりとして見せますが、PRODUCT確定仕様とは断定しません。', blocks: [{ type: 'cards', title: '今後広げる余地', lead: '案件詳細以降に増やせる候補を、初期範囲と分けて説明します。', cards: [
                { title: '工程デッキ', badge: '候補', body: '初回対応、追加対応、別ルート対応などを分ける中間実体として検討します。', tone: 'sky' },
                { title: '工程カード', badge: '候補', body: '見積、元調、請求、発注などを案件に直接hasManyでぶら下げるだけにせず、工程デッキ配下で扱う考え方です。', tone: 'emerald' },
                { title: '横断カレンダー', badge: '候補', body: '予定日、登録日、請求予定などを横断して見られる可能性がありますが、初期PRODUCT仕様ではありません。', tone: 'amber' },
            ] }] },
        ],
    },
    {
        id: 'feature',
        label: '機能説明',
        kicker: '案件システムの考え方',
        title: '案件を起点に登録、一覧、詳細へ進む考え方を説明する',
        lead: '入力項目、状態、工程デッキ / 工程カードの位置づけを、お客様向けの機能説明として整理します。',
        tags: [
            { id: 'project-system', label: '案件', title: '案件システムで扱う基本情報', lead: '初期に扱う案件項目を固定し、未確認の項目を勝手に増やさない方針を示します。', blocks: [{ type: 'cards', title: '1案件として扱う初期情報', lead: '入力対象と表示対象を混ぜず、お客様が最初に確認したい情報へ絞ります。', cards: projectFieldCards }] },
            { id: 'states', label: '状態', title: '完了と終了を分けて扱う', lead: '状態名は少なく始め、意味が違うものを同じ言葉にしないよう整理します。', blocks: [
                { type: 'list', title: '案件ステータス初期案', lead: 'キャンセル / 失注は終了に含み得る説明に留め、初期ステータスとして増やしません。', items: projectStatusConceptItems },
                { type: 'list', title: '画面側に置かない判断', lead: '完了判定などの業務判断は、将来PRODUCT段階ではService側へ置く考え方です。', items: ['React Componentは表示とUI状態を担当する。', '完了判定、状態判断、スルー判定の最終判断はComponentへ押し込まない。', 'Presenter / Responderは表示用propsを整える境界として扱う。'] },
            ] },
            { id: 'process-deck', label: '工程', title: '案件と工程カードの間に工程デッキを挟む', lead: '案件から見積、元調、請求、発注を直接ぶら下げるだけの説明にせず、中間実体の考え方を示します。', blocks: [
                { type: 'cards', title: '工程デッキ / 工程カードの役割', lead: '構造の考え方だけを説明し、実装やDB設計には進みません。', cards: [
                    { title: '工程デッキ', badge: '中間', body: '初回対応、追加対応、別ルート対応などを分けるためのまとまりとして説明します。', tone: 'sky' },
                    { title: '工程カード', badge: '追加', body: '見積、元調、請求、発注などを後から追加できるカードとして扱います。', tone: 'emerald' },
                    { title: 'カードステータス', badge: '状態', body: '未実行、スルー、実行済の3つを考え方として説明します。', tone: 'amber' },
                ] },
                { type: 'list', title: '工程カード状態', lead: 'スルーを「まだやっていない」ではなく「この案件では不要」と分けて見せます。', items: processCardStatusItems },
            ] },
        ],
    },
    {
        id: 'screens',
        label: '画面候補',
        kicker: '次のMOCKへ渡す候補',
        title: '画面そのものではなく、次に確認する画面候補を整理する',
        lead: 'TOP、案件登録、案件一覧、案件詳細をMOCKフェーズで確認する候補として説明し、ここでは実画面を作り込みません。',
        tags: [
            { id: 'mock-phase', label: '次のMOCK', title: 'MOCKフェーズで確認する画面候補', lead: '画面候補は説明カードとして並べ、フォームUIや一覧UIを実画面レベルでは作りません。', blocks: [{ type: 'screens', title: '画面候補一覧', lead: '各画面で何を確認するか、何をまだ作らないかを分けます。', screens: screenCandidates, note: 'IDEA BOARDからMOCK画面への通常リンクは作りません。' }] },
            { id: 'screen-boundary', label: '境界', title: '画面候補とMOCK画面を混ぜない', lead: 'このタブは、次にMOCKで確認したいものを整理する場所です。', blocks: [{ type: 'list', title: '画面候補タブでしないこと', lead: '実画面リンク集やフォームUIではなく、説明カードに留めます。', items: ['TOP画面、案件登録画面、案件一覧画面、案件詳細画面を作り込まない。', '入力欄、保存ボタン、検索、絞り込みを操作可能UIとして置かない。', '画面候補を未確定PRODUCT仕様として断定しない。', 'MOCKからIDEA BOARDへ戻る通常導線を作らない。'] }] },
        ],
    },
    {
        id: 'diagram',
        label: '図解',
        kicker: '構造の見える化',
        title: 'LumiLabo、案件システム、工程候補の関係を図解する',
        lead: '文章だけでなく、親子関係、案件から工程デッキへの構造、横断候補を図として見せます。',
        tags: [
            { id: 'product-map', label: 'プロダクト', title: 'LumiLabo配下にサブシステムが増える構造', lead: '案件システムは最初のサブシステムであり、後から別システムが並ぶ余地があります。', blocks: [{ type: 'diagram', title: 'プロダクト構造図', lead: '上位プロダクトとサブシステムを分けて見せます。', groups: [
                { title: 'LumiLabo', description: '上位プロダクト / 上位ドメイン。', nodes: [{ title: '案件システム', badge: '最初', body: '最初に扱うサブシステム。', tone: 'lemon' }, { title: '別サブシステム', badge: '余地', body: '後から並べられる候補。', tone: 'slate' }] },
                { title: '横断候補', description: '初期PRODUCT仕様ではなく、今後広げる余地。', nodes: [{ title: '共通カレンダー', badge: '候補', body: '予定や期限を横断して見せる候補。', tone: 'amber' }, { title: '横断ビュー', badge: '候補', body: '複数サブシステムをまたいで確認する候補。', tone: 'sky' }] },
            ] }] },
            { id: 'case-structure', label: '案件構造', title: '案件から工程デッキ、工程カードへ広げる構造', lead: '案件にすべてを直接ぶら下げるのではなく、工程デッキを挟む考え方を図解します。', blocks: [{ type: 'diagram', title: '案件構造図', lead: '工程デッキと工程カードは拡張候補として見せます。', groups: [
                { title: '案件', description: '会社名、担当者名、住所、メモ、登録日表示、ステータス表示を持つ起点。', nodes: [{ title: '案件詳細', badge: '候補', body: '1件の基本情報と工程入口。', tone: 'lemon' }] },
                { title: '工程デッキ', description: '初回対応、追加対応、別ルート対応などを分ける中間候補。', nodes: [{ title: '見積カード', badge: 'カード', body: '未実行 / スルー / 実行済。', tone: 'sky' }, { title: '元調カード', badge: 'カード', body: '必要な案件だけ扱える候補。', tone: 'emerald' }, { title: '請求カード', badge: 'カード', body: '後続工程として追加できる候補。', tone: 'amber' }, { title: '発注カード', badge: 'カード', body: '別ルート対応にも広げられる候補。', tone: 'rose' }] },
            ] }] },
        ],
    },
    {
        id: 'graph',
        label: 'グラフ',
        kicker: '概念グラフ',
        title: '実績値ではなく、見え方のイメージとしてグラフを使う',
        lead: 'グラフは実績データに見せず、案件から工程カードへ広がる情報量や状態の見え方を概念図として説明します。',
        tags: [
            { id: 'concept-expansion', label: '広がり', title: '案件から工程カードへ広がるイメージ', lead: '数値は実績ではなく、説明用のイメージです。', blocks: [{ type: 'graph', title: '情報量の広がり', lead: '案件基本情報から、工程デッキ、工程カード、横断ビューへ広がる概念を棒で見せます。', caption: '概念図 / イメージ。売上、件数、割合などの実績値ではありません。', bars: conceptGraphBars }] },
            { id: 'status-image', label: '状態', title: '対応状況の見え方イメージ', lead: '工程カードの状態を、色だけでなく文字と説明で見せる方向性を示します。', blocks: [{ type: 'graph', title: '工程カード状態の見え方', lead: '未実行、スルー、実行済が同じ画面で判別できることを説明する概念グラフです。', caption: '概念図 / イメージ。実案件の割合ではありません。', bars: [
                { label: '未実行', value: 48, description: '対応が残っているカードとして強調する候補。', tone: 'amber' },
                { label: 'スルー', value: 32, description: '不要だと明示したカードとして、未実行とは分ける候補。', tone: 'slate' },
                { label: '実行済', value: 72, description: '対応済みのカードとして確認できる候補。', tone: 'emerald' },
            ] }] },
        ],
    },
    {
        id: 'code',
        label: 'code',
        kicker: '補助メモ',
        title: '実装コードではなく、責務境界だけを短く確認する',
        lead: 'codeタブは補助です。お客様向け説明を主役にし、DB、Migration、API、Backend層へ進みません。',
        tags: [
            { id: 'boundary', label: '責務', title: '今回のIDEA BOARDで守る責務境界', lead: '画面表示上の説明と、将来PRODUCT実装の責務を混ぜないための短いメモです。', blocks: [{ type: 'code', title: '補助メモ', lead: '実装コードを大量に載せず、境界だけを確認します。', notes: [
                { title: '既存導線', description: '既存Routeは `/lab/lumilabo-project-idea-board` を使います。', items: ['Project SelectのLumiLabo開発段階からIDEA BOARDへ入るdirect routeを維持する。', '旧 `/lab/lumilabo-project-create-idea-board` は既存redirectのまま扱う。'] },
                { title: 'React Component', description: 'タブと薄いファイルタグの選択状態、静的説明の描画だけを担当します。', items: ['業務判断、完了判定、保存処理は持たせない。', '表示文言、図解、概念グラフは型付き静的データに置く。'] },
                { title: '将来PRODUCT段階', description: '本実装へ進む場合はADR Patternに沿って責務を分けます。', items: ['Controller / Request / Action / Service / Repository / DTO / Responderは今回追加しない。', '完了判定や状態判断は将来Service側で扱う考え方に留める。'] },
            ] }] },
            { id: 'not-doing', label: '対象外', title: '今回作らないもの', lead: 'codeタブでも、作らないものを短く確認するだけに留めます。', blocks: [{ type: 'list', title: '対象外', lead: '今回の差分はIDEA BOARD周辺に閉じます。', items: ['MOCK画面作成。', 'TOP / 案件登録 / 案件一覧 / 案件詳細の実UI作成。', 'DB / Migration / Model / Controller / Request / Action / Service / Repository / DTO。', 'API通信、保存処理、Docker、本番反映。', 'LumiLabo以外の機能変更。'] }] },
        ],
    },
] as const;

export function getIdeaBoardTabById(tabId: IdeaBoardTabId): IdeaBoardTab {
    return ideaBoardTabs.find((tab) => tab.id === tabId) ?? ideaBoardTabs[0];
}

export function getIdeaBoardTagById(
    tabId: IdeaBoardTabId,
    tagId: string,
): IdeaBoardTag {
    const tab = getIdeaBoardTabById(tabId);

    return tab.tags.find((tag) => tag.id === tagId) ?? tab.tags[0];
}
