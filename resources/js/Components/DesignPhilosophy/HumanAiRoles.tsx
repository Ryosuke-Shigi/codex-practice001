import {
    BadgeCheck,
    Bot,
    Eye,
    MessageSquareText,
    PenLine,
    ScanSearch,
    UserRound,
    type LucideIcon,
} from 'lucide-react';

import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import { publicRoles } from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

const roleIcons: LucideIcon[] = [
    UserRound,
    MessageSquareText,
    Bot,
    ScanSearch,
    PenLine,
    BadgeCheck,
    Eye,
];

export default function HumanAiRoles({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <section
            id={section.key}
            aria-labelledby={`design-philosophy-${section.key}`}
            className="dp-section dp-section--roles"
        >
            <div className="dp-shell">
                <SectionHeading section={section} />

                <div className="dp-role-grid">
                    {publicRoles.map((role, index) => {
                        const Icon = roleIcons[index];

                        return (
                            <article
                                key={role.title}
                                className="dp-card dp-role-card dp-reveal"
                                data-tilt
                            >
                                <div className="dp-role-card__top">
                                    <span>{role.label}</span>
                                    <Icon aria-hidden="true" />
                                </div>
                                <h3>{role.title}</h3>
                                <p>{role.description}</p>
                                <strong>{role.responsibility}</strong>
                            </article>
                        );
                    })}
                </div>

                <aside className="dp-role-rail dp-reveal">
                    <span>DECISION</span>
                    <i aria-hidden="true" />
                    <span>IMPLEMENTATION</span>
                    <i aria-hidden="true" />
                    <span>VERIFICATION</span>
                </aside>
            </div>
        </section>
    );
}
