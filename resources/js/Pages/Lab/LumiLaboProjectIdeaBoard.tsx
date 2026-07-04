import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import LumiLaboProjectIdeaBoardView from '@/Components/Lab/LumiLaboProjectIdeaBoard/LumiLaboProjectIdeaBoardView';
import PublicLayout from '@/Layouts/PublicLayout';

export default function LumiLaboProjectIdeaBoard() {
    return (
        <PublicLayout
            className="h-dvh overflow-hidden bg-yellow-50 px-3 py-3 text-black sm:px-4 lg:px-6"
            effectIntensity="subtle"
        >
            <Head title="LumiLabo 案件システム IDEA BOARD" />

            <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-3 overflow-hidden">
                <header className="flex flex-none items-center">
                    <Link
                        href="/projects/lumilabo"
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-yellow-300 bg-white px-4 text-base font-semibold text-black shadow-sm shadow-yellow-900/10 transition hover:bg-yellow-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 sm:w-fit"
                    >
                        <ArrowLeft className="h-5 w-5" aria-hidden />
                        LumiLabo ハブへ戻る
                    </Link>
                </header>

                <LumiLaboProjectIdeaBoardView />
            </div>
        </PublicLayout>
    );
}
