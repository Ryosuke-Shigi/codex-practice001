export const codingModeIds = [
    'overview',
    'elements',
    'workflow',
    'example',
] as const;

export type CodingModeId = (typeof codingModeIds)[number];

export type CodingSectionId =
    | 'core'
    | 'income'
    | 'expense'
    | 'billing'
    | 'calendar';

export type CodingTone =
    | 'neutral'
    | 'income'
    | 'expense'
    | 'billing'
    | 'calendar'
    | 'success'
    | 'warning'
    | 'caution';

export type CodingElement = {
    name: string;
    detail: string;
};

export type CodingRow = {
    label: string;
    value: string;
    detail?: string;
    tone?: CodingTone;
};

export type CodingWorkflowChart = {
    title: string;
    chart: string;
    notes: string[];
};

export type CodingExampleCard = {
    label: string;
    title: string;
    meta: string;
    amount?: string;
    tone?: CodingTone;
};

export type CodingCalendarDay = {
    date: string;
    cards: Array<{
        type: '請求' | '入金' | '出金';
        title: string;
        amount: string;
        role: string;
        tone: 'normal' | 'caution' | 'warning' | 'success';
    }>;
    overflowLabel?: string;
};

export type CodingSectionMode = {
    title: string;
    lead: string;
    points: string[];
    rows?: CodingRow[];
    elements?: CodingElement[];
    workflows?: CodingWorkflowChart[];
    examples?: CodingExampleCard[];
    calendarDays?: CodingCalendarDay[];
    codeLines?: string[];
    callout?: {
        label: string;
        detail: string;
    };
};

export type CodingSection = {
    id: CodingSectionId;
    label: string;
    title: string;
    summary: string;
    tone: CodingTone;
    modes: Record<CodingModeId, CodingSectionMode>;
};

export const codingModeLabels: Record<CodingModeId, string> = {
    overview: '概要',
    elements: '要素',
    workflow: 'ワークフロー',
    example: '表示例',
};

const coreProjectionFlow = `flowchart TD
    Billing["BillingCardDetail 請求カード詳細"] --> Mapper["Mapper / Presenter"]
    Income["IncomeCardDetail 入金カード詳細"] --> Mapper
    Expense["ExpenseCardDetail 出金カード詳細"] --> Mapper
    Mapper --> Core["CoreCard カレンダー表示・集計用DTO"]
    Core --> Calendar["月カレンダー"]
    Core --> List["一覧表示"]
    Core --> Summary["月次集計"]
    Core --> Pie["円グラフ"]`;

const amountUpdateFlow = `flowchart TD
    Detail["Detail側の金額を変更"] --> Service["Service / Mapper / Projection更新"]
    Service --> CoreAmount["CoreCard.amountを同期"]
    CoreAmount --> Calendar["カレンダー表示へ反映"]
    CoreAmount --> Summary["月次集計へ反映"]
    CoreAmount --> Pie["円グラフへ反映"]`;

const calendarFlow = `flowchart TD
    CoreCards["CoreCard[]"] --> Month["月カレンダー"]
    Month --> DayCell["日付セル"]
    DayCell --> Compact["最大表示件数まで表示"]
    DayCell --> Overflow["+N件で省略"]
    Compact --> Open["cardType + cardId でDetailを開く"]
    Open --> Billing["BillingCardDetail"]
    Open --> Income["IncomeCardDetail"]
    Open --> Expense["ExpenseCardDetail"]`;

const moneyRows: CodingRow[] = [
    {
        label: '正本',
        value: '金額の正本は BillingCardDetail / IncomeCardDetail / ExpenseCardDetail 側に置く。',
        tone: 'neutral',
    },
    {
        label: '派生値',
        value: 'CoreCard.amount はカレンダー・一覧・月次集計・円グラフ用の派生値。',
        tone: 'calendar',
    },
    {
        label: '更新方向',
        value: '更新方向は Detail → CoreCard に固定し、CoreCard.amount を単独編集しない。',
        tone: 'warning',
    },
    {
        label: '型',
        value: 'DB保存はdecimal、DTO / TypeScript / CoreCardではstring。',
        tone: 'success',
    },
    {
        label: '禁止',
        value: 'float / double / JavaScript numberで金額計算しない。',
        tone: 'warning',
    },
    {
        label: '将来責務',
        value: '消費税、端数処理、丸め処理、精度調整は将来のServiceまたはMoney系ValueObjectの責務。',
        tone: 'caution',
    },
];

const labelRows: CodingRow[] = [
    {
        label: 'cardTypeLabels',
        value: 'billing: 請求 / income: 入金 / expense: 出金',
    },
    {
        label: 'counterpartyRoleLabels',
        value: 'billing: 請求先 / income: 入金元 / expense: 支払先',
    },
    {
        label: 'dateRoleLabels',
        value: 'billing_due: 請求期限日 / billed_date: 請求日 / income_expected: 入金予定日 / income_received: 入金日 / expense_scheduled: 支払予定日 / expense_paid: 支払日',
        tone: 'calendar',
    },
    {
        label: 'stateLabels',
        value: 'billing_pending: 未請求 / billing_done: 請求済み / income_pending: 未入金 / income_done: 入金済み / expense_pending: 支払予定 / expense_done: 支払済み',
        tone: 'success',
    },
    {
        label: 'stateTone',
        value: 'normal / caution / warning / success',
        tone: 'caution',
    },
];

const coreSection: CodingSection = {
    id: 'core',
    label: 'コア',
    title: 'CoreCard暫定設計',
    summary:
        'CoreCardはカレンダー表示・月次集計・円グラフ用の軽量表示DTOで、詳細カードから作る派生データです。',
    tone: 'calendar',
    modes: {
        overview: {
            title: 'CoreCardは表示・集計用の軽量DTO',
            lead: 'CoreCardはDBモデル本体ではなく、カレンダー表示、月次集計、円グラフのためにDetail側から作る軽量表示DTOです。',
            points: [
                'CoreCardは詳細カードから作られる派生データであり、単独編集の正本にしません。',
                'カレンダーUIはCoreCard[]を表示するだけで、予定日・実績日・業務statusの判断を持ちません。',
                '日本語ラベルはCoreCardへ直持ちせず、dateRoleKey、stateKey、cardTypeをReact側constで表示文言へ変換します。',
            ],
            rows: [
                {
                    label: 'CoreCard',
                    value: 'カレンダー表示・月次集計・円グラフ用の軽量表示DTO。DBモデル本体ではない。',
                    tone: 'calendar',
                },
                {
                    label: 'DetailCard',
                    value: '請求・入金・出金それぞれの正本に近い詳細DTO。金額、固有status、詳細日付、メモ、タグを持つ。',
                },
                {
                    label: 'Mapper / Presenter',
                    value: 'DetailCardからCoreCardを作り、dateRoleKey、stateKey、stateTone、calendarDateを決める。',
                    tone: 'success',
                },
                {
                    label: 'config / const',
                    value: 'keyから表示ラベルへ変換する責務。IDEA BOARD段階ではReact画面内または画面近くの表示用constに置く。',
                    tone: 'caution',
                },
            ],
            callout: {
                label: '編集方向',
                detail: 'CoreCard.amountを直接編集せず、Detail → CoreCard の一方向で同期します。',
            },
        },
        elements: {
            title: 'CoreCardの現在要素',
            lead: 'CoreCardは日付セル内で読める最小情報だけを持ち、詳細情報の正本を抱え込みません。',
            points: [
                'amountは計算可能な文字列として扱い、"10000" または "10000.00" のような値にします。',
                '"¥10,000" のような表示整形済み文字列を CoreCard.amount そのものにはしません。',
                'stateKeyは業務statusそのものではなく、Detail側のstatusから作る表示用keyです。',
            ],
            elements: [
                {
                    name: 'cardId',
                    detail: '詳細カードを開くためのID。請求・入金・出金それぞれの詳細データへつなぐ。',
                },
                {
                    name: 'cardType',
                    detail: 'billing / income / expense を区別する種別。カードの見た目、ラベル、集計上の向きを判断するために使う。',
                },
                {
                    name: 'title',
                    detail: 'カレンダー上に表示する短い見出し。長い説明ではなく、日付セル内で読める名前にする。',
                },
                {
                    name: 'amount: string',
                    detail: 'カレンダー表示、月次集計、円グラフ用の金額。正本は各Detail側。DB保存はdecimal、DTO / TypeScript / CoreCardではstring。',
                },
                {
                    name: 'counterpartyName',
                    detail: '相手先名。請求カードでは請求先、入金カードでは入金元、出金カードでは支払先を表す共通表示名。',
                },
                {
                    name: 'calendarDate',
                    detail: 'カレンダー上に配置する日付。詳細側の日付からMapper / Presenterで作る。CoreCard側で予定日・実績日を判断しない。',
                },
                {
                    name: 'dateRoleKey',
                    detail: 'calendarDate の意味を表すkey。例: billing_due / billed_date / income_expected / income_received / expense_scheduled / expense_paid。',
                },
                {
                    name: 'stateKey',
                    detail: '状態を表す表示用key。例: billing_pending / billing_done / income_pending / income_done / expense_pending / expense_done。',
                },
                {
                    name: 'stateTone',
                    detail: '状態の見た目。normal / caution / warning / success など。バッジ色や強調表示に使う。',
                },
            ],
            rows: moneyRows,
        },
        workflow: {
            title: 'Detail → CoreCard の派生フロー',
            lead: 'Detail側を正本にし、Mapper / PresenterがCoreCardへ軽量変換して表示・集計へ渡します。',
            points: [
                'CoreCard側に業務判断を押し込まず、Detail側のstatusと日付からMapper / Presenterで表示用keyを作ります。',
                'CoreCard.amountは月次集計や円グラフにも使える派生値ですが、金額計算の正本にはしません。',
                'IDEA BOARDでは実際の税計算・丸め実装、月次集計API、円グラフ集計処理は作りません。',
            ],
            workflows: [
                {
                    title: 'DetailからCoreCardを作る流れ',
                    chart: coreProjectionFlow,
                    notes: [
                        'Billing / Income / Expense の各DetailをMapper / PresenterでCoreCardへ変換します。',
                        '月カレンダー、一覧表示、月次集計、円グラフはCoreCardを読むだけに寄せます。',
                    ],
                },
                {
                    title: '金額更新の同期方向',
                    chart: amountUpdateFlow,
                    notes: [
                        'Detail側の金額変更を起点にCoreCard.amountを同期します。',
                        'CoreCard.amountを単独編集できる正本として扱いません。',
                    ],
                },
            ],
        },
        example: {
            title: 'CoreCard表示例とlabel/config方針',
            lead: 'CoreCardはkeyを持ち、表示文言はReact側constで変換します。グラフ風表示は固定文字列で概念だけ見せます。',
            points: [
                'CoreCardに日本語ラベルを直持ちしません。',
                '将来PRODUCT段階で必要になったらLaravel configやDomain定数へ移す余地を残します。',
                'MOCK表示用の合計や円グラフ風データは、UI内で計算せず固定文字列で表現してよい扱いです。',
            ],
            rows: labelRows,
            examples: [
                {
                    label: 'billing',
                    title: 'A社 月額保守',
                    meta: 'calendarDate 2026-07-05 / dateRoleKey billing_due / stateTone warning',
                    amount: '50000.00',
                    tone: 'billing',
                },
                {
                    label: 'income',
                    title: 'B社 入金予定',
                    meta: 'calendarDate 2026-07-10 / dateRoleKey income_expected / stateTone normal',
                    amount: '80000.00',
                    tone: 'income',
                },
                {
                    label: 'expense',
                    title: 'サーバ代',
                    meta: 'calendarDate 2026-07-05 / dateRoleKey expense_scheduled / stateTone caution',
                    amount: '3000.00',
                    tone: 'expense',
                },
            ],
            codeLines: [
                'cardTypeLabels.billing = "請求"',
                'dateRoleLabels.income_expected = "入金予定日"',
                'stateLabels.expense_done = "支払済み"',
                'stateTone = "normal" | "caution" | "warning" | "success"',
            ],
            callout: {
                label: '固定表示',
                detail: '月次集計や円グラフの概念は表示例に留め、実集計ロジックは作りません。',
            },
        },
    },
};

type DetailSectionConfig = {
    id: 'income' | 'expense' | 'billing';
    label: string;
    title: string;
    summary: string;
    tone: CodingTone;
    detailName: string;
    idField: string;
    cardType: 'income' | 'expense' | 'billing';
    titleLabel: string;
    partyField: string;
    partyRole: string;
    dateA: string;
    dateB: string;
    dateRoleA: string;
    dateRoleB: string;
    statusField: string;
    pendingState: string;
    doneState: string;
    statusExample: string;
    exampleTitle: string;
    exampleDate: string;
    tags: string;
    specialPoint: string;
};

function createDetailSection(config: DetailSectionConfig): CodingSection {
    const flow = `flowchart TD
    Detail["${config.detailName}"] --> Mapper["Mapper / Presenter"]
    Mapper --> DateAxis["${config.dateA} または ${config.dateB}"]
    Mapper --> Core["CoreCard cardType ${config.cardType}"]
    Core --> Calendar["月カレンダー"]
    Core --> Summary["月次集計 / 円グラフ"]`;

    return {
        id: config.id,
        label: config.label,
        title: config.title,
        summary: config.summary,
        tone: config.tone,
        modes: {
            overview: {
                title: `${config.detailName}を正本にする`,
                lead: `${config.detailName}は${config.titleLabel}の正本に近い詳細DTOで、CoreCardはそこから作る表示・集計用データです。`,
                points: [
                    config.specialPoint,
                    `${config.partyField} はCoreCardの counterpartyName へ変換します。`,
                    'CoreCardはカレンダー、一覧、月次集計、円グラフ用に軽量化した派生データです。',
                ],
                rows: [
                    {
                        label: '正本',
                        value: `${config.detailName}.amount: string`,
                        detail: 'DBではdecimal、DTO / TypeScriptではstringとして扱う。',
                        tone: config.tone,
                    },
                    {
                        label: '派生',
                        value: `CoreCard cardType ${config.cardType}`,
                        detail: 'Detail → CoreCard の一方向で作る。',
                        tone: 'calendar',
                    },
                ],
                callout:
                    config.id === 'billing'
                        ? {
                              label: '責務分離',
                              detail: '請求は「請求する予定・権利・行為」、入金は「入ってくるお金」として分けます。請求済みは入金済みではありません。',
                          }
                        : undefined,
            },
            elements: {
                title: `${config.detailName}暫定要素`,
                lead: `${config.detailName}は固有の日付、相手先、status、memo、tagsを持ち、CoreCardへ必要な最小情報だけを渡します。`,
                points: [
                    `${config.dateA} と ${config.dateB} のどちらを calendarDate にするかは表示軸で決めます。`,
                    `${config.statusField} は CoreCard.stateKey へ変換する元データです。`,
                    `${config.tags}。CoreCard必須にはしません。`,
                ],
                elements: [
                    {
                        name: config.idField,
                        detail: `${config.label}詳細カードを識別するID。`,
                    },
                    {
                        name: 'title',
                        detail: `${config.label}カードの見出し。`,
                    },
                    {
                        name: 'amount: string',
                        detail: `${config.label}金額の正本。DBではdecimal、DTO / TypeScriptではstringとして扱う。`,
                    },
                    {
                        name: config.partyField,
                        detail: `${config.partyRole}。CoreCardではcounterpartyNameへ変換する。`,
                    },
                    {
                        name: config.dateA,
                        detail: `CoreCard.calendarDate の元になる候補。`,
                    },
                    {
                        name: config.dateB,
                        detail: `表示軸によってCoreCard.calendarDateの元になる候補。`,
                    },
                    {
                        name: config.statusField,
                        detail: `CoreCard.stateKeyへ変換する元データ。`,
                    },
                    { name: 'memo', detail: `${config.label}に関する補足メモ。` },
                    {
                        name: 'tags',
                        detail: `${config.tags}。CoreCard必須にはしない。`,
                    },
                ],
            },
            workflow: {
                title: `${config.detailName} → CoreCard`,
                lead: `${config.detailName}の正本から、表示軸に応じたCoreCardを作ります。`,
                points: [
                    `calendarDateは ${config.dateA} または ${config.dateB} から表示軸に応じて作ります。`,
                    `dateRoleKeyは ${config.dateRoleA} または ${config.dateRoleB} にします。`,
                    `stateKeyは ${config.statusField} から表示用keyへ変換し、stateToneはstateKeyから決めます。`,
                ],
                workflows: [
                    {
                        title: `${config.label}カード変換`,
                        chart: flow,
                        notes: [
                            `cardId = ${config.idField}`,
                            `cardType = ${config.cardType}`,
                            `counterpartyName = ${config.partyField}`,
                        ],
                    },
                ],
            },
            example: {
                title: `${config.label}変換例`,
                lead: `${config.detailName}の相手先・日付軸・statusをCoreCardの共通項目へ寄せます。`,
                points: [
                    `cardId = ${config.idField}`,
                    `cardType = ${config.cardType}`,
                    `counterpartyName = ${config.partyField}`,
                ],
                rows: [
                    { label: 'cardId', value: config.idField, tone: config.tone },
                    {
                        label: 'cardType',
                        value: config.cardType,
                        tone: config.tone,
                    },
                    { label: 'title', value: 'title' },
                    { label: 'amount', value: 'amount', tone: 'success' },
                    {
                        label: 'counterpartyName',
                        value: config.partyField,
                        tone: config.tone,
                    },
                    {
                        label: 'calendarDate',
                        value: `${config.dateA} または ${config.dateB}`,
                        tone: 'calendar',
                    },
                    {
                        label: 'dateRoleKey',
                        value: `${config.dateRoleA} または ${config.dateRoleB}`,
                        tone: 'calendar',
                    },
                    {
                        label: 'stateKey',
                        value: `${config.statusField}から表示用keyへ変換`,
                        tone: 'success',
                    },
                    {
                        label: 'stateTone',
                        value: 'stateKeyから表示用toneへ変換',
                        tone: 'success',
                    },
                ],
                examples: [
                    {
                        label: config.detailName,
                        title: config.exampleTitle,
                        meta: `${config.exampleDate} / ${config.statusField} ${config.statusExample}`,
                        amount: config.cardType === 'expense' ? '3000.00' : config.cardType === 'income' ? '80000.00' : '50000.00',
                        tone: config.tone,
                    },
                    {
                        label: 'CoreCard',
                        title: config.exampleTitle,
                        meta: `dateRoleKey ${config.dateRoleA} / stateKey ${config.pendingState} / stateTone ${config.cardType === 'billing' ? 'warning' : config.cardType === 'expense' ? 'caution' : 'normal'}`,
                        amount: config.cardType === 'expense' ? '3000.00' : config.cardType === 'income' ? '80000.00' : '50000.00',
                        tone: 'calendar',
                    },
                ],
            },
        },
    };
}

const incomeSection = createDetailSection({
    id: 'income',
    label: '入金',
    title: 'IncomeCardDetail',
    summary:
        '入金の正本はIncomeCardDetail側に置き、CoreCardは入金予定・入金済みの表示と集計へ使う派生データにします。',
    tone: 'income',
    detailName: 'IncomeCardDetail',
    idField: 'incomeId',
    cardType: 'income',
    titleLabel: '入ってくるお金',
    partyField: 'incomeFromName',
    partyRole: '入金元',
    dateA: 'expectedIncomeDate',
    dateB: 'receivedDate',
    dateRoleA: 'income_expected',
    dateRoleB: 'income_received',
    statusField: 'incomeStatus',
    pendingState: 'income_pending',
    doneState: 'income_done',
    statusExample: 'pending',
    exampleTitle: 'B社 顧問料',
    exampleDate: 'expectedIncomeDate 2026-07-10',
    tags: '固定報酬、単発、顧問料、要確認などの補助分類',
    specialPoint:
        '入金カードは入金予定日、実際の入金日、入金元、金額、入金固有statusを持ちます。',
});

const expenseSection = createDetailSection({
    id: 'expense',
    label: '出金',
    title: 'ExpenseCardDetail',
    summary:
        '出金の正本はExpenseCardDetail側に置き、支払予定・支払済み・固定費などをCoreCardへ軽量変換します。',
    tone: 'expense',
    detailName: 'ExpenseCardDetail',
    idField: 'expenseId',
    cardType: 'expense',
    titleLabel: '支払い',
    partyField: 'paymentToName',
    partyRole: '支払先',
    dateA: 'scheduledPaymentDate',
    dateB: 'paidDate',
    dateRoleA: 'expense_scheduled',
    dateRoleB: 'expense_paid',
    statusField: 'expenseStatus',
    pendingState: 'expense_pending',
    doneState: 'expense_done',
    statusExample: 'scheduled',
    exampleTitle: 'サーバ代',
    exampleDate: 'scheduledPaymentDate 2026-07-05',
    tags: '固定費、交通費、サーバ代、雑費、要確認などの補助分類',
    specialPoint:
        '出金カードは支払予定日、実際の支払日、支払先、金額、出金固有statusを持ちます。',
});

const billingSection = createDetailSection({
    id: 'billing',
    label: '請求',
    title: 'BillingCardDetail',
    summary:
        '請求は「請求する予定・権利・行為」、入金は「入ってくるお金」として分け、BillingCardDetailを正本にします。',
    tone: 'billing',
    detailName: 'BillingCardDetail',
    idField: 'billingId',
    cardType: 'billing',
    titleLabel: '請求する予定・権利・行為',
    partyField: 'billingToName',
    partyRole: '請求先',
    dateA: 'billingDueDate',
    dateB: 'billedDate',
    dateRoleA: 'billing_due',
    dateRoleB: 'billed_date',
    statusField: 'billingStatus',
    pendingState: 'billing_pending',
    doneState: 'billing_done',
    statusExample: 'pending',
    exampleTitle: 'A社 月額保守',
    exampleDate: 'billingDueDate 2026-07-05',
    tags: '顧問料、月額、単発、請求確認、要対応などの補助分類',
    specialPoint:
        '請求カードは請求日、請求期限日、請求先、請求金額、請求固有statusを持ちます。請求カードと入金カードを混ぜません。',
});

const calendarSection: CodingSection = {
    id: 'calendar',
    label: 'カレンダー',
    title: 'CoreCardの月カレンダー表示',
    summary:
        '月カレンダーにはCoreCard[]だけを渡し、詳細はcardTypeとcardIdで各Detailを開く前提にします。',
    tone: 'calendar',
    modes: {
        overview: {
            title: 'カレンダーはCoreCard[]を表示するだけ',
            lead: '月カレンダーはCoreCardの軽量情報だけで日付セルを描画し、詳細statusや税計算や日付判断を持ちません。',
            points: [
                '日付セルには最大表示件数を決め、増えすぎた場合は「+N件」のように省略します。',
                'カードを押すと、cardTypeとcardIdを使って該当Detailを開きます。',
                'memo、tags、詳細status、予定日/実績日両方、税情報、履歴、添付はカレンダーには出しません。',
            ],
            rows: [
                {
                    label: '入力',
                    value: 'CoreCard[]',
                    detail: '日付セルに置くための軽量DTO配列。',
                    tone: 'calendar',
                },
                {
                    label: '表示',
                    value: 'cardType / title / counterpartyName / amount / dateRoleKey / stateTone',
                    detail: '詳細カードを開くための最小情報に絞る。',
                },
                {
                    label: '詳細',
                    value: 'cardType + cardId で各Detailを開く',
                    detail: 'カレンダー側に詳細データの正本を持たない。',
                    tone: 'success',
                },
            ],
        },
        elements: {
            title: 'カレンダー表示ルール',
            lead: '日付セル上では詳細情報を出しすぎず、CoreCardの範囲に留めます。',
            points: [
                'CoreCard.amountは月次集計や円グラフにも使えるが、CoreCard上で金額計算の正本にしません。',
                '同じカードでも表示軸が変わればcalendarDateとdateRoleKeyが変わります。',
                'DnD、保存処理、月次集計API、実グラフ生成は今回実装しません。',
            ],
            rows: [
                {
                    label: '最大表示件数',
                    value: '日付セルごとに上限を決め、超過時は +N件 と表示する。',
                    tone: 'caution',
                },
                {
                    label: '押下時',
                    value: 'cardTypeとcardIdを使って Billing / Income / Expense のDetailへ分岐する。',
                    tone: 'success',
                },
                {
                    label: '出さない情報',
                    value: 'memo、tags、詳細status、予定日/実績日両方、税情報、履歴、添付。',
                    tone: 'warning',
                },
                {
                    label: '表示文言',
                    value: 'dateRoleKey、stateKey、cardTypeをReact側constでラベルへ変換する。',
                    tone: 'calendar',
                },
            ],
        },
        workflow: {
            title: 'CoreCard[]から月カレンダーへ',
            lead: 'カレンダーは日付セルへCoreCardを並べ、クリック後だけ詳細カードへ進みます。',
            points: [
                '日付判断や状態判断はMapper / Presenterで済ませます。',
                'Calendar UIはCoreCard[]を表示するだけにして、詳細statusや税計算を持ちません。',
                '月次集計や円グラフはCoreCard.amountを読めますが、今回のIDEA BOARDでは固定説明に留めます。',
            ],
            workflows: [
                {
                    title: '月カレンダー表示フロー',
                    chart: calendarFlow,
                    notes: [
                        '日付セルではカードを最大表示件数まで出し、増えた分は省略表示にします。',
                        '詳細はcardTypeとcardIdを渡して各Detailへ委譲します。',
                    ],
                },
            ],
        },
        example: {
            title: '2026年7月の表示例',
            lead: 'CoreCardが月カレンダーへどう入るかを、固定データの表示例として示します。',
            points: [
                '2026年7月5日は請求期限と支払予定が同じ日に並びます。',
                '2026年7月10日は入金予定、2026年7月25日は入金済みとして表示します。',
                'この例は表示イメージであり、DnDや保存処理、実集計APIは含みません。',
            ],
            calendarDays: [
                {
                    date: '2026年7月5日',
                    cards: [
                        {
                            type: '請求',
                            title: 'A社',
                            amount: '50000',
                            role: '請求期限',
                            tone: 'warning',
                        },
                        {
                            type: '出金',
                            title: 'サーバ代',
                            amount: '3000',
                            role: '支払予定',
                            tone: 'caution',
                        },
                    ],
                },
                {
                    date: '2026年7月10日',
                    cards: [
                        {
                            type: '入金',
                            title: 'B社',
                            amount: '80000',
                            role: '入金予定',
                            tone: 'normal',
                        },
                    ],
                },
                {
                    date: '2026年7月25日',
                    cards: [
                        {
                            type: '入金',
                            title: 'A社',
                            amount: '50000',
                            role: '入金済み',
                            tone: 'success',
                        },
                    ],
                    overflowLabel: '+2件',
                },
            ],
            examples: [
                {
                    label: '月次集計表示',
                    title: '入金 130000.00 / 出金 3000.00 / 請求 50000.00',
                    meta: '固定文字列で概念だけ表示。UI内で実計算しない。',
                    tone: 'calendar',
                },
                {
                    label: '円グラフ風表示',
                    title: 'income / expense / billing の比率候補',
                    meta: 'CoreCard.amount が集計入力になり得ることだけを示す。',
                    tone: 'success',
                },
            ],
        },
    },
};

export const codingSections: CodingSection[] = [
    coreSection,
    incomeSection,
    expenseSection,
    billingSection,
    calendarSection,
];
