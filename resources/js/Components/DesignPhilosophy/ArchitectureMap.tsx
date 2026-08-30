import RpgText from '@/Components/DesignPhilosophy/RpgText';
import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import {
    architectureGuardrails,
    architectureLayers,
    architectureResponsibilities,
} from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

const dependencyEdges = [
    { from: '入口', to: 'use case', kind: 'main' },
    { from: 'use case', to: 'domain / rule', kind: 'main' },
    { from: 'domain / rule', to: 'presentation', kind: 'main' },
    { from: 'domain / rule', to: 'I/O', kind: 'branch' },
    { from: 'domain / rule', to: 'data contract', kind: 'branch' },
    { from: 'domain / rule', to: 'side effect', kind: 'branch' },
    { from: 'use case', to: 'read side', kind: 'query' },
    { from: 'read side', to: 'presentation', kind: 'query' },
] as const;

function DependencyEdges({ compact = false }: { compact?: boolean }) {
    const paths = compact
        ? [
              'M50 85V100',
              'M50 185V200',
              'M100 250H103V750H100',
              'M50 285V300',
              'M0 250H-3V450H0',
              'M100 250H104V550H100',
              'M0 150H-4V650H0',
              'M50 685V700',
          ]
        : [
              'M90 50H105',
              'M190 50H205',
              'M295 50H305',
              'M250 85V110',
              'M210 50H200V250H210',
              'M295 50H305V150H310',
              'M150 85V110',
              'M195 150V200H403V50H400',
          ];

    return (
        <svg
            aria-hidden="true"
            className={`dp-dependency-edges dp-dependency-edges--${compact ? 'compact' : 'wide'}`}
            preserveAspectRatio="none"
            viewBox={compact ? '0 0 100 800' : '0 0 400 300'}
        >
            <defs>
                <marker
                    id={`dp-dependency-arrow-${compact ? 'compact' : 'wide'}`}
                    markerHeight="6"
                    markerWidth="6"
                    orient="auto"
                    refX="5"
                    refY="3"
                    viewBox="0 0 6 6"
                >
                    <path d="M0 0L6 3L0 6Z" />
                </marker>
            </defs>
            {dependencyEdges.map((edge, index) => (
                <path
                    aria-hidden="true"
                    key={`${edge.from}-${edge.to}`}
                    d={paths[index]}
                    data-diagram-edge
                    data-edge-id={`architecture-edge-${index + 1}`}
                    data-edge-from={edge.from}
                    data-edge-kind={edge.kind}
                    data-edge-to={edge.to}
                    markerEnd={`url(#dp-dependency-arrow-${compact ? 'compact' : 'wide'})`}
                />
            ))}
        </svg>
    );
}

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

                <figure
                    className="dp-architecture-diagram"
                    data-diagram="adr-dependency"
                >
                    <div className="dp-responsibility-map">
                        <ol
                            aria-label="ADR Patternの責務マップ"
                            className="dp-responsibility-grid"
                            data-structure-motion="adr-flow"
                        >
                            {architectureResponsibilities.map((responsibility, index) => (
                                <li
                                    key={responsibility.value}
                                    data-dependency-kind={
                                        responsibility.category === 'side-effect' ||
                                        responsibility.category === 'read-side'
                                            ? 'branch'
                                            : 'main'
                                    }
                                    data-diagram-node={responsibility.value}
                                    data-responsibility-index={`responsibility-${index + 1}`}
                                >
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
                        <DependencyEdges />
                        <DependencyEdges compact />
                    </div>
                    <figcaption className="dp-diagram-caption">
                        <RpgText>
                            HTTP入口からAction、Domain、Responder、React / Inertiaへ進む主経路と、side effectとread sideの分岐を分けた依存図。
                        </RpgText>
                    </figcaption>
                </figure>

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
