import { ArrowDown, Box, Cable, Workflow } from 'lucide-react';

import ArchitectureStackVisual from '@/Components/DesignPhilosophy/ArchitectureStackVisual';
import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import {
    architectureLayers,
    architectureResponsibilities,
} from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

const layerIcons = {
    Action: Workflow,
    Domain: Box,
    Responder: Cable,
};

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
        >
            <div className="dp-shell">
                <SectionHeading section={section} />

                <div className="dp-architecture-intro">
                    <div className="dp-architecture-statement dp-reveal">
                        <span>CANONICAL PATTERN</span>
                        <p>Action - Domain - Responder</p>
                        <strong>
                            入力から出力までを、変更理由で分ける。
                        </strong>
                    </div>
                    <ArchitectureStackVisual />
                </div>

                <div className="dp-architecture-layers">
                    {architectureLayers.map((layer, index) => {
                        const Icon = layerIcons[layer.key];

                        return (
                            <div key={layer.key} className="contents">
                                <article
                                    className="dp-card dp-architecture-layer dp-reveal"
                                    data-architecture-layer={layer.key}
                                    data-tilt
                                >
                                    <div className="dp-architecture-layer__top">
                                        <span>
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <Icon aria-hidden="true" />
                                    </div>
                                    <p>{layer.key}</p>
                                    <h3>{layer.title}</h3>
                                    <small>{layer.description}</small>
                                </article>
                                {index < architectureLayers.length - 1 && (
                                    <ArrowDown
                                        aria-hidden="true"
                                        className="dp-architecture-layer__arrow"
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="dp-responsibility-grid">
                    {architectureResponsibilities.map(
                        (responsibility, index) => (
                            <article
                                key={responsibility.value}
                                className="dp-responsibility-card dp-reveal"
                                data-responsibility-category={
                                    responsibility.category
                                }
                            >
                                <span>
                                    R{String(index + 1).padStart(2, '0')}
                                </span>
                                <h3>{responsibility.value}</h3>
                                <strong>
                                    {responsibility.technicalLabel}
                                </strong>
                                <p>{responsibility.description}</p>
                            </article>
                        ),
                    )}
                </div>
            </div>
        </section>
    );
}
