import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import PublicLayout from '@/Layouts/PublicLayout';

type TabKey = 'order' | 'images' | 'workflow' | 'billing' | 'history';

type OrderDraft = {
    siteName: string;
    partner: string;
    orderDate: string;
    owner: string;
    note: string;
};

const tabs: { key: TabKey; label: string }[] = [
    { key: 'order', label: '発注情報' },
    { key: 'images', label: '画像' },
    { key: 'workflow', label: '工程' },
    { key: 'billing', label: '請求' },
    { key: 'history', label: '履歴' },
];

const orderLines = [
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

const imageCards = [
    { id: 'image-1', title: '着工前', meta: '外観 / 3枚', tone: 'from-sky-300 to-cyan-600' },
    { id: 'image-2', title: '足場設置', meta: '工程写真 / 5枚', tone: 'from-emerald-300 to-teal-700' },
    { id: 'image-3', title: '補修箇所', meta: '検収用 / 8枚', tone: 'from-amber-200 to-orange-600' },
];

const workflowSteps = [
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

const initialWorkflowStepState = workflowSteps.reduce<Record<string, boolean>>(
    (states, step, index) => ({
        ...states,
        [step.id]: index < 4,
    }),
    {},
);

const invoiceTypes = [
    { id: 'standard', label: '標準請求', summary: '発注単位で明細と合計をそのまま出す形式' },
    { id: 'partner', label: '取引先別請求', summary: '取引先指定の見出し・締め条件を優先する形式' },
    { id: 'monthly', label: '月締め請求', summary: '月内の複数発注を締めてまとめる形式' },
    { id: 'site', label: '現場別請求', summary: '同一現場の発注を束ねて確認する形式' },
];

const templates = [
    '標準テンプレート.xlsx',
    '取引先A指定テンプレート.xlsx',
    '月締め請求テンプレート.xlsx',
];

const outputFormats = ['Excel', 'PDF', 'CSV'];

const historyItems = [
    { id: 'history-1', label: 'CSV取込', detail: '見積CSVを取り込んだ想定の履歴です。', time: '2026/05/10 09:14' },
    { id: 'history-2', label: '発注編集', detail: '担当者と備考を更新した想定です。', time: '2026/05/10 11:22' },
    { id: 'history-3', label: '画像追加', detail: '現場写真をS3へ保存する予定の動線です。', time: '2026/05/11 15:05' },
    { id: 'history-4', label: '工程完了', detail: '発注確定をONにした想定です。', time: '2026/05/12 10:40' },
    { id: 'history-5', label: '工程解除', detail: '検収待ちへ戻した想定の監査ログです。', time: '2026/05/12 16:18' },
    { id: 'history-6', label: '請求書作成', detail: 'Excelテンプレートから請求書を作る予定です。', time: '2026/05/15 13:31' },
];

const inputClassName =
    'min-h-11 w-full rounded-lg border border-white/15 bg-slate-950/55 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-100 focus:ring-2 focus:ring-cyan-100/30';

const selectClassName =
    'min-h-11 w-full rounded-lg border border-white/15 bg-slate-950/75 px-3 py-2 text-sm font-semibold text-white outline-none transition focus:border-cyan-100 focus:ring-2 focus:ring-cyan-100/30';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
        maximumFractionDigits: 0,
    }).format(amount);
}

function tabClassName(isActive: boolean) {
    return isActive
        ? 'border-cyan-100 bg-cyan-100 text-slate-950 shadow-[0_10px_24px_rgba(103,232,249,0.2)]'
        : 'border-white/15 bg-white/8 text-slate-100 hover:bg-white/14';
}

function stepClassName(isActive: boolean) {
    return isActive
        ? 'border-emerald-200/70 bg-emerald-300/18 text-emerald-50'
        : 'border-white/15 bg-slate-950/45 text-slate-300';
}

export default function ConstructionOrderWorkflowMock() {
    const [activeTab, setActiveTab] = useState<TabKey>('order');
    const [registrationPreviewed, setRegistrationPreviewed] = useState(false);
    const [workflowEnabled, setWorkflowEnabled] = useState(true);
    const [workflowStepState, setWorkflowStepState] = useState<Record<string, boolean>>(
        initialWorkflowStepState,
    );
    const [invoiceType, setInvoiceType] = useState(invoiceTypes[0].id);
    const [template, setTemplate] = useState(templates[0]);
    const [outputFormat, setOutputFormat] = useState(outputFormats[0]);
    const [orderDraft, setOrderDraft] = useState<OrderDraft>({
        siteName: '青葉台レジデンス外壁改修',
        partner: '株式会社みなと建装',
        orderDate: '2026-05-16',
        owner: '佐藤 美咲',
        note: '現場写真、工程、請求書の流れをまとめて確認するための仮データです。',
    });

    const subtotal = useMemo(
        () => orderLines.reduce((total, line) => total + line.quantity * line.unitPrice, 0),
        [],
    );
    const tax = Math.floor(subtotal * 0.1);
    const grandTotal = subtotal + tax;
    const completedSteps = workflowSteps.filter((step) => workflowStepState[step.id]);
    const latestCompletedStep = completedSteps[completedSteps.length - 1];
    const currentStatus = workflowEnabled
        ? latestCompletedStep?.statusLabel ?? '発注登録中'
        : 'ワークフローOFF';
    const selectedInvoiceType =
        invoiceTypes.find((type) => type.id === invoiceType) ?? invoiceTypes[0];

    const updateDraft = (field: keyof OrderDraft, value: string) => {
        setOrderDraft((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const toggleWorkflowStep = (stepId: string) => {
        setWorkflowStepState((current) => ({
            ...current,
            [stepId]: !current[stepId],
        }));
    };

    return (
        <PublicLayout className="bg-slate-950/45 px-4 py-5 sm:px-6 lg:px-8">
            <Head title="工事発注管理・請求システム モック" />

            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 pb-8">
                <header className="rounded-lg border border-white/15 bg-slate-950/70 p-4 shadow-[0_18px_44px_rgba(2,6,23,0.24)] backdrop-blur-xl sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-md border border-cyan-100/35 bg-cyan-100/14 px-2.5 py-1 text-xs font-semibold text-cyan-50">
                                    見た目モック
                                </span>
                                <span className="rounded-md border border-white/15 bg-white/8 px-2.5 py-1 font-mono text-xs text-slate-200">
                                    発注番号 CO-2026-0516-008
                                </span>
                            </div>
                            <h1 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                                工事発注管理・請求システム
                            </h1>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200/80">
                                Excel、CSV取込、Laravel側の保存処理、S3画像保存、請求書出力までの全体像を、非エンジニアにも伝わる画面確認用として並べています。
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[340px]">
                            <div className="rounded-lg border border-emerald-200/30 bg-emerald-300/12 p-3">
                                <p className="text-xs text-emerald-50/75">現在ステータス</p>
                                <p className="mt-1 text-lg font-semibold text-emerald-50">{currentStatus}</p>
                            </div>
                            <Link
                                href="/lab"
                                className="inline-flex min-h-[68px] items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                            >
                                Lab 一覧へ
                            </Link>
                        </div>
                    </div>
                </header>

                <section className="rounded-lg border border-white/15 bg-slate-950/70 p-4 shadow-[0_18px_44px_rgba(2,6,23,0.2)] backdrop-blur-xl sm:p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-white">発注登録Form</h2>
                            <p className="mt-1 text-sm leading-6 text-slate-200/78">
                                入力内容は画面内の仮表示だけに反映します。実保存、DB接続、CSV取込は行いません。
                            </p>
                        </div>
                        <span className="rounded-md border border-amber-200/35 bg-amber-200/12 px-2.5 py-1 text-xs font-semibold text-amber-50">
                            保存処理なし
                        </span>
                    </div>

                    <form
                        className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            setRegistrationPreviewed(true);
                        }}
                    >
                        <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-100">
                            現場名
                            <input
                                className={inputClassName}
                                value={orderDraft.siteName}
                                onChange={(event) => updateDraft('siteName', event.target.value)}
                            />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-100">
                            取引先
                            <input
                                className={inputClassName}
                                value={orderDraft.partner}
                                onChange={(event) => updateDraft('partner', event.target.value)}
                            />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-100">
                            発注日
                            <input
                                className={inputClassName}
                                type="date"
                                value={orderDraft.orderDate}
                                onChange={(event) => updateDraft('orderDate', event.target.value)}
                            />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-100">
                            担当者
                            <input
                                className={inputClassName}
                                value={orderDraft.owner}
                                onChange={(event) => updateDraft('owner', event.target.value)}
                            />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-100 md:col-span-2 xl:col-span-3">
                            備考
                            <textarea
                                className={`${inputClassName} min-h-24 resize-none`}
                                value={orderDraft.note}
                                onChange={(event) => updateDraft('note', event.target.value)}
                            />
                        </label>
                        <div className="flex flex-col justify-end gap-2">
                            <button
                                type="submit"
                                className="min-h-11 rounded-lg bg-cyan-100 px-4 text-sm font-bold text-slate-950 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                            >
                                登録プレビュー
                            </button>
                            <p className="min-h-5 text-xs text-slate-300">
                                {registrationPreviewed ? '画面内で登録済み風に表示中' : 'クリックしても保存されません'}
                            </p>
                        </div>
                    </form>
                </section>

                <nav className="overflow-x-auto rounded-lg border border-white/15 bg-slate-950/70 p-2 backdrop-blur-xl">
                    <div className="flex min-w-max gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                className={`min-h-11 rounded-lg border px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 ${tabClassName(activeTab === tab.key)}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </nav>

                {activeTab === 'order' && (
                    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                        <article className="rounded-lg border border-white/15 bg-slate-950/70 p-4 backdrop-blur-xl sm:p-5">
                            <h2 className="text-xl font-semibold text-white">基本情報カード</h2>
                            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm">
                                {[
                                    ['現場名', orderDraft.siteName],
                                    ['取引先', orderDraft.partner],
                                    ['発注日', orderDraft.orderDate],
                                    ['担当者', orderDraft.owner],
                                    ['発注番号', 'CO-2026-0516-008'],
                                    ['金額合計', formatCurrency(grandTotal)],
                                ].map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="rounded-lg border border-white/10 bg-white/6 p-3"
                                    >
                                        <dt className="text-xs text-slate-300">{label}</dt>
                                        <dd className="mt-1 break-words font-semibold text-white">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </article>

                        <article className="rounded-lg border border-white/15 bg-slate-950/70 p-4 backdrop-blur-xl sm:p-5">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-white">発注明細テーブル</h2>
                                    <p className="mt-1 text-sm text-slate-200/78">
                                        スマホでは明細カード、広い画面では横スクロール可能な表で確認します。
                                    </p>
                                </div>
                                <p className="rounded-md border border-white/15 bg-white/8 px-2.5 py-1 text-xs text-slate-200">
                                    仮明細 {orderLines.length} 件
                                </p>
                            </div>

                            <div className="mt-4 grid gap-3 sm:hidden">
                                {orderLines.map((line) => (
                                    <article
                                        key={line.id}
                                        className="rounded-lg border border-white/12 bg-white/6 p-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-semibold text-white">{line.item}</h3>
                                                <p className="mt-1 text-sm text-slate-300">{line.spec}</p>
                                            </div>
                                            <p className="shrink-0 text-right text-sm font-bold text-cyan-50">
                                                {formatCurrency(line.quantity * line.unitPrice)}
                                            </p>
                                        </div>
                                        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                                            <div><dt>数量</dt><dd className="mt-0.5 text-white">{line.quantity}</dd></div>
                                            <div><dt>単位</dt><dd className="mt-0.5 text-white">{line.unit}</dd></div>
                                            <div><dt>単価</dt><dd className="mt-0.5 text-white">{formatCurrency(line.unitPrice)}</dd></div>
                                            <div><dt>税率</dt><dd className="mt-0.5 text-white">{line.taxRate}</dd></div>
                                        </dl>
                                        <p className="mt-3 rounded-md bg-slate-950/45 px-2.5 py-2 text-xs text-slate-200">
                                            {line.note}
                                        </p>
                                    </article>
                                ))}
                            </div>

                            <div className="mt-4 hidden overflow-x-auto sm:block">
                                <table className="min-w-[940px] w-full border-separate border-spacing-0 text-left text-sm">
                                    <thead className="text-xs text-slate-300">
                                        <tr>
                                            {['品名 / 工事項目', '仕様', '数量', '単位', '単価', '税率', '金額', '備考'].map((heading) => (
                                                <th
                                                    key={heading}
                                                    className="border-b border-white/15 bg-white/8 px-3 py-3 font-semibold"
                                                >
                                                    {heading}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orderLines.map((line) => (
                                            <tr key={line.id} className="text-slate-100">
                                                <td className="border-b border-white/10 px-3 py-3 font-semibold">{line.item}</td>
                                                <td className="border-b border-white/10 px-3 py-3 text-slate-300">{line.spec}</td>
                                                <td className="border-b border-white/10 px-3 py-3">{line.quantity}</td>
                                                <td className="border-b border-white/10 px-3 py-3">{line.unit}</td>
                                                <td className="border-b border-white/10 px-3 py-3">{formatCurrency(line.unitPrice)}</td>
                                                <td className="border-b border-white/10 px-3 py-3">{line.taxRate}</td>
                                                <td className="border-b border-white/10 px-3 py-3 font-bold text-cyan-50">
                                                    {formatCurrency(line.quantity * line.unitPrice)}
                                                </td>
                                                <td className="border-b border-white/10 px-3 py-3 text-slate-300">{line.note}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </article>
                    </section>
                )}

                {activeTab === 'images' && (
                    <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                        <article className="rounded-lg border border-white/15 bg-slate-950/70 p-4 backdrop-blur-xl sm:p-5">
                            <h2 className="text-xl font-semibold text-white">画像まとめアップロード</h2>
                            <div className="mt-4 flex min-h-[190px] flex-col items-center justify-center rounded-lg border border-dashed border-cyan-100/35 bg-cyan-100/8 p-5 text-center">
                                <p className="text-lg font-semibold text-white">現場写真をまとめて追加</p>
                                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200/80">
                                    本実装ではアップロード後にS3へ保存し、発注番号・工程・写真種別に紐づける想定です。
                                </p>
                                <button
                                    type="button"
                                    className="mt-4 min-h-11 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-bold text-white"
                                >
                                    アップロード風UI
                                </button>
                            </div>
                        </article>

                        <aside className="rounded-lg border border-amber-200/30 bg-amber-200/12 p-4 backdrop-blur-xl sm:p-5">
                            <h3 className="font-semibold text-amber-50">保存先予定</h3>
                            <p className="mt-2 text-sm leading-6 text-amber-50/80">
                                S3保存、サムネイル生成、PDF台帳連携は後続実装の責務として分離します。
                            </p>
                        </aside>

                        <div className="grid grid-cols-1 gap-3 lg:col-span-2 md:grid-cols-3">
                            {imageCards.map((image) => (
                                <article
                                    key={image.id}
                                    className="overflow-hidden rounded-lg border border-white/15 bg-slate-950/70"
                                >
                                    <div className={`h-32 bg-gradient-to-br ${image.tone}`} />
                                    <div className="p-4">
                                        <h3 className="font-semibold text-white">{image.title}</h3>
                                        <p className="mt-1 text-sm text-slate-300">{image.meta}</p>
                                        <p className="mt-3 rounded-md bg-slate-950/55 px-2.5 py-2 text-xs text-slate-300">
                                            仮画像カード。実ファイル保存はしません。
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {activeTab === 'workflow' && (
                    <section className="rounded-lg border border-white/15 bg-slate-950/70 p-4 backdrop-blur-xl sm:p-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-white">工程ワークフロー</h2>
                                <p className="mt-1 text-sm leading-6 text-slate-200/78">
                                    各工程のON/OFFだけでヘッダーの現在ステータスが変わる、画面内完結の確認用です。
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-pressed={workflowEnabled}
                                className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 ${
                                    workflowEnabled
                                        ? 'border-emerald-200/60 bg-emerald-300/18 text-emerald-50'
                                        : 'border-white/15 bg-white/8 text-slate-200'
                                }`}
                                onClick={() => setWorkflowEnabled((enabled) => !enabled)}
                            >
                                ワークフロー {workflowEnabled ? 'ON' : 'OFF'}
                            </button>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                            {workflowSteps.map((step, index) => {
                                const isActive = workflowEnabled && workflowStepState[step.id];

                                return (
                                    <button
                                        key={step.id}
                                        type="button"
                                        aria-pressed={isActive}
                                        className={`flex min-h-[92px] items-start gap-3 rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 ${stepClassName(isActive)}`}
                                        onClick={() => toggleWorkflowStep(step.id)}
                                    >
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current text-sm font-bold">
                                            {index + 1}
                                        </span>
                                        <span>
                                            <span className="block font-semibold">{step.label}</span>
                                            <span className="mt-1 block text-xs opacity-80">
                                                {isActive ? '完了扱い' : '未完了扱い'}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                {activeTab === 'billing' && (
                    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
                        <article className="rounded-lg border border-white/15 bg-slate-950/70 p-4 backdrop-blur-xl sm:p-5">
                            <h2 className="text-xl font-semibold text-white">請求書設定</h2>
                            <div className="mt-4 grid gap-4">
                                <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-100">
                                    請求書の種類
                                    <select
                                        className={selectClassName}
                                        value={invoiceType}
                                        onChange={(event) => setInvoiceType(event.target.value)}
                                    >
                                        {invoiceTypes.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-100">
                                    原型Excelテンプレート
                                    <select
                                        className={selectClassName}
                                        value={template}
                                        onChange={(event) => setTemplate(event.target.value)}
                                    >
                                        {templates.map((templateName) => (
                                            <option key={templateName} value={templateName}>
                                                {templateName}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-100">
                                    出力書類形式
                                    <select
                                        className={selectClassName}
                                        value={outputFormat}
                                        onChange={(event) => setOutputFormat(event.target.value)}
                                    >
                                        {outputFormats.map((format) => (
                                            <option key={format} value={format}>
                                                {format}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <div className="rounded-lg border border-cyan-100/25 bg-cyan-100/10 p-3">
                                    <h3 className="text-sm font-semibold text-cyan-50">{selectedInvoiceType.label}</h3>
                                    <p className="mt-1 text-sm leading-6 text-cyan-50/80">{selectedInvoiceType.summary}</p>
                                </div>
                                <button
                                    type="button"
                                    className="min-h-11 rounded-lg bg-cyan-100 px-4 text-sm font-bold text-slate-950"
                                >
                                    出力プレビュー
                                </button>
                            </div>
                        </article>

                        <article className="rounded-lg border border-white/15 bg-slate-950/70 p-4 backdrop-blur-xl sm:p-5">
                            <div className="rounded-lg bg-slate-100 p-4 text-slate-950 shadow-[0_20px_50px_rgba(2,6,23,0.25)] sm:p-6">
                                <div className="flex flex-col gap-3 border-b border-slate-300 pb-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500">請求書プレビュー</p>
                                        <h2 className="mt-1 text-2xl font-bold">御請求書</h2>
                                    </div>
                                    <div className="text-sm sm:text-right">
                                        <p>形式: {outputFormat}</p>
                                        <p>テンプレート: {template}</p>
                                        <p>発注番号: CO-2026-0516-008</p>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                                    <div>
                                        <p className="text-slate-500">請求先</p>
                                        <p className="mt-1 font-bold">{orderDraft.partner} 御中</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">対象現場</p>
                                        <p className="mt-1 font-bold">{orderDraft.siteName}</p>
                                    </div>
                                </div>

                                <div className="mt-5 overflow-x-auto">
                                    <table className="min-w-[620px] w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-y border-slate-300 text-slate-500">
                                                <th className="py-2 pr-3">明細</th>
                                                <th className="py-2 pr-3">数量</th>
                                                <th className="py-2 pr-3">単価</th>
                                                <th className="py-2 text-right">金額</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderLines.map((line) => (
                                                <tr key={line.id} className="border-b border-slate-200">
                                                    <td className="py-2 pr-3 font-semibold">{line.item}</td>
                                                    <td className="py-2 pr-3">{line.quantity}{line.unit}</td>
                                                    <td className="py-2 pr-3">{formatCurrency(line.unitPrice)}</td>
                                                    <td className="py-2 text-right font-semibold">
                                                        {formatCurrency(line.quantity * line.unitPrice)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <dl className="mt-5 ml-auto grid max-w-sm gap-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <dt>小計</dt>
                                        <dd>{formatCurrency(subtotal)}</dd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <dt>消費税</dt>
                                        <dd>{formatCurrency(tax)}</dd>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-slate-300 pt-2 text-lg font-bold">
                                        <dt>合計</dt>
                                        <dd>{formatCurrency(grandTotal)}</dd>
                                    </div>
                                </dl>
                            </div>
                        </article>
                    </section>
                )}

                {activeTab === 'history' && (
                    <section className="rounded-lg border border-white/15 bg-slate-950/70 p-4 backdrop-blur-xl sm:p-5">
                        <h2 className="text-xl font-semibold text-white">履歴タイムライン</h2>
                        <div className="mt-5 grid gap-3">
                            {historyItems.map((item) => (
                                <article
                                    key={item.id}
                                    className="grid gap-2 rounded-lg border border-white/12 bg-white/6 p-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-start"
                                >
                                    <time className="text-xs font-semibold text-cyan-100">{item.time}</time>
                                    <div>
                                        <h3 className="font-semibold text-white">{item.label}</h3>
                                        <p className="mt-1 text-sm leading-6 text-slate-300">{item.detail}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </PublicLayout>
    );
}
