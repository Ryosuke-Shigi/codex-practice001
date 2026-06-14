/**
 * 工事発注管理・請求システムの idea-board Page Component です。
 *
 * 実DB、CSV取込、帳票生成には接続せず、説明用セクションの組み立てだけを担当します。
 */
import { Head } from '@inertiajs/react';

import BasicConceptCards from '@/Components/Lab/ConstructionOrderWorkflowPP/BasicConceptCards';
import ConceptHero from '@/Components/Lab/ConstructionOrderWorkflowPP/ConceptHero';
import ConstructionBillingBillingGateSection from '@/Components/Lab/ConstructionOrderWorkflowPP/ConstructionBillingBillingGateSection';
import ConstructionBillingBillingLifecycleSection from '@/Components/Lab/ConstructionOrderWorkflowPP/ConstructionBillingBillingLifecycleSection';
import ConstructionBillingCaseStructureSection from '@/Components/Lab/ConstructionOrderWorkflowPP/ConstructionBillingCaseStructureSection';
import ConstructionBillingCsvEntrySection from '@/Components/Lab/ConstructionOrderWorkflowPP/ConstructionBillingCsvEntrySection';
import ConstructionBillingCsvProcessingSection from '@/Components/Lab/ConstructionOrderWorkflowPP/ConstructionBillingCsvProcessingSection';
import ConstructionBillingScreenSection from '@/Components/Lab/ConstructionOrderWorkflowPP/ConstructionBillingScreenSection';
import ConstructionBillingSkipHoldSection from '@/Components/Lab/ConstructionOrderWorkflowPP/ConstructionBillingSkipHoldSection';
import ConstructionBillingStatusChartSection from '@/Components/Lab/ConstructionOrderWorkflowPP/ConstructionBillingStatusChartSection';
import ConstructionBillingTechNotesSection from '@/Components/Lab/ConstructionOrderWorkflowPP/ConstructionBillingTechNotesSection';
import ConstructionBillingUploadFoundationSection from '@/Components/Lab/ConstructionOrderWorkflowPP/ConstructionBillingUploadFoundationSection';
import ConstructionBillingWorkCardSection from '@/Components/Lab/ConstructionOrderWorkflowPP/ConstructionBillingWorkCardSection';
import PublicLayout from '@/Layouts/PublicLayout';

export default function ConstructionOrderWorkflowPP() {
    return (
        <PublicLayout className="bg-slate-950/45 px-4 py-5 sm:px-6 lg:px-8">
            <Head title="工事発注管理・請求システム 構想まとめ" />

            <div className="mx-auto flex min-h-screen min-w-0 w-full max-w-full flex-col gap-5 break-words pb-10 [overflow-wrap:anywhere] sm:max-w-7xl">
                {/*
                    アイデアボードは非エンジニア向けの構想説明ページです。
                    React のカードとステップUIに加えて、共通の Mermaid / ECharts
                    表示コンポーネントで「何を解決するのか」「責務をどう分けるのか」を説明します。
                */}
                <ConceptHero />
                <BasicConceptCards />

                {/*
                    ここから下は説明用の図解です。
                    固定データでCSV入口、System側処理、案件中心構造、作業カード、
                    請求条件、状態可視化、画面イメージを読むための静的な見せ方に限定します。
                */}
                <ConstructionBillingCsvEntrySection />
                <ConstructionBillingUploadFoundationSection />
                <ConstructionBillingCsvProcessingSection />
                <ConstructionBillingCaseStructureSection />
                <ConstructionBillingWorkCardSection />
                <ConstructionBillingSkipHoldSection />
                <ConstructionBillingBillingLifecycleSection />
                <ConstructionBillingBillingGateSection />
                <ConstructionBillingStatusChartSection />
                <ConstructionBillingScreenSection />
                <ConstructionBillingTechNotesSection />
            </div>
        </PublicLayout>
    );
}
