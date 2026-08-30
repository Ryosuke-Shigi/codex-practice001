import { ArrowDownRight, ArrowRight, Orbit } from 'lucide-react';

import HeroSystemCore from '@/Components/DesignPhilosophy/HeroSystemCore';
import RpgText from '@/Components/DesignPhilosophy/RpgText';
import { heroSignals } from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function Hero({ section }: { section: DesignPhilosophySection }) {
    return (
        <header
            aria-labelledby="design-philosophy-hero"
            className="dp-hero"
            data-rpg-section
        >
            <div className="dp-shell dp-hero__layout">
                <div className="dp-hero__content">
                    <RpgText as="p" className="dp-eyebrow">
                        {section.eyebrow}
                    </RpgText>
                    <RpgText as="h1" id="design-philosophy-hero">
                        {section.title}
                    </RpgText>
                    <RpgText as="p" className="dp-hero__lead">
                        {section.lead}
                    </RpgText>
                    <RpgText as="p" className="dp-hero__body">
                        {section.body}
                    </RpgText>

                    <nav
                        aria-label="設計思想の主要セクション"
                        className="dp-hero__actions"
                    >
                        <a
                            className="dp-button dp-button--primary"
                            href="#ai-development-flow"
                        >
                            <RpgText>8段階フローを見る</RpgText>
                            <ArrowDownRight aria-hidden="true" />
                        </a>
                        <a
                            className="dp-button dp-button--secondary"
                            href="#architecture"
                        >
                            <RpgText>ADR Patternを見る</RpgText>
                            <ArrowRight aria-hidden="true" />
                        </a>
                    </nav>

                    <ul
                        aria-label="設計思想の特性"
                        className="dp-hero__signals"
                    >
                        {heroSignals.map((signal) => (
                            <li key={signal}>
                                <RpgText>{signal}</RpgText>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="dp-hero__visual">
                    <HeroSystemCore />
                    <div className="dp-hero__visual-caption">
                        <Orbit aria-hidden="true" />
                        <RpgText>DRAWING DP-01</RpgText>
                        <RpgText as="strong">
                            Human Authority / Bounded Execution / Evidence
                        </RpgText>
                    </div>
                </div>
            </div>
        </header>
    );
}
