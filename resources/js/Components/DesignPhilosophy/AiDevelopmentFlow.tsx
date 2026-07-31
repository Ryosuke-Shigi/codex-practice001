import {
    ArrowLeft,
    ArrowRight,
    CornerDownRight,
} from 'lucide-react';
import type { KeyboardEvent } from 'react';

import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import { aiDevelopmentSteps } from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

function handleFlowKeyDown(event: KeyboardEvent<HTMLElement>) {
    const supportedKeys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];

    if (!supportedKeys.includes(event.key)) {
        return;
    }

    event.preventDefault();

    const region = event.currentTarget;
    const firstCard = region.querySelector<HTMLElement>('ol > li');
    const cardStep = (firstCard?.offsetWidth ?? region.clientWidth * 0.82) + 16;
    const endPosition = Math.max(0, region.scrollWidth - region.clientWidth);
    let nextPosition = region.scrollLeft;

    if (event.key === 'Home') {
        nextPosition = 0;
    } else if (event.key === 'End') {
        nextPosition = endPosition;
    } else if (event.key === 'ArrowLeft') {
        nextPosition = Math.max(0, region.scrollLeft - cardStep);
    } else {
        nextPosition = Math.min(endPosition, region.scrollLeft + cardStep);
    }

    const behavior =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth';

    if (typeof region.scrollTo === 'function') {
        region.scrollTo({ left: nextPosition, behavior });
    } else {
        region.scrollLeft = nextPosition;
    }
}

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
        >
            <div className="dp-shell">
                <SectionHeading section={section} />

                <div className="dp-flow-controls dp-reveal">
                    <p>
                        <CornerDownRight aria-hidden="true" />
                        構想から判断まで、11工程を順にたどれます
                    </p>
                    <span className="dp-flow-controls__scroll-hint">
                        <ArrowLeft aria-hidden="true" />
                        <ArrowRight aria-hidden="true" />
                        横向きではスワイプ・キー操作対応
                    </span>
                </div>
            </div>

            <div
                role="region"
                aria-label="AI開発の11工程"
                className="dp-flow-region dp-reveal"
                tabIndex={0}
                onKeyDown={handleFlowKeyDown}
            >
                <ol className="dp-flow-list">
                    {aiDevelopmentSteps.map((step) => (
                        <li key={step.step}>
                            <article className="dp-flow-card">
                                <div className="dp-flow-card__meta">
                                    <span>
                                        {String(step.step).padStart(2, '0')}
                                    </span>
                                    <strong>{step.owner}</strong>
                                </div>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </article>
                            {step.step < aiDevelopmentSteps.length && (
                                <ArrowRight
                                    aria-hidden="true"
                                    className="dp-flow-card__arrow"
                                />
                            )}
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
