import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import HistoryTimeline from '@/Components/Lab/ConstructionOrderWorkflowMock/HistoryTimeline';
import ImageUploadMockPanel from '@/Components/Lab/ConstructionOrderWorkflowMock/ImageUploadMockPanel';
import InvoicePreviewPanel from '@/Components/Lab/ConstructionOrderWorkflowMock/InvoicePreviewPanel';
import InvoiceSettingsPanel from '@/Components/Lab/ConstructionOrderWorkflowMock/InvoiceSettingsPanel';
import MockHeader from '@/Components/Lab/ConstructionOrderWorkflowMock/MockHeader';
import MockTabNavigation from '@/Components/Lab/ConstructionOrderWorkflowMock/MockTabNavigation';
import OrderForm from '@/Components/Lab/ConstructionOrderWorkflowMock/OrderForm';
import OrderLinesTable from '@/Components/Lab/ConstructionOrderWorkflowMock/OrderLinesTable';
import OrderSummaryCard from '@/Components/Lab/ConstructionOrderWorkflowMock/OrderSummaryCard';
import WorkflowStepsPanel from '@/Components/Lab/ConstructionOrderWorkflowMock/WorkflowStepsPanel';
import {
    historyItems,
    initialWorkflowStepState,
    invoiceTypes,
    orderLines,
    outputFormats,
    templates,
    workflowSteps,
} from '@/Components/Lab/ConstructionOrderWorkflowMock/mockData';
import type {
    OrderDraft,
    TabKey,
} from '@/Components/Lab/ConstructionOrderWorkflowMock/mockData';
import PublicLayout from '@/Layouts/PublicLayout';

export default function ConstructionOrderWorkflowMock() {
    /*
     * このページは操作確認用の Mock です。
     * 親ページは「どのタブを見ているか」「入力中の仮データ」「工程ON/OFF」
     * など、画面内 state だけを管理します。DB保存、CSV実取込、S3保存、
     * 請求書生成のような本番処理はここにも子コンポーネントにも置きません。
     */
    const [activeTab, setActiveTab] = useState<TabKey>('registration');
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

    /*
     * 金額計算は請求プレビューを画面上で見せるための軽い表示計算です。
     * 見積確定、税計算ルール、請求書生成などの業務判断はまだ扱わず、
     * 固定明細を合算してモックの見た目に反映するだけに留めます。
     */
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

    /*
     * 入力フォームの変更は orderDraft にだけ反映します。
     * この callback は子コンポーネントへ渡しますが、通信や保存を開始する
     * 責務は持たせず、フォーム操作の手触り確認だけに使います。
     */
    const updateDraft = (field: keyof OrderDraft, value: string) => {
        setOrderDraft((current) => ({
            ...current,
            [field]: value,
        }));
    };

    /*
     * 工程ステップも画面内のON/OFFだけです。
     * 本番では工程更新の権限、履歴、通知などを分けて扱う想定ですが、
     * Mock ではステータス表示の分かりやすさだけを確認します。
     */
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
                <MockHeader currentStatus={currentStatus} />

                <MockTabNavigation activeTab={activeTab} onChange={setActiveTab} />

                {/*
                    発注登録は入力作業の入口なので、発注情報タブから分離します。
                    ここで入力した仮データは、発注情報カードと請求プレビューへ
                    画面内で反映されるだけで、保存処理は走りません。
                */}
                {activeTab === 'registration' && (
                    <OrderForm
                        orderDraft={orderDraft}
                        registrationPreviewed={registrationPreviewed}
                        onPreview={() => setRegistrationPreviewed(true)}
                        onUpdate={updateDraft}
                    />
                )}

                {/*
                    発注情報タブは確認用です。
                    登録フォームを混ぜず、基本情報と明細の見え方を確認する領域にします。
                */}
                {activeTab === 'order' && (
                    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                        <OrderSummaryCard orderDraft={orderDraft} grandTotal={grandTotal} />
                        <OrderLinesTable orderLines={orderLines} />
                    </section>
                )}

                {activeTab === 'images' && <ImageUploadMockPanel />}

                {activeTab === 'workflow' && (
                    <WorkflowStepsPanel
                        workflowEnabled={workflowEnabled}
                        workflowStepState={workflowStepState}
                        workflowSteps={workflowSteps}
                        onToggleWorkflowEnabled={() =>
                            setWorkflowEnabled((enabled) => !enabled)
                        }
                        onToggleStep={toggleWorkflowStep}
                    />
                )}

                {activeTab === 'billing' && (
                    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
                        <InvoiceSettingsPanel
                            invoiceType={invoiceType}
                            template={template}
                            outputFormat={outputFormat}
                            invoiceTypes={invoiceTypes}
                            templates={templates}
                            outputFormats={outputFormats}
                            selectedInvoiceType={selectedInvoiceType}
                            onInvoiceTypeChange={setInvoiceType}
                            onTemplateChange={setTemplate}
                            onOutputFormatChange={setOutputFormat}
                        />
                        <InvoicePreviewPanel
                            orderDraft={orderDraft}
                            orderLines={orderLines}
                            template={template}
                            outputFormat={outputFormat}
                            subtotal={subtotal}
                            tax={tax}
                            grandTotal={grandTotal}
                        />
                    </section>
                )}

                {activeTab === 'history' && (
                    <HistoryTimeline historyItems={historyItems} />
                )}
            </div>
        </PublicLayout>
    );
}
