import { Head } from '@inertiajs/react';

import BasicConceptCards from '@/Components/Lab/ConstructionOrderWorkflowPP/BasicConceptCards';
import ConceptHero from '@/Components/Lab/ConstructionOrderWorkflowPP/ConceptHero';
import ConstructionBillingArchitectureSection from '@/Components/Lab/ConstructionOrderWorkflowPP/ConstructionBillingArchitectureSection';
import ConstructionBillingFlowSection from '@/Components/Lab/ConstructionOrderWorkflowPP/ConstructionBillingFlowSection';
import ConstructionBillingFormExcelSystemSection from '@/Components/Lab/ConstructionOrderWorkflowPP/ConstructionBillingFormExcelSystemSection';
import ConstructionBillingProblemSection from '@/Components/Lab/ConstructionOrderWorkflowPP/ConstructionBillingProblemSection';
import ConstructionBillingScreenSection from '@/Components/Lab/ConstructionOrderWorkflowPP/ConstructionBillingScreenSection';
import ConstructionBillingStatusChartSection from '@/Components/Lab/ConstructionOrderWorkflowPP/ConstructionBillingStatusChartSection';
import PublicLayout from '@/Layouts/PublicLayout';

export default function ConstructionOrderWorkflowPP() {
    return (
        <PublicLayout className="bg-slate-950/45 px-4 py-5 sm:px-6 lg:px-8">
            <Head title="工事発注管理・請求システム 構想まとめ" />

            <div className="mx-auto flex min-h-screen min-w-0 w-full max-w-full flex-col gap-5 break-words pb-10 [overflow-wrap:anywhere] sm:max-w-7xl">
                {/*
                    PP は非エンジニア向けの構想説明ページです。
                    React のカードとステップUIに加えて、共通の Mermaid / ECharts
                    表示コンポーネントで「何を解決するのか」「責務をどう分けるのか」を説明します。
                */}
                <ConceptHero />
                <BasicConceptCards />

                {/*
                    ここから下は説明用の図解です。
                    DB保存、CRUD、CSV取込本実装は追加せず、固定データで
                    業務課題、役割分離、状態可視化、責務分離を読むための静的な見せ方に限定します。
                */}
                <ConstructionBillingProblemSection />
                <ConstructionBillingFormExcelSystemSection />
                <ConstructionBillingFlowSection />
                <ConstructionBillingScreenSection />
                <ConstructionBillingStatusChartSection />
                <ConstructionBillingArchitectureSection />
            </div>
        </PublicLayout>
    );
}
