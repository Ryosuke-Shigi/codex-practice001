import RpgText from '@/Components/DesignPhilosophy/RpgText';
import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import {
    architectureGuardrails,
    architectureLayers,
    architectureResponsibilities,
} from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function ArchitectureMap({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <section
            id={section.key}
            aria-labelledby={`design-philosophy-${section.key}`}
            className="dp-section dp-section--architecture"
            data-rpg-section
        >
            <div className="dp-shell">
                <SectionHeading section={section} />

                <div className="dp-architecture-statement">
                    <RpgText className="dp-technical">CANONICAL PATTERN</RpgText>
                    <RpgText as="p">Action - Domain - Responder</RpgText>
                    <RpgText as="strong">
                        Architecture Decision Recordの意味では使わない
                    </RpgText>
                </div>

                <div className="dp-architecture-layers">
                    {architectureLayers.map((layer, index) => (
                        <article
                            key={layer.key}
                            className="dp-paper-card dp-architecture-layer"
                            data-architecture-layer={layer.key}
                        >
                            <RpgText className="dp-card__index">
                                {String(index + 1).padStart(2, '0')}
                            </RpgText>
                            <RpgText className="dp-technical">{layer.key}</RpgText>
                            <RpgText as="h3">{layer.title}</RpgText>
                            <RpgText as="p">{layer.description}</RpgText>
                        </article>
                    ))}
                </div>

                <ol
                    aria-label="ADR Patternの責務マップ"
                    className="dp-responsibility-grid"
                    data-structure-motion="adr-flow"
                >
                    {architectureResponsibilities.map((responsibility, index) => (
                        <li key={responsibility.value}>
                            <article
                                className="dp-blueprint-panel"
                                data-responsibility-category={responsibility.category}
                            >
                                <RpgText className="dp-card__index">
                                    {`R${String(index + 1).padStart(2, '0')}`}
                                </RpgText>
                                <RpgText as="h3">{responsibility.value}</RpgText>
                                <RpgText as="strong">
                                    {responsibility.technicalLabel}
                                </RpgText>
                                <RpgText as="p">
                                    {responsibility.description}
                                </RpgText>
                            </article>
                        </li>
                    ))}
                </ol>

                <div className="dp-architecture-guardrails">
                    <div>
                        <RpgText className="dp-technical">
                            DEPENDENCY GUARDRAILS
                        </RpgText>
                        <RpgText as="h3">責務を、便利な層へ押し込まない</RpgText>
                    </div>
                    <ul>
                        {architectureGuardrails.map((guardrail) => (
                            <li key={guardrail}>
                                <RpgText>{guardrail}</RpgText>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
