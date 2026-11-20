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
            <Head title="設計思想">
                <meta
                    head-key="description"
                    name="description"
                    content="AIとつくる。品質は、仕組みで確かめる。ハーネスの構造、コーディング思想、大切にする原則、開発段階を図で紹介します。"
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
