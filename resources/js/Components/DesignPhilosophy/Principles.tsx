import RpgText from '@/Components/DesignPhilosophy/RpgText';
import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import { taskContractItems } from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function Principles({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <section
            id={section.key}
            aria-labelledby={`design-philosophy-${section.key}`}
            className="dp-section dp-section--contract"
            data-rpg-section
        >
            <div className="dp-shell">
                <SectionHeading section={section} />

                <div className="dp-contract-grid">
                    {taskContractItems.map((item, index) => (
                        <article key={item.title} className="dp-paper-card">
                            <RpgText className="dp-card__index">
                                {String(index + 1).padStart(2, '0')}
                            </RpgText>
                            <RpgText as="h3">{item.title}</RpgText>
                            <RpgText as="p">{item.description}</RpgText>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
