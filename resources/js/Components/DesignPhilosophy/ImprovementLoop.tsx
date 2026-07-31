import { ArrowDown, RefreshCw } from 'lucide-react';

import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import { improvementSteps } from '@/Components/DesignPhilosophy/designPhilosophyData';
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
        >
            <div className="dp-shell">
                <SectionHeading section={section} />

                <div className="dp-improvement-layout">
                    <div aria-hidden="true" className="dp-loop-visual">
                        <RefreshCw />
                        <span />
                        <span />
                        <span />
                    </div>

                    <ol className="dp-improvement-list">
                        {improvementSteps.map((step, index) => (
                            <li key={step.step} className="dp-reveal">
                                <article>
                                    <span>
                                        {String(step.step).padStart(2, '0')}
                                    </span>
                                    <div>
                                        <h3>{step.title}</h3>
                                        <p>{step.description}</p>
                                    </div>
                                </article>
                                {index < improvementSteps.length - 1 && (
                                    <ArrowDown aria-hidden="true" />
                                )}
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
