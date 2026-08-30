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
            <Head title="CODEXゼロトラスト設計">
                <meta
                    head-key="description"
                    name="description"
                    content="人間が判断し、AIはTask Contract、Single Writer、Evidence、Verificationの検証可能な境界で実行するCODEXゼロトラスト設計。"
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
