import { useRef } from 'react';

import DesignPhilosophySection from '@/Components/DesignPhilosophy/DesignPhilosophySection';
import type { DesignPhilosophySection as DesignPhilosophySectionData } from '@/Components/DesignPhilosophy/designPhilosophyTypes';
import useDesignPhilosophyMotion from '@/Components/DesignPhilosophy/useDesignPhilosophyMotion';

import './designPhilosophy.css';

export default function DesignPhilosophyView({
    sections,
}: {
    sections: DesignPhilosophySectionData[];
}) {
    const rootRef = useRef<HTMLElement>(null);
    const visibleSectionKeys = new Set(sections.map(({ key }) => key));

    useDesignPhilosophyMotion(rootRef);

    return (
        <article ref={rootRef} className="dp-page">
            {sections.map((section) => (
                <DesignPhilosophySection
                    key={section.key}
                    section={section}
                    visibleSectionKeys={visibleSectionKeys}
                />
            ))}
        </article>
    );
}
