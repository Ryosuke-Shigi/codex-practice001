import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import LumiLaboProjectIdeaBoardView from '@/Components/Lab/LumiLaboProjectIdeaBoard/LumiLaboProjectIdeaBoardView';
import { getStageProjectReturnLink } from '@/Components/ProjectHub/projectNavigation';
import PublicLayout from '@/Layouts/PublicLayout';

const lumiLaboReturn = getStageProjectReturnLink('lumilabo');

export default function LumiLaboProjectIdeaBoard() {
    return (
        <PublicLayout
            className="h-dvh overflow-hidden bg-white px-3 py-2 text-black [@media(max-height:480px)]:py-1 sm:px-4 sm:py-3 lg:px-6"
            effectIntensity="subtle"
        >
            <Head title="LumiLabo 案件システム IDEA BOARD" />

            <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-2 overflow-hidden [@media(max-height:480px)]:gap-1 sm:gap-3">
                <header className="flex flex-none items-center">
                    <Link
                        href={lumiLaboReturn.href}
                        aria-label={lumiLaboReturn.ariaLabel}
                        title={lumiLaboReturn.title}
                        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 text-base font-semibold text-black shadow-sm shadow-neutral-900/10 transition hover:border-yellow-500 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 [@media(max-height:480px)]:min-h-9 [@media(max-height:480px)]:text-sm sm:min-h-11 sm:w-fit"
                    >
                        <ArrowLeft className="h-5 w-5" aria-hidden />
                        {lumiLaboReturn.label}
                    </Link>
                </header>

                <LumiLaboProjectIdeaBoardView />
            </div>
        </PublicLayout>
    );
}
