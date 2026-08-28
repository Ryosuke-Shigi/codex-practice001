import RpgText from '@/Components/DesignPhilosophy/RpgText';
import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import { developmentStages } from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function DevelopmentStages({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <section
            id={section.key}
            aria-labelledby={`design-philosophy-${section.key}`}
            className="dp-section dp-section--stages"
            data-rpg-section
        >
            <div className="dp-shell">
                <SectionHeading section={section} />

                <ol className="dp-stage-grid">
                    {developmentStages.map((stage, index) => (
                        <li key={stage.key}>
                            <article className="dp-paper-card dp-stage-card">
                                <RpgText className="dp-card__index">
                                    {String(index + 1).padStart(2, '0')}
                                </RpgText>
                                <RpgText className="dp-technical">
                                    {stage.key}
                                </RpgText>
                                <RpgText as="h3">{stage.label}</RpgText>
                                <RpgText as="p">{stage.purpose}</RpgText>
                                <RpgText as="strong">
                                    {stage.optional ? '必要時に選択' : '基本工程'}
                                </RpgText>
                                <dl>
                                    <div>
                                        <RpgText as="dt">成果</RpgText>
                                        <RpgText as="dd">{stage.deliverable}</RpgText>
                                    </div>
                                    <div>
                                        <RpgText as="dt">完了条件</RpgText>
                                        <RpgText as="dd">{stage.completion}</RpgText>
                                    </div>
                                </dl>
                            </article>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
