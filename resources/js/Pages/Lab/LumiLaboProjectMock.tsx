import { Head } from '@inertiajs/react';

import LumiLaboProjectMockView from '@/Components/Lab/LumiLaboProjectMock/LumiLaboProjectMockView';
import PublicLayout from '@/Layouts/PublicLayout';

export default function LumiLaboProjectMock() {
    return (
        <PublicLayout
            className="h-dvh overflow-hidden bg-white text-black"
            effectIntensity="subtle"
        >
            <Head title="LumiLabo MOCK" />
            <LumiLaboProjectMockView />
        </PublicLayout>
    );
}
