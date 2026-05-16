import { Head } from '@inertiajs/react';

import BasicConceptCards from '@/Components/Lab/ConstructionOrderWorkflowPP/BasicConceptCards';
import BusinessFlowDiagram from '@/Components/Lab/ConstructionOrderWorkflowPP/BusinessFlowDiagram';
import ConceptHero from '@/Components/Lab/ConstructionOrderWorkflowPP/ConceptHero';
import DataFlowDiagram from '@/Components/Lab/ConstructionOrderWorkflowPP/DataFlowDiagram';
import ScreenFlowDiagram from '@/Components/Lab/ConstructionOrderWorkflowPP/ScreenFlowDiagram';
import PublicLayout from '@/Layouts/PublicLayout';

export default function ConstructionOrderWorkflowPP() {
    return (
        <PublicLayout className="bg-slate-950/45 px-4 py-5 sm:px-6 lg:px-8">
            <Head title="工事発注管理・請求システム 構想まとめ" />

            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 pb-10">
                {/*
                    PP は非エンジニア向けの構想説明ページです。
                    Mermaid や技術構成図ではなく、React のカードとステップUIだけで
                    「何を作るのか」「情報がどう流れるのか」を説明します。
                */}
                <ConceptHero />
                <BasicConceptCards />

                {/*
                    ここから下は説明用の図解です。
                    保存処理やファイル取込はまだ実装せず、業務フロー、画面遷移、
                    情報のつながりを読むための静的な見せ方に限定します。
                */}
                <BusinessFlowDiagram />
                <ScreenFlowDiagram />
                <DataFlowDiagram />
            </div>
        </PublicLayout>
    );
}
