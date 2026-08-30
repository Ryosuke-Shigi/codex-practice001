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

                <div className="dp-improvement-map">
                    <ol
                        className="dp-improvement-list"
                        data-structure-motion="improvement"
                    >
                        {improvementSteps.map((step) => (
                            <li key={step.step} data-improvement-step>
                                <RpgText className="dp-card__index">
                                    {String(step.step).padStart(2, '0')}
                                </RpgText>
                                <div>
                                    <RpgText as="h3">{step.title}</RpgText>
                                    <RpgText as="p">{step.description}</RpgText>
                                </div>
                            </li>
                        ))}
                    </ol>
                    <div className="dp-improvement-map__core">
                        <RpgText className="dp-technical">RETURN TO SOURCE</RpgText>
                        <RpgText as="strong">原因を所有する正本へ</RpgText>
                        <RpgText as="small">何でもHarnessへ戻すわけではない</RpgText>
                    </div>
                </div>

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
