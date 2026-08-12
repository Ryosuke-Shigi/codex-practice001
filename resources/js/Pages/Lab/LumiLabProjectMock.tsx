import { Head, Link } from '@inertiajs/react';

import LumiLabProjectMockView from '@/Components/Lab/LumiLabProjectMock/LumiLabProjectMockView';
import type { LumiLabMockProjectList } from '@/Components/Lab/LumiLabProjectMock/types';
import { getStageProjectReturnLink } from '@/Components/ProjectHub/projectNavigation';
import PublicLayout from '@/Layouts/PublicLayout';

const lumiLabReturn = getStageProjectReturnLink('lumilab');

type LumiLabProjectMockProps = {
    projectList: LumiLabMockProjectList;
};

export default function LumiLabProjectMock({
    projectList,
}: LumiLabProjectMockProps) {
    return (
        <PublicLayout
            className="h-dvh overflow-hidden bg-white text-black"
            effectIntensity="subtle"
        >
            <Head title="LumiLab MOCK" />
            <Link
                href={lumiLabReturn.href}
                className="fixed right-2 top-2 z-50 inline-flex min-h-9 items-center justify-center rounded-lg border border-neutral-300 bg-white/95 px-3 text-xs font-semibold text-black shadow-sm transition hover:border-yellow-500 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                aria-label={lumiLabReturn.ariaLabel}
                title={lumiLabReturn.title}
            >
                {lumiLabReturn.label}
            </Link>
            <LumiLabProjectMockView projectList={projectList} />
        </PublicLayout>
    );
}
