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
            className="design-philosophy-theme bg-[#050814] text-[#eef8ff]"
            withEffect={false}
        >
            <Head title="人間主導のAI開発設計思想">
                <meta
                    head-key="description"
                    name="description"
                    content="人間主導でAI開発の契約、責務、品質ゲート、改善ループを設計するポートフォリオの設計思想。"
                />
                <meta
                    head-key="theme-color"
                    name="theme-color"
                    content="#050814"
                />
            </Head>

            <DesignPhilosophyView sections={sections} />
        </PublicLayout>
    );
}
