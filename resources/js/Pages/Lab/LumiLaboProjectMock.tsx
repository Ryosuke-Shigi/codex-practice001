import { Head } from '@inertiajs/react';

import LumiLaboProjectMockView from '@/Components/Lab/LumiLaboProjectMock/LumiLaboProjectMockView';
import type {
    LumiLaboMockProjectList,
    LumiLaboMockProjectOverride,
} from '@/Components/Lab/LumiLaboProjectMock/types';
import PublicLayout from '@/Layouts/PublicLayout';

type LumiLaboProjectMockProps = {
    projectList: LumiLaboMockProjectList;
    initialDeletedProjectIds: readonly string[];
    initialProjectOverrides: readonly LumiLaboMockProjectOverride[];
};

export default function LumiLaboProjectMock({
    projectList,
    initialDeletedProjectIds,
    initialProjectOverrides,
}: LumiLaboProjectMockProps) {
    return (
        <PublicLayout
            className="h-dvh overflow-hidden bg-white text-black"
            effectIntensity="subtle"
        >
            <Head title="LumiLabo MOCK" />
            <LumiLaboProjectMockView
                projectList={projectList}
                initialDeletedProjectIds={initialDeletedProjectIds}
                initialProjectOverrides={initialProjectOverrides}
            />
        </PublicLayout>
    );
}
