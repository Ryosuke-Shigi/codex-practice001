import RpgText from '@/Components/DesignPhilosophy/RpgText';
import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import {
    aiDevelopmentSteps,
    taskDependencyNodes,
} from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function AiDevelopmentFlow({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <section
            id={section.key}
            aria-labelledby={`design-philosophy-${section.key}`}
            className="dp-section dp-section--flow"
            data-rpg-section
        >
            <div className="dp-shell">
                <SectionHeading section={section} />

                <figure
                    className="dp-flow-diagram"
                    data-diagram="evidence-flow"
                >
                <ol
                    className="dp-flow-list"
                    aria-label="現在の8段階フロー"
                    data-structure-motion="flow"
                >
                    {aiDevelopmentSteps.map((step) => (
                        <li
                            key={step.step}
                            data-diagram-node={step.title}
                            data-flow-step={String(step.step)}
                        >
                            <article className="dp-paper-card dp-flow-card">
                                <div className="dp-flow-card__meta">
                                    <RpgText>
                                        {String(step.step).padStart(2, '0')}
                                    </RpgText>
                                    <RpgText as="strong">{step.owner}</RpgText>
                                </div>
                                <RpgText as="h3">{step.title}</RpgText>
                                <RpgText as="p">{step.description}</RpgText>
                                <div className="dp-flow-card__handoff">
                                    <RpgText className="dp-technical">HANDOFF EVIDENCE</RpgText>
                                    <RpgText as="strong">{step.handoff}</RpgText>
                                </div>
                            </article>
                            {step.step < aiDevelopmentSteps.length && (
                                <span
                                    aria-hidden="true"
                                    className="dp-diagram-edge dp-diagram-edge--flow"
                                    data-diagram-edge
                                />
                            )}
                        </li>
                    ))}
                </ol>
                    <figcaption className="dp-diagram-caption">
                        <RpgText>
                            8工程を順に接続し、各工程のHandoff Evidenceを次の工程の入力にするフロー。
                        </RpgText>
                    </figcaption>
                </figure>

                <div className="dp-dag" data-structure-motion="dag">
                    <div className="dp-dag__heading">
                        <RpgText className="dp-technical">
                            TASK DEPENDENCY DAG
                        </RpgText>
                        <RpgText as="h3">依存を読める名前で示す</RpgText>
                        <RpgText as="p">
                            DAGはParallel Writer permissionではない
                        </RpgText>
                    </div>
                    <ol className="dp-dag__nodes">
                        {taskDependencyNodes.map((node) => (
                            <li key={node.title} data-dag-lane={node.lane}>
                                <RpgText as="strong">{node.title}</RpgText>
                                <RpgText as="small">{node.dependency}</RpgText>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
