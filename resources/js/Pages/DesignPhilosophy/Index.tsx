/**
 * Design Philosophy の Inertia Page Component です。
 *
 * Laravel Responder から受け取った sections を並べるだけにし、enabled 判定や並び替えは backend 側へ委譲します。
 */
import { Head } from '@inertiajs/react';

import DesignPhilosophySectionTemplate, {
    type DesignPhilosophySection,
} from '@/Components/DesignPhilosophy/DesignPhilosophySectionTemplate';
import PublicLayout from '@/Layouts/PublicLayout';

type DesignPhilosophyIndexProps = {
    sections: DesignPhilosophySection[];
};

export default function DesignPhilosophyIndex({
    sections,
}: DesignPhilosophyIndexProps) {
    return (
        <PublicLayout className="bg-zinc-950 text-white">
            <Head title="Design Philosophy" />

            {/*
                sections は Laravel config から Action / DTO / Responder を通って渡されます。
                このページでは取得や並び替えを行わず、受け取った順番のまま縦スクロールLPとして表示します。
            */}
            <article className="min-w-0 overflow-x-hidden bg-zinc-950">
                {sections.map((section, index) => (
                    <DesignPhilosophySectionTemplate
                        key={section.key}
                        section={section}
                        index={index}
                    />
                ))}
            </article>
        </PublicLayout>
    );
}
