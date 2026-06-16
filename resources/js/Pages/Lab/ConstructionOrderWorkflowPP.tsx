/**
 * 工事発注管理システムの IDEA BOARD Page Component です。
 *
 * 実DB、帳票生成、API通信には接続せず、説明用タブの組み立てだけを担当します。
 */
import { Head, Link } from '@inertiajs/react';

import ConstructionOrderIdeaBoardTabs from '@/Components/Lab/ConstructionOrderWorkflowPP/ConstructionOrderIdeaBoardTabs';
import PublicLayout from '@/Layouts/PublicLayout';

export default function ConstructionOrderWorkflowPP() {
    return (
        <PublicLayout className="bg-zinc-950/52 px-4 py-5 sm:px-6 lg:px-8">
            <Head title="工事発注管理システム IDEA BOARD" />

            <div className="mx-auto flex min-h-screen min-w-0 w-full max-w-full flex-col gap-5 break-words pb-10 [overflow-wrap:anywhere] sm:max-w-7xl">
                <nav aria-label="工事発注管理 Project Hub への戻り導線">
                    <Link
                        href="/projects/construction-order"
                        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/18 bg-white/10 px-4 text-sm font-semibold text-cyan-50 transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                    >
                        Project Hubへ戻る
                    </Link>
                </nav>

                <ConstructionOrderIdeaBoardTabs />
            </div>
        </PublicLayout>
    );
}
