/** Design Philosophy の Inertia Page Component です。 */
import { Head } from '@inertiajs/react';

import DesignPhilosophyView from '@/Components/DesignPhilosophy/DesignPhilosophyView';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';
import PublicLayout from '@/Layouts/PublicLayout';

type DesignPhilosophyIndexProps = {
    sections: DesignPhilosophySection[];
};

export default function DesignPhilosophyIndex({
    sections,
}: DesignPhilosophyIndexProps) {
    return (
        <PublicLayout
            className="design-philosophy-theme bg-[#eee3cb] text-[#2e2923]"
            withEffect={false}
        >
            <Head title="人間が判断するAI開発の設計思想">
                <meta
                    head-key="description"
                    name="description"
                    content="人間主導でTask Contract、Single Writer、ADR Pattern、Evidence、改善ループを分離する設計思想。"
                />
                <meta
                    head-key="theme-color"
                    name="theme-color"
                    content="#eee3cb"
                />
            </Head>

            <DesignPhilosophyView sections={sections} />
        </PublicLayout>
    );
}
