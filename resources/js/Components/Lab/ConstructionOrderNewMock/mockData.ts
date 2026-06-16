export type MockScreen =
    | 'entry'
    | 'projects'
    | 'project-detail'
    | 'card-detail';

export type ProjectDetailView = 'hub' | 'site-access' | 'work-detail' | 'documents';

export type DocumentType = 'estimate' | 'invoice' | 'receipt';

export type CardKind = 'product' | 'work' | 'expense' | 'adjustment' | 'exception';

export type CardCategory = '商品' | '作業' | '諸経費' | '調整' | '例外対応';

export type CsvStatus = '投入待ち' | '受付済み' | 'エラー';

export type StageStatus =
    | 'できていない'
    | '確認中'
    | 'できている'
    | '対象外'
    | 'SKIP'
    | '差戻し';

export type DetailRow = {
    id: string;
    content: string;
    displayLabel: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    amount: number;
    memo: string;
};

export type PhotoQueueItem = {
    id: string;
    title: string;
    memo: string;
    status: string;
    classification: string;
    capturedAt: string;
};

export type FileImportItem = {
    id: string;
    fileName: string;
    displayName: string;
    memo: string;
    status: string;
    classification: string;
};

export type WorkCard = {
    id: string;
    kind: CardKind;
    phaseId: string;
    title: string;
    status: string;
    amount: number;
    category: CardCategory;
    hasMemo: boolean;
    hasPhotos: boolean;
    hasFiles: boolean;
    billingTarget: '請求対象' | '非対象';
    receiptTarget: '領収対象' | '領収対象外';
    requiresRelatedProject: boolean;
    summary: string;
    detailRows: DetailRow[];
    photos: PhotoQueueItem[];
    files: FileImportItem[];
    memo: string;
    exceptionType?: string;
    relatedStageLabel?: string;
    relatedProjectLabel?: string;
    documentReflection?: string;
};

export type ReportPreview = {
    title: string;
    selectedCardIds: string[];
    amountLabel: string;
    issuedAt: string;
    documentNumber: string;
    subject: string;
    recipient: string;
    issuer: string;
    status: string;
    targetSummary: string;
    fileLabel: string;
    externalNote: string;
    memo: string;
    paymentDue?: string;
    paymentAccount?: string;
    proviso?: string;
    receiptStatus?: string;
};

export type WorkflowStage = {
    id: string;
    label: string;
    description: string;
    status: StageStatus;
    statusNote: string;
    cardIds: string[];
    evidenceSummary: string;
    completionNote: string;
};

export type HistoryItem = {
    id: string;
    action: string;
    operator: string;
    actedAt: string;
    reason: string;
    relatedStage: string;
    relatedCard: string;
    relatedProject: string;
};

export type RelatedProject = {
    id: string;
    title: string;
    relationType: string;
    status: string;
    reason: string;
    sourceCardTitle: string;
    owner: string;
};

export type CompletionCheck = {
    id: string;
    label: string;
    status: '未確認' | '確認中' | '確認済み';
    note: string;
};

export type Project = {
    id: string;
    name: string;
    customerName: string;
    siteAddress: string;
    parkingMemo: string;
    loadingMemo: string;
    accessMethod: string;
    keyNote: string;
    visitNote: string;
    emergencyContact: string;
    siteMemo: string;
    owner: string;
    pattern: string;
    status: string;
    cardCount: string;
    pendingCardCount: number;
    confirmCount: number;
    estimateStatus: string;
    invoiceStatus: string;
    receiptStatus: string;
    hasRelatedProjects: boolean;
    progressStatus: string;
    amountSummary: number;
    lastUpdated: string;
    cards: WorkCard[];
    workflowStages: WorkflowStage[];
    histories: HistoryItem[];
    relatedProjects: RelatedProject[];
    completionChecks: CompletionCheck[];
    reports: Record<DocumentType, ReportPreview>;
};

export type CsvFile = {
    id: string;
    fileName: string;
    size: string;
    rowCount: string;
    memo: string;
    status: CsvStatus;
};

export type EntryProductDraft = {
    id: string;
    productName: string;
    productLabel: string;
    productMeasurement: string;
    productUnit: string;
    productFixedAmount: string;
    productMemo: string;
};

export type EntryDraftField = Exclude<keyof EntryDraft, 'products'>;

export type EntryProductDraftField = Exclude<keyof EntryProductDraft, 'id'>;

export type EntryDraft = {
    projectName: string;
    customerName: string;
    siteAddress: string;
    owner: string;
    products: EntryProductDraft[];
    note: string;
};

export const projectHubEntries: {
    key: ProjectDetailView;
    label: string;
}[] = [
    {
        key: 'site-access',
        label: '現場アクセス',
    },
    {
        key: 'work-detail',
        label: '詳細',
    },
    {
        key: 'documents',
        label: '書類',
    },
];

export const documentTypeTabs: {
    key: DocumentType;
    label: string;
}[] = [
    {
        key: 'estimate',
        label: '見積書',
    },
    {
        key: 'invoice',
        label: '請求書',
    },
    {
        key: 'receipt',
        label: '領収書',
    },
];

export const initialEntryDraft: EntryDraft = {
    projectName: '大阪ステーションシティ 4階 給湯配管交換',
    customerName: '株式会社サンプル商事',
    siteAddress: '大阪府大阪市北区梅田3-1-1 大阪ステーションシティ',
    owner: '佐藤 美咲',
    products: [
        {
            id: 'entry-product-1',
            productName: '省エネ給湯器 GT-2460SAWX',
            productLabel: '給湯器本体',
            productMeasurement: '1',
            productUnit: '台',
            productFixedAmount: '305000',
            productMemo: '既存品番と搬入寸法を訪問前に確認',
        },
        {
            id: 'entry-product-2',
            productName: 'リモコンセット MBC-240V',
            productLabel: '台所・浴室リモコン',
            productMeasurement: '1',
            productUnit: '式',
            productFixedAmount: '48000',
            productMemo: '既存配線の再利用可否を現地で確認',
        },
    ],
    note: '管理組合への連絡後、CSV取込へ進める。',
};

export const csvFiles: CsvFile[] = [
    {
        id: 'csv-1',
        fileName: 'aobadai_401_work_cards.csv',
        size: '42 KB',
        rowCount: '18件',
        memo: '商品カード、作業カード、諸経費カードを含む',
        status: '受付済み',
    },
    {
        id: 'csv-2',
        fileName: 'aobadai_401_exception.csv',
        size: '12 KB',
        rowCount: '4件',
        memo: '例外対応カードと関連案件候補を追加投入する想定',
        status: '投入待ち',
    },
    {
        id: 'csv-3',
        fileName: 'meguro_adjustments.csv',
        size: '9 KB',
        rowCount: '2件',
        memo: '金額列は数値として受け、円やカンマは表示側で付ける',
        status: 'エラー',
    },
];

export const cardKindLabels: Record<CardKind, string> = {
    product: '商品カード',
    work: '作業カード',
    expense: '諸経費カード',
    adjustment: '調整カード',
    exception: '例外対応カード',
};

export const cardKindStyles: Record<
    CardKind,
    {
        panel: string;
        badge: string;
    }
> = {
    product: {
        panel: 'border-emerald-300 bg-emerald-50',
        badge: 'border-emerald-300 bg-emerald-100 text-emerald-900',
    },
    work: {
        panel: 'border-blue-300 bg-blue-50',
        badge: 'border-blue-300 bg-blue-100 text-blue-900',
    },
    expense: {
        panel: 'border-amber-300 bg-amber-50',
        badge: 'border-amber-300 bg-amber-100 text-amber-950',
    },
    adjustment: {
        panel: 'border-rose-300 bg-rose-50',
        badge: 'border-rose-300 bg-rose-100 text-rose-900',
    },
    exception: {
        panel: 'border-fuchsia-300 bg-fuchsia-50',
        badge: 'border-fuchsia-300 bg-fuchsia-100 text-fuchsia-900',
    },
};

const sharedPhotos: PhotoQueueItem[] = [
    {
        id: 'photo-before',
        title: '施工前',
        memo: '配管まわりの既存状態',
        status: '受付済み',
        classification: '着工前証跡',
        capturedAt: '2026/06/15 09:40',
    },
    {
        id: 'photo-after',
        title: '施工後',
        memo: '連続撮影2枚目のサムネイル',
        status: '検収待ち',
        classification: '完了証跡',
        capturedAt: '2026/06/15 15:20',
    },
];

const sharedFiles: FileImportItem[] = [
    {
        id: 'file-spec',
        fileName: 'manufacturer_spec.pdf',
        displayName: 'メーカー仕様書',
        memo: '商品カードの添付想定',
        status: '受付済み',
        classification: 'メーカー資料',
    },
    {
        id: 'file-parking',
        fileName: 'parking_receipt.jpg',
        displayName: '駐車場領収証',
        memo: '諸経費カードの証跡',
        status: '受付済み',
        classification: '領収証跡',
    },
];

const osakaProject: Project = {
        id: 'project-aobadai-401',
        name: '大阪ステーションシティ 4階 給湯配管交換',
        customerName: '株式会社サンプル商事',
        siteAddress: '大阪府大阪市北区梅田3-1-1 大阪ステーションシティ',
        parkingMemo: '近隣コインパーキング利用。搬入時間帯は9:00以降に限定。',
        loadingMemo: '東側通用口から搬入。台車利用可、エレベーター養生が必要。',
        accessMethod: '管理人室で入館記録を記入し、東側通用口から入場する。',
        keyNote: 'オートロックは管理人が解錠。玄関キーの預かりはなし。',
        visitNote: '管理組合への連絡後、室内養生を確認してから作業開始。',
        emergencyContact: '管理人室 03-0000-0000 / 担当 佐藤 090-0000-0000',
        siteMemo: 'エレベーター前が狭いため、長尺部材は2名で搬入する。',
        owner: '佐藤 美咲',
        pattern: '標準工事 + 例外対応',
        status: '案件詳細レビュー中',
        cardCount: '5枚',
        pendingCardCount: 2,
        confirmCount: 3,
        estimateStatus: '見積プレビュー確認中',
        invoiceStatus: '請求書未確定',
        receiptStatus: '領収書未発行',
        hasRelatedProjects: true,
        progressStatus: '工程別に確認中',
        amountSummary: 220000,
        lastUpdated: '2026/06/16 10:30',
        cards: [
            {
                id: 'card-product-001',
                kind: 'product',
                phaseId: 'product-check',
                title: '給湯器リモコン交換',
                status: 'できている',
                amount: 86000,
                category: '商品',
                hasMemo: true,
                hasPhotos: false,
                hasFiles: true,
                billingTarget: '請求対象',
                receiptTarget: '領収対象',
                requiresRelatedProject: false,
                summary: '商品数、品番、仕様書を確認する商品カード。',
                detailRows: [
                    {
                        id: 'row-product-1',
                        content: '壁付リモコン',
                        displayLabel: '商品数',
                        quantity: 3,
                        unit: '個',
                        unitPrice: 20000,
                        amount: 60000,
                        memo: '型番はファイル添付で補足',
                    },
                    {
                        id: 'row-product-2',
                        content: '取付部材',
                        displayLabel: '部材セット',
                        quantity: 1,
                        unit: '式',
                        unitPrice: 26000,
                        amount: 26000,
                        memo: '保存値は数値、円表記は表示側で付ける',
                    },
                ],
                photos: [],
                files: sharedFiles.slice(0, 1),
                memo: '商品カードは商品マスタ未接続の見た目確認だけに限定。',
                documentReflection: '見積書・請求書・領収書へ反映',
            },
            {
                id: 'card-work-001',
                kind: 'work',
                phaseId: 'site-check',
                title: '既設配管撤去と新規配管',
                status: 'できている',
                amount: 120000,
                category: '作業',
                hasMemo: true,
                hasPhotos: true,
                hasFiles: false,
                billingTarget: '請求対象',
                receiptTarget: '領収対象',
                requiresRelatedProject: false,
                summary: '作業内容、数量、連続撮影の証跡を確認する作業カード。',
                detailRows: [
                    {
                        id: 'row-work-1',
                        content: '既設配管撤去',
                        displayLabel: '撤去作業',
                        quantity: 1,
                        unit: '式',
                        unitPrice: 45000,
                        amount: 45000,
                        memo: '現場写真あり',
                    },
                    {
                        id: 'row-work-2',
                        content: '新規配管敷設',
                        displayLabel: '配管長',
                        quantity: 12.5,
                        unit: 'm',
                        unitPrice: 6000,
                        amount: 75000,
                        memo: '数量と単位を分けて保持する',
                    },
                ],
                photos: sharedPhotos,
                files: [],
                memo: '配管まわりの写真を確認してから明細を更新する。',
                documentReflection: '見積書・請求書・領収書へ反映',
            },
            {
                id: 'card-expense-001',
                kind: 'expense',
                phaseId: 'work-support',
                title: '駐車場・養生費',
                status: '確認中',
                amount: 18000,
                category: '諸経費',
                hasMemo: true,
                hasPhotos: false,
                hasFiles: true,
                billingTarget: '請求対象',
                receiptTarget: '領収対象',
                requiresRelatedProject: false,
                summary: '現場諸経費を商品・作業・調整と並べて確認するカード。',
                detailRows: [
                    {
                        id: 'row-expense-1',
                        content: '近隣駐車場',
                        displayLabel: '利用日',
                        quantity: 2,
                        unit: '日',
                        unitPrice: 4000,
                        amount: 8000,
                        memo: '領収書ファイル添付あり',
                    },
                    {
                        id: 'row-expense-2',
                        content: '共用部養生',
                        displayLabel: '基本工事',
                        quantity: 1,
                        unit: '式',
                        unitPrice: 10000,
                        amount: 10000,
                        memo: '請求対象',
                    },
                ],
                photos: [],
                files: sharedFiles.slice(1),
                memo: '諸経費は帳票明細で別カテゴリ扱い。',
                documentReflection: '見積書・請求書・領収書へ反映',
            },
            {
                id: 'card-adjustment-001',
                kind: 'adjustment',
                phaseId: 'billing-check',
                title: '端数調整',
                status: '見積反映済み',
                amount: -4000,
                category: '調整',
                hasMemo: true,
                hasPhotos: false,
                hasFiles: false,
                billingTarget: '請求対象',
                receiptTarget: '領収対象',
                requiresRelatedProject: false,
                summary: '割引や端数調整を数値保存し、表示側で赤文字にするカード。',
                detailRows: [
                    {
                        id: 'row-adjustment-1',
                        content: '端数調整',
                        displayLabel: '調整',
                        quantity: 1,
                        unit: '式',
                        unitPrice: -4000,
                        amount: -4000,
                        memo: '保存値は -4000、表示は -4,000円',
                    },
                ],
                photos: [],
                files: [],
                memo: '保存値と表示は分ける。マイナス金額は表示側で赤文字にする。',
                documentReflection: '見積書・請求書・領収書へ反映',
            },
            {
                id: 'card-exception-001',
                kind: 'exception',
                phaseId: 'exception-support',
                title: '床下点検口まわり補修',
                status: '差戻し',
                amount: 32000,
                category: '例外対応',
                hasMemo: true,
                hasPhotos: true,
                hasFiles: true,
                billingTarget: '非対象',
                receiptTarget: '領収対象外',
                requiresRelatedProject: true,
                summary: '破損対応を通常作業や諸経費に混ぜず、関連案件化まで見るカード。',
                detailRows: [
                    {
                        id: 'row-exception-1',
                        content: '床下点検口まわり補修',
                        displayLabel: '補修範囲',
                        quantity: 1,
                        unit: '箇所',
                        unitPrice: 32000,
                        amount: 32000,
                        memo: '請求対象外として表示',
                    },
                ],
                photos: sharedPhotos,
                files: sharedFiles.slice(0, 1),
                memo: '例外対応カードから関連案件を作成し、工事後対応案件へつなげる。',
                exceptionType: '破損対応',
                relatedStageLabel: '作業対応',
                relatedProjectLabel: '工事後対応案件: 点検口補修の再確認',
                documentReflection: '帳票へは非対象として表示',
            },
        ],
        workflowStages: [
            {
                id: 'product-check',
                label: '商品確認',
                description: '商品カードとメーカー資料を確認する。',
                status: 'できている',
                statusNote: '商品カードと仕様書の紐づけ確認済み。',
                cardIds: ['card-product-001'],
                evidenceSummary: 'メーカー仕様書 1件',
                completionNote: '品番、数量、単価を確認済み。',
            },
            {
                id: 'site-check',
                label: '現場確認',
                description: '現場写真、作業範囲、搬入条件を確認する。',
                status: '確認中',
                statusNote: '施工後写真の検収待ち。',
                cardIds: ['card-work-001'],
                evidenceSummary: '着工前証跡 / 完了証跡',
                completionNote: '検収用写真を追加確認する。',
            },
            {
                id: 'work-support',
                label: '作業対応',
                description: '作業カード、諸経費カード、証跡を扱う。',
                status: '確認中',
                statusNote: '駐車場領収証と養生費の確認中。',
                cardIds: ['card-expense-001'],
                evidenceSummary: '駐車場領収証',
                completionNote: '諸経費の証跡確認後に完了。',
            },
            {
                id: 'exception-support',
                label: '例外対応',
                description: '例外対応カードを通常作業、諸経費、調整と分けて扱う。',
                status: '差戻し',
                statusNote: '破損対応を関連案件化する必要がある。',
                cardIds: ['card-exception-001'],
                evidenceSummary: '補修写真、メーカー資料',
                completionNote: '関連工程: 作業対応 / 関連カード: 床下点検口まわり補修',
            },
            {
                id: 'billing-check',
                label: '請求確認',
                description: '調整カードと帳票への反映状態を確認する。',
                status: 'SKIP',
                statusNote: '請求書発行前レビューを担当者判断で一時スキップ。',
                cardIds: ['card-adjustment-001'],
                evidenceSummary: '端数調整メモ',
                completionNote: 'SKIP理由を履歴に残している。',
            },
            {
                id: 'receipt-check',
                label: '入金・領収確認',
                description: '入金確認と領収書への反映状態を確認する。',
                status: 'できていない',
                statusNote: '請求書確定後に確認する。',
                cardIds: [],
                evidenceSummary: '入金確認待ち',
                completionNote: '領収書発行前。',
            },
            {
                id: 'warranty-check',
                label: '保証部材確認',
                description: 'この案件では保証部材がないため最初から不要。',
                status: '対象外',
                statusNote: '対象外は最初から不要な工程、SKIPとは別扱い。',
                cardIds: [],
                evidenceSummary: '対象外',
                completionNote: '保証部材なし。',
            },
        ],
        histories: [
            {
                id: 'history-1',
                action: '案件作成',
                operator: '佐藤 美咲',
                actedAt: '2026/06/14 09:10',
                reason: '管理組合からの依頼受付',
                relatedStage: '案件登録',
                relatedCard: '-',
                relatedProject: '-',
            },
            {
                id: 'history-2',
                action: '工程SKIP',
                operator: '佐藤 美咲',
                actedAt: '2026/06/15 17:20',
                reason: '請求書発行前レビューを担当者判断で一時スキップ',
                relatedStage: '請求確認',
                relatedCard: '端数調整',
                relatedProject: '-',
            },
            {
                id: 'history-3',
                action: '関連案件作成',
                operator: '高橋 直人',
                actedAt: '2026/06/16 10:30',
                reason: '破損対応を完了済み案件へ混ぜず工事後対応として分離',
                relatedStage: '作業対応',
                relatedCard: '床下点検口まわり補修',
                relatedProject: '点検口補修の再確認',
            },
        ],
        relatedProjects: [
            {
                id: 'related-1',
                title: '点検口補修の再確認',
                relationType: '工事後対応',
                status: '起票待ち',
                reason: '破損対応が元案件内で完結しないため。',
                sourceCardTitle: '床下点検口まわり補修',
                owner: '高橋 直人',
            },
            {
                id: 'related-2',
                title: '水圧再確認訪問',
                relationType: '追加作業',
                status: '日程調整中',
                reason: '完了後の軽微な確認では済まず、再訪問が必要。',
                sourceCardTitle: '既設配管撤去と新規配管',
                owner: '佐藤 美咲',
            },
        ],
        completionChecks: [
            {
                id: 'complete-1',
                label: '商品・作業・諸経費の反映',
                status: '確認済み',
                note: '見積書へ反映済み。',
            },
            {
                id: 'complete-2',
                label: '例外対応の扱い',
                status: '確認中',
                note: '関連案件化して元案件の履歴に残す。',
            },
            {
                id: 'complete-3',
                label: '入金・領収確認',
                status: '未確認',
                note: '請求書確定後に領収書へ反映する。',
            },
        ],
        reports: {
            estimate: {
                title: '御見積書',
                selectedCardIds: [
                    'card-product-001',
                    'card-work-001',
                    'card-expense-001',
                    'card-adjustment-001',
                ],
                amountLabel: '御見積金額',
                issuedAt: '2026/06/14',
                documentNumber: 'EST-20260614-001',
                subject: '大阪ステーションシティ 4階 給湯配管交換工事',
                recipient: '株式会社サンプル商事 御中',
                issuer: '株式会社サンプル設備',
                status: '発行前レビュー',
                targetSummary: '商品、作業、諸経費、端数調整を対象にした作業前見積。',
                fileLabel: 'EST-20260614-001_preview.pdf',
                externalNote: '本見積は現地確認時点の内容に基づく概算です。追加作業が発生する場合は事前にご相談します。',
                memo: '例外対応カードは見積対象外として関連案件側で扱う。',
            },
            invoice: {
                title: '御請求書',
                selectedCardIds: [
                    'card-product-001',
                    'card-work-001',
                    'card-expense-001',
                    'card-adjustment-001',
                ],
                amountLabel: '御請求金額',
                issuedAt: '2026/06/21',
                documentNumber: 'INV-20260621-001',
                subject: '大阪ステーションシティ 4階 給湯配管交換工事',
                recipient: '株式会社サンプル商事 御中',
                issuer: '株式会社サンプル設備',
                status: '請求書未確定',
                targetSummary: '完了済み作業、商品、諸経費、調整金額を請求対象にする。',
                fileLabel: 'INV-20260621-001_draft.pdf',
                externalNote: 'お支払い期日は2026年7月末日です。ご入金確認後、領収書を発行いたします。',
                memo: '対象カード件数ではなく、対象内容、金額、状態を確認する。',
                paymentDue: '2026/07/31',
                paymentAccount: 'サンプル銀行 梅田支店 普通 1234567',
            },
            receipt: {
                title: '領収書',
                selectedCardIds: [
                    'card-product-001',
                    'card-work-001',
                    'card-expense-001',
                    'card-adjustment-001',
                ],
                amountLabel: '領収金額',
                issuedAt: '2026/07/01',
                documentNumber: 'REC-20260701-001',
                subject: '大阪ステーションシティ 4階 給湯配管交換工事',
                recipient: '株式会社サンプル商事 様',
                issuer: '株式会社サンプル設備',
                status: '入金確認待ち',
                targetSummary: '請求対象内容および領収金額。',
                fileLabel: 'REC-20260701-001_draft.pdf',
                externalNote: '上記金額を正に領収いたしました。',
                memo: '入金・領収確認に紐づく帳票成果物。',
                proviso: '給湯配管交換工事代として',
                receiptStatus: '未発行',
            },
        },
};

const sakuragaokaProject: Project = {
        id: 'project-sakuragaoka',
        name: 'セルリアンタワー 共用部漏水一次対応',
        customerName: 'セルリアンタワー管理組合',
        siteAddress: '東京都渋谷区桜丘町26-1 セルリアンタワー',
        parkingMemo: '建物前は短時間停車のみ。資材搬入後は指定駐車場へ移動。',
        loadingMemo: '北側の共用通路から搬入。雨天時は滑り止め養生を確認。',
        accessMethod: '管理組合担当者へ到着連絡後、共用通路から入場する。',
        keyNote: '共用部のみ。専有部キーの扱いなし。',
        visitNote: '訪問前に管理組合担当者へ到着予定時刻を連絡する。',
        emergencyContact: '管理組合 03-1111-1111 / 担当 高橋 090-1111-1111',
        siteMemo: '雨天時は共用通路が滑りやすい。',
        owner: '高橋 直人',
        pattern: '一次対応 + 追加作業候補',
        status: 'CSV受付済み',
        cardCount: '4枚',
        pendingCardCount: 1,
        confirmCount: 1,
        estimateStatus: '見積未作成',
        invoiceStatus: '請求未作成',
        receiptStatus: '領収書未発行',
        hasRelatedProjects: false,
        progressStatus: '現場確認待ち',
        amountSummary: 188000,
        lastUpdated: '2026/06/15 18:00',
        cards: osakaProject.cards.slice(0, 4),
        workflowStages: osakaProject.workflowStages
            .filter((stage) => stage.id !== 'exception-support')
            .map((stage) => ({
                ...stage,
                cardIds: stage.cardIds.filter(
                    (cardId) => cardId !== 'card-exception-001',
                ),
            })),
        histories: osakaProject.histories.slice(0, 2),
        relatedProjects: [],
        completionChecks: osakaProject.completionChecks.slice(0, 2),
        reports: osakaProject.reports,
};

export const projects: Project[] = [osakaProject, sakuragaokaProject];

export const screenSteps: {
    key: MockScreen;
    label: string;
}[] = [
    {
        key: 'entry',
        label: '案件登録',
    },
    {
        key: 'projects',
        label: '案件一覧',
    },
];

export function formatYen(amount: number) {
    const absoluteAmount = Math.abs(amount).toLocaleString('ja-JP');

    return amount < 0 ? `-${absoluteAmount}円` : `${absoluteAmount}円`;
}

export function formatQuantity(quantity: number, unit: string) {
    return `${quantity.toLocaleString('ja-JP')} ${unit}`;
}

export function parseYenInput(value: string) {
    const numericValue = Number(value.replace(/[^\d-]/g, ''));

    return Number.isFinite(numericValue) ? numericValue : 0;
}

export function isNegativeAmount(amount: number) {
    return amount < 0;
}
