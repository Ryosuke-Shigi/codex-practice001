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
            className="bg-[#f6f4ed] text-[#11120f]"
            withEffect={false}
        >
            <Head title="設計思想｜責務でつなぐAI駆動開発">
                <meta
                    head-key="description"
                    name="description"
                    content="責務分離・段階的開発・AI協働を一つの原則で設計する、ポートフォリオの設計思想。"
                />
            </Head>

            <DesignPhilosophyView sections={sections} />
        </PublicLayout>
    );
}
