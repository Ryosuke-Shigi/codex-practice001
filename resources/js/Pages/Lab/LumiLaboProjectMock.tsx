import { Head, Link } from '@inertiajs/react';

import LumiLaboProjectMockView from '@/Components/Lab/LumiLaboProjectMock/LumiLaboProjectMockView';
import type { LumiLaboMockProjectList } from '@/Components/Lab/LumiLaboProjectMock/types';
import { getStageProjectReturnLink } from '@/Components/ProjectHub/projectNavigation';
import PublicLayout from '@/Layouts/PublicLayout';

const lumiLaboReturn = getStageProjectReturnLink('lumilabo');

type LumiLaboProjectMockProps = {
    projectList: LumiLaboMockProjectList;
};

export default function LumiLaboProjectMock({
    projectList,
}: LumiLaboProjectMockProps) {
    return (
        <PublicLayout
            className="h-dvh overflow-hidden bg-white text-black"
            effectIntensity="subtle"
        >
            <Head title="LumiLabo MOCK" />
            <Link
                href={lumiLaboReturn.href}
                className="fixed right-2 top-2 z-50 inline-flex min-h-9 items-center justify-center rounded-lg border border-neutral-300 bg-white/95 px-3 text-xs font-semibold text-black shadow-sm transition hover:border-yellow-500 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                aria-label={lumiLaboReturn.ariaLabel}
                title={lumiLaboReturn.title}
            >
                {lumiLaboReturn.label}
            </Link>
            <LumiLaboProjectMockView projectList={projectList} />
        </PublicLayout>
    );
}
