import {
    Accessibility,
    BadgeCheck,
    CloudCog,
    Database,
    FileKey2,
    Network,
    ShieldCheck,
    TestTube2,
    Workflow,
    type LucideIcon,
} from 'lucide-react';

import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import { qualityGates } from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

const gateIcons: LucideIcon[] = [
    BadgeCheck,
    ShieldCheck,
    TestTube2,
    Accessibility,
    Database,
    FileKey2,
    Network,
    Workflow,
    CloudCog,
];

export default function QualityGates({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <section
            id={section.key}
            aria-labelledby={`design-philosophy-${section.key}`}
            className="dp-section dp-section--quality"
        >
            <div className="dp-shell">
                <SectionHeading section={section} />

                <div className="dp-quality-grid">
                    {qualityGates.map((gate, index) => {
                        const Icon = gateIcons[index];

                        return (
                            <article
                                key={gate.title}
                                className="dp-card dp-quality-card dp-reveal"
                                data-tilt
                            >
                                <div className="dp-quality-card__top">
                                    <span>
                                        G{String(index + 1).padStart(2, '0')}
                                    </span>
                                    <Icon aria-hidden="true" />
                                </div>
                                <h3>{gate.title}</h3>
                                <p>{gate.description}</p>
                                <strong>{gate.check}</strong>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
