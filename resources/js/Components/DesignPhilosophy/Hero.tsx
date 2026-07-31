import { ArrowDownRight, ArrowRight, Orbit } from 'lucide-react';

import HeroSystemCore from '@/Components/DesignPhilosophy/HeroSystemCore';
import { heroSignals } from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function Hero({ section }: { section: DesignPhilosophySection }) {
    return (
        <header
            aria-labelledby="design-philosophy-hero"
            className="dp-hero"
        >
            <div className="dp-shell dp-hero__layout">
                <div className="dp-hero__content">
                    <p className="dp-eyebrow dp-reveal">
                        <span aria-hidden="true" />
                        {section.eyebrow}
                    </p>
                    <h1 id="design-philosophy-hero" className="dp-reveal">
                        {section.title}
                    </h1>
                    <p className="dp-hero__lead dp-reveal">{section.lead}</p>
                    <p className="dp-hero__body dp-reveal">{section.body}</p>

                    <nav
                        aria-label="設計思想の主要セクション"
                        className="dp-hero__actions dp-reveal"
                    >
                        <a
                            className="dp-button dp-button--primary"
                            href="#ai-development-flow"
                        >
                            開発フローを見る
                            <ArrowDownRight aria-hidden="true" />
                        </a>
                        <a
                            className="dp-button dp-button--secondary"
                            href="#architecture"
                        >
                            責務設計を見る
                            <ArrowRight aria-hidden="true" />
                        </a>
                    </nav>

                    <ul
                        aria-label="設計思想の特性"
                        className="dp-hero__signals dp-reveal"
                    >
                        {heroSignals.map((signal) => (
                            <li key={signal}>
                                <span aria-hidden="true" />
                                {signal}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="dp-hero__visual dp-reveal">
                    <HeroSystemCore />
                    <div className="dp-hero__visual-caption">
                        <Orbit aria-hidden="true" />
                        <span>CONTROL SYSTEM</span>
                        <strong>Human / Contract / Verify</strong>
                    </div>
                </div>
            </div>
        </header>
    );
}
