import { Head } from '@inertiajs/react';

import LumiLaboProjectMockView from '@/Components/Lab/LumiLaboProjectMock/LumiLaboProjectMockView';
import type { LumiLaboMockProjectList } from '@/Components/Lab/LumiLaboProjectMock/types';
import PublicLayout from '@/Layouts/PublicLayout';

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
            <LumiLaboProjectMockView projectList={projectList} />
        </PublicLayout>
    );
}
