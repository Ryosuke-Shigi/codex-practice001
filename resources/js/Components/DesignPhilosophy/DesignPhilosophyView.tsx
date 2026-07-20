import DesignPhilosophySection from '@/Components/DesignPhilosophy/DesignPhilosophySection';
import type { DesignPhilosophySection as DesignPhilosophySectionData } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function DesignPhilosophyView({
    sections,
}: {
    sections: DesignPhilosophySectionData[];
}) {
    return (
        <article className="min-w-0 overflow-x-hidden bg-[radial-gradient(circle_at_10%_4%,rgba(242,223,58,0.18),transparent_28rem),radial-gradient(circle_at_92%_28%,rgba(218,224,202,0.38),transparent_30rem),#f6f4ed] text-[#11120f]">
            {sections.map((section) => (
                <DesignPhilosophySection
                    key={section.key}
                    section={section}
                />
            ))}
        </article>
    );
}
