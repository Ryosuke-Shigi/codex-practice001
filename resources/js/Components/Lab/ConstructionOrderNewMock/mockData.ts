export type MockScreen =
    | 'entry'
    | 'csv'
    | 'projects'
    | 'project-detail'
    | 'card-detail';

export type ProjectDetailTab =
    | 'access'
    | 'cards'
    | 'progress'
    | 'estimate'
    | 'invoice'
    | 'receipt';

export type DocumentType = 'estimate' | 'invoice' | 'receipt';

export type CardKind = 'work' | 'product' | 'expense' | 'adjustment' | 'issue' | 'followUp';

export type CardCategory = '工事費' | '商品' | '諸経費' | '調整';

export type CsvStatus = '投入待ち' | '受付済み' | 'エラー';

export type DetailRow = {
    id: string;
    content: string;
    displayLabel: string;
    measuredValue: string;
    unit: string;
    fixedAmount: string;
    memo: string;
};

export type PhotoQueueItem = {
    id: string;
    title: string;
    memo: string;
    status: string;
};

export type FileImportItem = {
    id: string;
    fileName: string;
    displayName: string;
    memo: string;
    status: string;
};

export type WorkCard = {
    id: string;
    kind: CardKind;
    title: string;
    status: string;
    amount: string;
    category: CardCategory;
    hasMemo: boolean;
    hasPhotos: boolean;
    hasFiles: boolean;
    billingTarget: '請求対象' | '非対象';
    receiptTarget: '領収対象' | '領収対象外';
    followUp: boolean;
    issue: boolean;
    summary: string;
    detailRows: DetailRow[];
    photos: PhotoQueueItem[];
    files: FileImportItem[];
    memo: string;
};

export type ReportPreview = {
    title: string;
    templateOptions: string[];
    selectedTemplate: string;
    selectedCardIds: string[];
    amountLabel: string;
    amount: string;
    recipient: string;
    issuer: string;
    overview: string;
    pages: {
        title: string;
        lines: string[];
    }[];
    extraFields: {
        label: string;
        value: string;
    }[];
};

export type Project = {
    id: string;
    name: string;
    customerName: string;
    siteAddress: string;
    parkingMemo: string;
    loadingMemo: string;
    visitNote: string;
    owner: string;
    status: string;
    cardCount: string;
    estimateStatus: string;
    invoiceStatus: string;
    hasFollowUp: boolean;
    hasIssue: boolean;
    progressStatus: string;
    cards: WorkCard[];
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

export type EntryDraft = {
    projectName: string;
    customerName: string;
    siteAddress: string;
    owner: string;
    productName: string;
    productLabel: string;
    productMeasurement: string;
    productUnit: string;
    productFixedAmount: string;
    productMemo: string;
    note: string;
};

export const initialEntryDraft: EntryDraft = {
    projectName: '青葉台レジデンス 401号室 給湯配管交換',
    customerName: '株式会社サンプル商事',
    siteAddress: '東京都目黒区青葉台1-2-3 青葉台レジデンス401',
    owner: '佐藤 美咲',
    productName: '省エネ給湯器 GT-2460SAWX',
    productLabel: '給湯器本体',
    productMeasurement: '1',
    productUnit: '台',
    // 金額は確定金額の文字列として扱い、自動計算や再計算は入れない。
    productFixedAmount: '305,000円',
    productMemo: '既存品番と搬入寸法を訪問前に確認',
    note: '管理組合への連絡後、CSV作成へ進める。',
};

export const csvFiles: CsvFile[] = [
    {
        id: 'csv-1',
        fileName: 'aobadai_401_work_cards.csv',
        size: '42 KB',
        rowCount: '18件',
        memo: '作業カード、商品カード、諸経費カードを含む',
        status: '受付済み',
    },
    {
        id: 'csv-2',
        fileName: 'aobadai_401_follow_up.csv',
        size: '12 KB',
        rowCount: '4件',
        memo: '後日対応カードだけを追加投入する想定',
        status: '投入待ち',
    },
    {
        id: 'csv-3',
        fileName: 'meguro_adjustments.csv',
        size: '9 KB',
        rowCount: '2件',
        memo: '金額列は確定金額の文字列として扱う',
        status: 'エラー',
    },
];

export const cardKindLabels: Record<CardKind, string> = {
    work: '作業カード',
    product: '商品カード',
    expense: '諸経費カード',
    adjustment: '調整カード',
    issue: '問題対応カード',
    followUp: '後日対応カード',
};

export const cardKindStyles: Record<
    CardKind,
    {
        panel: string;
        badge: string;
    }
> = {
    work: {
        panel: 'border-blue-300 bg-blue-50',
        badge: 'border-blue-300 bg-blue-100 text-blue-900',
    },
    product: {
        panel: 'border-emerald-300 bg-emerald-50',
        badge: 'border-emerald-300 bg-emerald-100 text-emerald-900',
    },
    expense: {
        panel: 'border-amber-300 bg-amber-50',
        badge: 'border-amber-300 bg-amber-100 text-amber-950',
    },
    adjustment: {
        panel: 'border-rose-300 bg-rose-50',
        badge: 'border-rose-300 bg-rose-100 text-rose-900',
    },
    issue: {
        panel: 'border-violet-300 bg-violet-50',
        badge: 'border-violet-300 bg-violet-100 text-violet-900',
    },
    followUp: {
        panel: 'border-cyan-300 bg-cyan-50',
        badge: 'border-cyan-300 bg-cyan-100 text-cyan-950',
    },
};

const sharedPhotos: PhotoQueueItem[] = [
    {
        id: 'photo-1',
        title: '施工前',
        memo: '配管まわりの既存状態',
        status: 'キュー内',
    },
    {
        id: 'photo-2',
        title: '施工後',
        memo: '連続撮影2枚目のサムネイル',
        status: '再試行待ち',
    },
];

const sharedFiles: FileImportItem[] = [
    {
        id: 'file-1',
        fileName: 'manufacturer_spec.pdf',
        displayName: 'メーカー仕様書',
        memo: '商品カードの添付想定',
        status: '受付済み',
    },
    {
        id: 'file-2',
        fileName: 'site_note.xlsx',
        displayName: '現場メモ',
        memo: '現場メモ添付',
        status: '投入待ち',
    },
];

export const projects: Project[] = [
    {
        id: 'project-aobadai-401',
        name: '青葉台レジデンス 401号室 給湯配管交換',
        customerName: '株式会社サンプル商事',
        siteAddress: '東京都目黒区青葉台1-2-3 青葉台レジデンス401',
        parkingMemo: '近隣コインパーキング利用。搬入時間帯は9:00以降に限定。',
        loadingMemo: '東側通用口から搬入。台車利用可、エレベーター養生が必要。',
        visitNote: '管理人室で401号室作業の入館記録を記入してから訪問する。',
        owner: '佐藤 美咲',
        status: '案件詳細レビュー中',
        cardCount: '6枚',
        estimateStatus: '見積プレビュー確認中',
        invoiceStatus: '請求書未確定',
        hasFollowUp: true,
        hasIssue: true,
        progressStatus: '問題対応と後日対応を分離確認中',
        cards: [
            {
                id: 'card-work-001',
                kind: 'work',
                title: '既設配管撤去と新規配管',
                status: '完了',
                amount: '120,000円',
                category: '工事費',
                hasMemo: true,
                hasPhotos: true,
                hasFiles: false,
                billingTarget: '請求対象',
                receiptTarget: '領収対象',
                followUp: false,
                issue: false,
                summary: '作業内容と計測値を行単位で保持するカード。',
                detailRows: [
                    {
                        id: 'row-work-1',
                        content: '既設配管撤去',
                        displayLabel: '撤去作業',
                        measuredValue: '1',
                        unit: '式',
                        fixedAmount: '45,000円',
                        memo: '現場写真あり',
                    },
                    {
                        id: 'row-work-2',
                        content: '新規配管敷設',
                        displayLabel: '配管長',
                        measuredValue: '12.5',
                        unit: 'm',
                        fixedAmount: '75,000円',
                        memo: '数量は固定列ではなく表示行で扱う',
                    },
                ],
                photos: sharedPhotos,
                files: [],
                memo: '配管まわりの写真を確認してから明細を更新する。',
            },
            {
                id: 'card-product-001',
                kind: 'product',
                title: '給湯器リモコン交換',
                status: '完了',
                amount: '86,000円',
                category: '商品',
                hasMemo: true,
                hasPhotos: true,
                hasFiles: true,
                billingTarget: '請求対象',
                receiptTarget: '領収対象',
                followUp: false,
                issue: false,
                summary: '商品数や品番を行として持つ商品カード。',
                detailRows: [
                    {
                        id: 'row-product-1',
                        content: '壁付リモコン',
                        displayLabel: '商品数',
                        measuredValue: '3',
                        unit: '個',
                        fixedAmount: '60,000円',
                        memo: '型番はファイル添付で補足',
                    },
                    {
                        id: 'row-product-2',
                        content: '取付部材',
                        displayLabel: '部材セット',
                        measuredValue: '1',
                        unit: '式',
                        fixedAmount: '26,000円',
                        memo: '確定金額を保持',
                    },
                ],
                photos: sharedPhotos.slice(0, 1),
                files: sharedFiles,
                memo: '商品カードは商品マスタ未接続の見た目確認だけに限定。',
            },
            {
                id: 'card-expense-001',
                kind: 'expense',
                title: '駐車場・養生費',
                status: '完了',
                amount: '18,000円',
                category: '諸経費',
                hasMemo: true,
                hasPhotos: false,
                hasFiles: true,
                billingTarget: '請求対象',
                receiptTarget: '領収対象',
                followUp: false,
                issue: false,
                summary: '現場諸経費を工事費と分けるカード。',
                detailRows: [
                    {
                        id: 'row-expense-1',
                        content: '近隣駐車場',
                        displayLabel: '利用日',
                        measuredValue: '2',
                        unit: '日',
                        fixedAmount: '8,000円',
                        memo: '領収書ファイル添付あり',
                    },
                    {
                        id: 'row-expense-2',
                        content: '共用部養生',
                        displayLabel: '基本工事',
                        measuredValue: '1',
                        unit: '式',
                        fixedAmount: '10,000円',
                        memo: '請求対象',
                    },
                ],
                photos: [],
                files: sharedFiles.slice(1),
                memo: '諸経費は帳票の明細面で別カテゴリとして表示する。',
            },
            {
                id: 'card-adjustment-001',
                kind: 'adjustment',
                title: '端数調整',
                status: '見積反映済み',
                amount: '-4,000円',
                category: '調整',
                hasMemo: true,
                hasPhotos: false,
                hasFiles: false,
                billingTarget: '請求対象',
                receiptTarget: '領収対象',
                followUp: false,
                issue: false,
                summary: '調整理由をメモとして残すカード。',
                detailRows: [
                    {
                        id: 'row-adjustment-1',
                        content: '端数調整',
                        displayLabel: '調整',
                        measuredValue: '1',
                        unit: '式',
                        fixedAmount: '-4,000円',
                        memo: '確定金額として保持',
                    },
                ],
                photos: [],
                files: [],
                memo: '調整金額も文字列の確定金額として表示。',
            },
            {
                id: 'card-issue-001',
                kind: 'issue',
                title: '床下点検口まわり補修',
                status: '問題対応中',
                amount: '32,000円',
                category: '工事費',
                hasMemo: true,
                hasPhotos: true,
                hasFiles: true,
                billingTarget: '非対象',
                receiptTarget: '領収対象外',
                followUp: false,
                issue: true,
                summary: '問題対応を通常作業と混ぜずに見るカード。',
                detailRows: [
                    {
                        id: 'row-issue-1',
                        content: '床下点検口まわり補修',
                        displayLabel: '補修範囲',
                        measuredValue: '1',
                        unit: '箇所',
                        fixedAmount: '32,000円',
                        memo: '請求対象外として表示',
                    },
                ],
                photos: sharedPhotos,
                files: sharedFiles.slice(0, 1),
                memo: '問題対応カードは別フラグで追跡し、案件進行でも確認する。',
            },
            {
                id: 'card-follow-001',
                kind: 'followUp',
                title: '水圧確認の再訪問',
                status: '後日対応',
                amount: '0円',
                category: '工事費',
                hasMemo: true,
                hasPhotos: false,
                hasFiles: false,
                billingTarget: '非対象',
                receiptTarget: '領収対象外',
                followUp: true,
                issue: false,
                summary: '後日対応を請求対象から切り離して見るカード。',
                detailRows: [
                    {
                        id: 'row-follow-1',
                        content: '水圧確認',
                        displayLabel: '再訪問',
                        measuredValue: '未定',
                        unit: '回',
                        fixedAmount: '0円',
                        memo: '次回訪問で確定',
                    },
                ],
                photos: [],
                files: [],
                memo: '訪問日が決まり次第、担当者へ連絡する。',
            },
        ],
        reports: {
            estimate: {
                title: '御見積書',
                templateOptions: ['標準見積_v4.xlsx', '工事項目多め_v4.xlsx', '商品多め_v4.xlsx'],
                selectedTemplate: '標準見積_v4.xlsx',
                selectedCardIds: ['card-work-001', 'card-product-001', 'card-expense-001', 'card-adjustment-001'],
                amountLabel: '御見積金額',
                amount: '220,000円',
                recipient: '株式会社サンプル商事 御中',
                issuer: '株式会社サンプル設備',
                overview: 'Excelテンプレートへ対象カードを差し込む将来構想のプレビューです。',
                pages: [
                    {
                        title: '1面目 表紙 / 概要',
                        lines: ['案件名、顧客名、提出日、会社情報', '対象カードの概要', '御見積金額'],
                    },
                    {
                        title: '2面目 明細',
                        lines: ['工事費', '商品', '諸経費', '調整'],
                    },
                    {
                        title: '3面目 まとめ',
                        lines: ['カテゴリ別整理', '提出メモ', '合計欄'],
                    },
                ],
                extraFields: [
                    {
                        label: '出力形式',
                        value: 'Excel出力 / 必要ならPDF変換',
                    },
                ],
            },
            invoice: {
                title: '御請求書',
                templateOptions: ['標準請求_v4.xlsx', '振込先強調_v4.xlsx', '検収条件つき_v4.xlsx'],
                selectedTemplate: '標準請求_v4.xlsx',
                selectedCardIds: ['card-work-001', 'card-product-001', 'card-expense-001', 'card-adjustment-001'],
                amountLabel: '御請求金額',
                amount: '220,000円',
                recipient: '株式会社サンプル商事 御中',
                issuer: '株式会社サンプル設備',
                overview: '請求対象カードだけを選び、振込先と支払条件を提出書類風に見せます。',
                pages: [
                    {
                        title: '1面目 請求表紙',
                        lines: ['請求金額', '支払条件', '振込先'],
                    },
                    {
                        title: '2面目 請求明細',
                        lines: ['請求対象カード', '非対象カードは除外表示', 'カテゴリ別明細'],
                    },
                    {
                        title: '3面目 ご確認欄',
                        lines: ['検収メモ', '支払期日', '担当者欄'],
                    },
                ],
                extraFields: [
                    {
                        label: '振込先',
                        value: 'サンプル銀行 青葉台支店 普通 1234567',
                    },
                    {
                        label: '支払条件',
                        value: '2026年7月末日までにお振込み',
                    },
                ],
            },
            receipt: {
                title: '領収書',
                templateOptions: ['標準領収_v4.xlsx', '印影欄あり_v4.xlsx', '但し書き強調_v4.xlsx'],
                selectedTemplate: '印影欄あり_v4.xlsx',
                selectedCardIds: ['card-work-001', 'card-product-001', 'card-expense-001', 'card-adjustment-001'],
                amountLabel: '領収金額',
                amount: '220,000円',
                recipient: '株式会社サンプル商事 様',
                issuer: '株式会社サンプル設備',
                overview: '領収対象カードから領収書面を確認するための提出書類風プレビューです。',
                pages: [
                    {
                        title: '1面目 領収書面',
                        lines: ['領収金額', '但し書き', '発行者情報', '印影欄'],
                    },
                    {
                        title: '2面目 控え',
                        lines: ['対象カード一覧', '領収対象外の除外', '発行メモ'],
                    },
                    {
                        title: '3面目 保管メモ',
                        lines: ['発行日', '担当者', '再発行欄'],
                    },
                ],
                extraFields: [
                    {
                        label: '但し書き',
                        value: '給湯配管交換工事代として',
                    },
                    {
                        label: '印影欄',
                        value: '右下に押印スペース',
                    },
                ],
            },
        },
    },
    {
        id: 'project-sakuragaoka',
        name: '桜丘ハイツ 共用部漏水一次対応',
        customerName: '桜丘ハイツ管理組合',
        siteAddress: '東京都渋谷区桜丘町4-5',
        parkingMemo: '建物前は短時間停車のみ。資材搬入後は指定駐車場へ移動。',
        loadingMemo: '北側の共用通路から搬入。雨天時は滑り止め養生を確認。',
        visitNote: '訪問前に管理組合担当者へ到着予定時刻を連絡する。',
        owner: '高橋 直人',
        status: 'CSV受付済み',
        cardCount: '4枚',
        estimateStatus: '見積未作成',
        invoiceStatus: '請求未作成',
        hasFollowUp: true,
        hasIssue: false,
        progressStatus: '後日対応あり',
        cards: [],
        reports: {} as Record<DocumentType, ReportPreview>,
    },
];

projects[1].cards = projects[0].cards.slice(0, 4);
projects[1].reports = projects[0].reports;

export const projectDetailTabs: {
    key: ProjectDetailTab;
    label: string;
}[] = [
    {
        key: 'access',
        label: '現場アクセス',
    },
    {
        key: 'cards',
        label: 'カード一覧',
    },
    {
        key: 'progress',
        label: '案件進行',
    },
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

export const screenSteps: {
    key: MockScreen;
    label: string;
}[] = [
    {
        key: 'entry',
        label: 'FORM',
    },
    {
        key: 'csv',
        label: '一括取込',
    },
    {
        key: 'projects',
        label: '案件一覧',
    },
    {
        key: 'project-detail',
        label: '案件詳細',
    },
];
