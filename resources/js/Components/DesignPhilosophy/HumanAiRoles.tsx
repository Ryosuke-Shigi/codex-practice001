import RpgText from '@/Components/DesignPhilosophy/RpgText';
import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import {
    isolatedWorktreeRules,
    publicRoles,
    singleWriterRules,
} from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

function RuleList({ items }: { items: readonly string[] }) {
    return (
        <ul>
            {items.map((item) => (
                <li key={item}>
                    <RpgText>{item}</RpgText>
                </li>
            ))}
        </ul>
    );
}

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
            data-rpg-section
        >
            <div className="dp-shell">
                <SectionHeading section={section} />

                <div className="dp-role-grid">
                    {publicRoles.map((role) => (
                        <article key={role.title} className="dp-paper-card dp-role-card">
                            <RpgText className="dp-technical">{role.label}</RpgText>
                            <RpgText as="h3">{role.title}</RpgText>
                            <RpgText as="p">{role.description}</RpgText>
                            <RpgText as="strong">{role.responsibility}</RpgText>
                        </article>
                    ))}
                </div>

                <div className="dp-writer-layout">
                    <article
                        className="dp-blueprint-panel dp-writer-lease"
                        data-structure-motion="writer-lease"
                    >
                        <RpgText className="dp-technical">WRITER LEASE</RpgText>
                        <RpgText as="h3">repository-wide Single Writer</RpgText>
                        <RuleList items={singleWriterRules} />
                    </article>
                    <article className="dp-blueprint-panel">
                        <RpgText className="dp-technical">WORKTREE / PHASE 1</RpgText>
                        <RpgText as="h3">Isolated Worktree Phase 1</RpgText>
                        <RuleList items={isolatedWorktreeRules} />
                    </article>
                </div>
            </div>
        </section>
    );
}
