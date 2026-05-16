export type TabKey =
    | 'registration'
    | 'order'
    | 'images'
    | 'workflow'
    | 'billing'
    | 'history';

export type OrderDraft = {
    siteName: string;
    siteAddress: string;
    partner: string;
    orderDate: string;
    owner: string;
    note: string;
};

export type OrderLine = {
    id: string;
    item: string;
    spec: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    taxRate: string;
    note: string;
};

export type ImageCard = {
    id: string;
    title: string;
    meta: string;
    tone: string;
};

export type WorkflowStep = {
    id: string;
    label: string;
    statusLabel: string;
};

export type InvoiceType = {
    id: string;
    label: string;
    summary: string;
};

export type HistoryItem = {
    id: string;
    label: string;
    detail: string;
    time: string;
};

/*
 * Mock のタブ構成です。
 * 「発注登録」は入力作業、「発注情報」は確認作業として分けます。
 * ここを分けておくと、後続で本番化するときにも登録・確認・工程・請求の
 * 画面責務を混ぜずに検討できます。
 */
export const tabs: { key: TabKey; label: string }[] = [
    { key: 'registration', label: '発注登録' },
    { key: 'order', label: '発注情報' },
    { key: 'images', label: '画像' },
    { key: 'workflow', label: '工程' },
    { key: 'billing', label: '請求' },
    { key: 'history', label: '履歴' },
];

/*
 * 発注明細の固定データです。
 * CSV実取込やDB取得を先に入れると、画面確認と本番処理の責務が混ざるため、
 * Mock では手入力相当のサンプル明細として扱います。
 */
export const orderLines: OrderLine[] = [
    {
        id: 'line-1',
        item: '仮設足場工事',
        spec: 'くさび式足場 外周一式',
        quantity: 120,
        unit: 'm2',
        unitPrice: 1800,
        taxRate: '10%',
        note: '安全帯設備込み',
    },
    {
        id: 'line-2',
        item: '外壁補修',
        spec: 'ひび割れ補修・下地調整',
        quantity: 42,
        unit: '箇所',
        unitPrice: 6500,
        taxRate: '10%',
        note: '写真台帳対象',
    },
    {
        id: 'line-3',
        item: '防水トップコート',
        spec: '屋上 ウレタン仕上げ',
        quantity: 85,
        unit: 'm2',
        unitPrice: 3200,
        taxRate: '10%',
        note: '天候順延あり',
    },
];

/*
 * 画像カードも実ファイルではなく、見た目確認用の固定カードです。
 * アップロード、サムネイル生成、外部ストレージ保存は本番寄り実装で扱います。
 */
export const imageCards: ImageCard[] = [
    {
        id: 'image-1',
        title: '着工前',
        meta: '外観 / 3枚',
        tone: 'from-sky-300 to-cyan-600',
    },
    {
        id: 'image-2',
        title: '足場設置',
        meta: '工程写真 / 5枚',
        tone: 'from-emerald-300 to-teal-700',
    },
    {
        id: 'image-3',
        title: '補修箇所',
        meta: '検収用 / 8枚',
        tone: 'from-amber-200 to-orange-600',
    },
];

/*
 * 工程ステップの固定定義です。
 * statusLabel はヘッダーの現在ステータス表示に使い、label はボタン表示に使います。
 * Mock では順序制御や権限制御を行わず、ON/OFFしたときの見え方だけ確認します。
 */
export const workflowSteps: WorkflowStep[] = [
    { id: 'csv-imported', label: 'CSV取込済み', statusLabel: 'CSV取込済み' },
    { id: 'order-data', label: '発注データ化済み', statusLabel: '発注データ化済み' },
    { id: 'images', label: '画像登録済み', statusLabel: '画像登録済み' },
    { id: 'fixed', label: '発注確定済み', statusLabel: '発注確定済み' },
    { id: 'completed', label: '工事完了済み', statusLabel: '工事完了済み' },
    { id: 'accepted', label: '検収済み', statusLabel: '検収済み' },
    { id: 'invoice-created', label: '請求書作成済み', statusLabel: '請求書作成済み' },
    { id: 'invoice-sent', label: '請求書送付済み', statusLabel: '請求書送付済み' },
    { id: 'paid', label: '入金確認済み', statusLabel: '入金確認済み' },
];

/*
 * 初期状態では前半工程だけを完了扱いにします。
 * 実運用の進捗判定ではなく、開いた直後に「進行中の案件」に見えるようにする
 * モック用の初期表示です。
 */
export const initialWorkflowStepState = workflowSteps.reduce<Record<string, boolean>>(
    (states, step, index) => ({
        ...states,
        [step.id]: index < 4,
    }),
    {},
);

/*
 * 請求書の種類・テンプレート・出力形式の選択肢です。
 * ここでは選んだ内容をプレビューへ反映するだけで、Excel生成やPDF生成はしません。
 */
export const invoiceTypes: InvoiceType[] = [
    {
        id: 'standard',
        label: '標準請求',
        summary: '発注単位で明細と合計をそのまま出す形式',
    },
    {
        id: 'partner',
        label: '取引先別請求',
        summary: '取引先指定の見出し・締め条件を優先する形式',
    },
    {
        id: 'monthly',
        label: '月締め請求',
        summary: '月内の複数発注を締めてまとめる形式',
    },
    {
        id: 'site',
        label: '現場別請求',
        summary: '同一現場の発注を束ねて確認する形式',
    },
];

export const templates = [
    '標準テンプレート.xlsx',
    '取引先A指定テンプレート.xlsx',
    '月締め請求テンプレート.xlsx',
];

export const outputFormats = ['Excel', 'PDF', 'CSV'];

/*
 * 履歴タイムラインの固定データです。
 * 本番では監査ログや操作履歴から作る想定ですが、Mock では履歴が残る
 * 画面イメージを伝えるためのサンプルとして持ちます。
 */
export const historyItems: HistoryItem[] = [
    {
        id: 'history-1',
        label: 'CSV取込',
        detail: '見積CSVを取り込んだ想定の履歴です。',
        time: '2026/05/10 09:14',
    },
    {
        id: 'history-2',
        label: '発注編集',
        detail: '担当者と備考を更新した想定です。',
        time: '2026/05/10 11:22',
    },
    {
        id: 'history-3',
        label: '画像追加',
        detail: '現場写真をS3へ保存する予定の動線です。',
        time: '2026/05/11 15:05',
    },
    {
        id: 'history-4',
        label: '工程完了',
        detail: '発注確定をONにした想定です。',
        time: '2026/05/12 10:40',
    },
    {
        id: 'history-5',
        label: '工程解除',
        detail: '検収待ちへ戻した想定の監査ログです。',
        time: '2026/05/12 16:18',
    },
    {
        id: 'history-6',
        label: '請求書作成',
        detail: 'Excelテンプレートから請求書を作る予定です。',
        time: '2026/05/15 13:31',
    },
];

// 金額表示を日本円表記に揃えるための表示専用 helper です。
export function formatCurrency(amount: number) {
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
        maximumFractionDigits: 0,
    }).format(amount);
}
