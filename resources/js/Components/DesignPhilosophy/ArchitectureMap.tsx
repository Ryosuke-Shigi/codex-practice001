import RpgText from '@/Components/DesignPhilosophy/RpgText';
import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import {
    architectureLayers,
    architectureResponsibilities,
    technologyComposition,
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

                <RpgText
                    as="p"
                    className="dp-layer-flow"
                    data-structure-motion="adr-flow"
                >
                    Request → Controller → Action → Service / Repository → DTO → Responder → React
                </RpgText>

                <div className="dp-responsibility-grid">
                    {architectureResponsibilities.map((responsibility, index) => (
                        <article
                            key={responsibility.value}
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
                            <RpgText as="p">{responsibility.description}</RpgText>
                        </article>
                    ))}
                </div>

                <div className="dp-composition">
                    <div className="dp-composition__heading">
                        <RpgText className="dp-technical">
                            TECHNOLOGY COMPOSITION
                        </RpgText>
                        <RpgText as="h3">Taskごとに必要な範囲だけ組む</RpgText>
                    </div>
                    <ol>
                        {technologyComposition.map((item) => (
                            <li key={item.title}>
                                <RpgText as="strong">{item.title}</RpgText>
                                <RpgText as="small">{item.description}</RpgText>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
