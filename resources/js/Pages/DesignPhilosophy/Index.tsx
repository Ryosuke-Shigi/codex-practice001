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
                    content="責務を分け、設計の意図を残し、結果を確かめる。アーキテクチャ、変更への対応、理解再起動、開発と品質、AI駆動開発の考え方を紹介します。"
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
