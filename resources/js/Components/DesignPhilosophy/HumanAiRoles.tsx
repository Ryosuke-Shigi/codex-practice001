import RpgText from '@/Components/DesignPhilosophy/RpgText';
import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import {
    authorityBoundaries,
    publicRoles,
    singleWriterRules,
    writerBoundaries,
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

                <ol className="dp-role-grid" data-structure-motion="role-rail">
                    {publicRoles.map((role, index) => (
                        <li key={role.title}>
                            <article className="dp-paper-card dp-role-card">
                                <RpgText className="dp-card__index">
                                    {String(index + 1).padStart(2, '0')}
                                </RpgText>
                                <RpgText className="dp-technical">
                                    {role.label}
                                </RpgText>
                                <RpgText as="h3">{role.title}</RpgText>
                                <RpgText as="p">{role.description}</RpgText>
                                <RpgText as="strong">
                                    {role.responsibility}
                                </RpgText>
                            </article>
                        </li>
                    ))}
                </ol>

                <div className="dp-writer-layout">
                    <article
                        className="dp-blueprint-panel dp-writer-lease"
                        data-structure-motion="writer-lease"
                    >
                        <RpgText className="dp-technical">WRITER LEASE</RpgText>
                        <RpgText as="h3">repository-wide Single Writer</RpgText>
                        <RuleList items={singleWriterRules} />
                    </article>
                    <article className="dp-blueprint-panel dp-writer-boundary">
                        <RpgText className="dp-technical">WRITER IS NOT THE JUDGE</RpgText>
                        <RpgText as="h3">Writerが越えない4つの境界</RpgText>
                        <RuleList items={writerBoundaries} />
                    </article>
                </div>

                <div className="dp-authority-split">
                    <div className="dp-authority-split__heading">
                        <RpgText className="dp-technical">
                            CAPABILITY ≠ AUTHORITY
                        </RpgText>
                        <RpgText as="h3">できることと、してよいことを分ける</RpgText>
                    </div>
                    <ol>
                        {authorityBoundaries.map((boundary) => (
                            <li key={boundary.label}>
                                <RpgText as="strong">{boundary.label}</RpgText>
                                <RpgText as="p">{boundary.description}</RpgText>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
