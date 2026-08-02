import { Head, Link } from '@inertiajs/react';

import BackgroundTraceEffect from '@/Components/Effects/BackgroundTraceEffect/BackgroundTraceEffect';
import PublicLayout from '@/Layouts/PublicLayout';
import AnalyzeField, {
    type DanceShortsAnalyzerAnalyzeFieldProps,
} from './Fields/AnalyzeField';

type DanceShortsAnalyzerAnalyzeProps = {
    analyzeField: DanceShortsAnalyzerAnalyzeFieldProps;
};

/**
 * DanceShortsAnalyzer分析結果画面の Page Component です。
 *
 * Responder が整えた analyzeField を表示Componentへ渡し、Page側では分析計算や
 * snapshot取得条件の再構築を行いません。
 */
export default function DanceShortsAnalyzerAnalyze({
    analyzeField,
}: DanceShortsAnalyzerAnalyzeProps) {
    return (
        <PublicLayout
            effectIntensity="subtle"
            className="overflow-x-hidden bg-slate-950 px-3 py-3 sm:px-5"
        >
            <Head title="DanceShortsAnalyzer Analyze" />

            <BackgroundTraceEffect />
            <div aria-hidden="true" className="fixed inset-0 z-[2] bg-slate-950/86" />

            <article className="relative z-10 mx-auto flex h-[calc(100dvh-1.5rem)] min-w-0 max-w-6xl flex-col gap-2 overflow-hidden">
                <header className="min-w-0 shrink-0 rounded-lg border border-white/14 bg-white/10 p-2 backdrop-blur-xl sm:p-3">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100/78">
                                PRODUCT
                            </p>
                            <h1 className="truncate text-lg font-black text-white sm:text-2xl">
                                DanceShortsAnalyzer
                            </h1>
                        </div>
                        <Link
                            href={analyzeField.search_url}
                            aria-label="Searchへ戻る"
                            title="Searchへ戻る"
                            className="inline-flex min-h-10 max-w-[42vw] shrink-0 items-center justify-center rounded-lg border border-blue-100/35 bg-white/10 px-3 text-center text-xs font-bold leading-4 text-blue-50 transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 sm:max-w-none sm:whitespace-nowrap sm:px-4 sm:text-sm"
                        >
                            戻る
                        </Link>
                    </div>
                </header>

                <AnalyzeField analyzeField={analyzeField} />
            </article>
        </PublicLayout>
    );
}
