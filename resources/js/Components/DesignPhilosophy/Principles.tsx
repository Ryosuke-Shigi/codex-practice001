import {
    BadgeCheck,
    FileCheck2,
    GitPullRequestArrow,
    Layers3,
    OctagonPause,
    RefreshCw,
    Route,
    UserRound,
    type LucideIcon,
} from 'lucide-react';

import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import { principles } from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

const principleIcons: LucideIcon[] = [
    UserRound,
    FileCheck2,
    Layers3,
    GitPullRequestArrow,
    BadgeCheck,
    OctagonPause,
    Route,
    RefreshCw,
];

export default function Principles({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <section
            id={section.key}
            aria-labelledby={`design-philosophy-${section.key}`}
            className="dp-section dp-section--principles"
        >
            <div className="dp-shell">
                <SectionHeading section={section} />

                <div className="dp-principle-grid">
                    {principles.map((principle, index) => {
                        const Icon = principleIcons[index];

                        return (
                            <article
                                key={principle.title}
                                className="dp-card dp-principle-card dp-reveal"
                                data-tilt
                            >
                                <div className="dp-card__index">
                                    {String(index + 1).padStart(2, '0')}
                                </div>
                                <Icon aria-hidden="true" />
                                <h3>{principle.title}</h3>
                                <p>{principle.description}</p>
                                <span>{principle.signal}</span>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
