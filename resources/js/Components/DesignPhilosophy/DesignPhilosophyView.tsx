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

    useDesignPhilosophyMotion(rootRef);

    return (
        <article ref={rootRef} className="dp-page">
            <div aria-hidden="true" className="dp-page__ambient">
                <span className="dp-page__glow dp-page__glow--cyan" />
                <span className="dp-page__glow dp-page__glow--emerald" />
                <span className="dp-page__glow dp-page__glow--violet" />
                <span className="dp-page__noise" />
            </div>

            {sections.map((section) => (
                <DesignPhilosophySection
                    key={section.key}
                    section={section}
                />
            ))}
        </article>
    );
}
