import RpgText from '@/Components/DesignPhilosophy/RpgText';
import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import {
    feedbackDestinations,
    improvementSteps,
} from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function ImprovementLoop({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <section
            id={section.key}
            aria-labelledby={`design-philosophy-${section.key}`}
            className="dp-section dp-section--improvement"
            data-rpg-section
        >
            <div className="dp-shell">
                <SectionHeading section={section} />

                <figure
                    className="dp-improvement-map"
                    data-diagram="feedback-loop"
                >
                    <div className="dp-improvement-circuit">
                        <ol
                            className="dp-improvement-list"
                            data-structure-motion="improvement"
                        >
                            {improvementSteps.map((step, index) => {
                                const nextStep = improvementSteps[index + 1];

                                return (
                                    <li
                                        key={step.step}
                                        data-diagram-node={step.title}
                                        data-improvement-step={String(step.step)}
                                    >
                                        <RpgText className="dp-card__index">
                                            {String(step.step).padStart(2, '0')}
                                        </RpgText>
                                        <div>
                                            <RpgText as="h3">{step.title}</RpgText>
                                            <RpgText as="p">
                                                {step.description}
                                            </RpgText>
                                        </div>
                                        {nextStep && (
                                            <span
                                                aria-hidden="true"
                                                className="dp-diagram-edge dp-diagram-edge--loop"
                                                data-diagram-edge
                                                data-edge-id={`improvement-edge-${step.step}`}
                                                data-edge-from={String(step.step)}
                                                data-edge-kind="forward"
                                                data-edge-to={String(nextStep.step)}
                                            />
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                        <span
                            aria-hidden="true"
                            className="dp-improvement-return"
                            data-diagram-edge
                            data-edge-id="improvement-edge-8"
                            data-edge-from="8"
                            data-edge-kind="return"
                            data-edge-to="1"
                        />
                    </div>
                    <div className="dp-improvement-map__core">
                        <RpgText className="dp-technical">RETURN TO SOURCE</RpgText>
                        <RpgText as="strong">原因を所有する正本へ</RpgText>
                        <RpgText as="small">何でもHarnessへ戻すわけではない</RpgText>
                    </div>
                    <figcaption className="dp-diagram-caption">
                        <RpgText>
                            FindingからFeedbackへ進み、原因を所有する正本に戻して次のFindingへつなぐ閉ループ。
                        </RpgText>
                    </figcaption>
                </figure>

                <div className="dp-feedback">
                    <RpgText className="dp-technical">FEEDBACK DESTINATIONS</RpgText>
                    <ul>
                        {feedbackDestinations.map((destination) => (
                            <li key={destination}>
                                <RpgText>{destination}</RpgText>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
