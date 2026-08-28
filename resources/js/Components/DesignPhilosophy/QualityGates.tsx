import RpgText from '@/Components/DesignPhilosophy/RpgText';
import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import { evidenceTypes } from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function QualityGates({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <section
            id={section.key}
            aria-labelledby={`design-philosophy-${section.key}`}
            className="dp-section dp-section--evidence"
            data-rpg-section
        >
            <div className="dp-shell">
                <SectionHeading section={section} />

                <RpgText as="p" className="dp-evidence-rule">
                    Static、Installed、Runtime、Browser、独立確認、Human Reviewは相互代替しない
                </RpgText>

                <div
                    className="dp-evidence-grid"
                    data-structure-motion="evidence"
                >
                    {evidenceTypes.map((evidence, index) => (
                        <article key={evidence.title} className="dp-paper-card">
                            <RpgText className="dp-card__index">
                                {`E${String(index + 1).padStart(2, '0')}`}
                            </RpgText>
                            <RpgText as="h3">{evidence.title}</RpgText>
                            <RpgText as="p">{evidence.description}</RpgText>
                            <RpgText as="strong">{evidence.boundary}</RpgText>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
