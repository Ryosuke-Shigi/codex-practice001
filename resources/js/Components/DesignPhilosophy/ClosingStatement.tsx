import { Link } from '@inertiajs/react';
import { ArrowLeft, Layers3, RotateCcw } from 'lucide-react';

import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';
import RpgText from '@/Components/DesignPhilosophy/RpgText';

export default function ClosingStatement({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <footer
            id={section.key}
            aria-labelledby={`design-philosophy-${section.key}`}
            className="dp-closing"
            data-rpg-section
        >
            <div className="dp-shell">
                <div className="dp-closing__panel">
                    <div className="dp-closing__signal">
                        <span />
                        <span />
                        <span />
                    </div>
                    <RpgText as="p" className="dp-eyebrow">
                        {section.eyebrow}
                    </RpgText>
                    <RpgText as="h2" id={`design-philosophy-${section.key}`}>
                        {section.title}
                    </RpgText>
                    <RpgText as="p" className="dp-closing__lead">
                        {section.lead}
                    </RpgText>
                    <RpgText as="p" className="dp-closing__body">
                        {section.body}
                    </RpgText>

                    <nav
                        aria-label="設計思想からの次の導線"
                        className="dp-closing__links"
                    >
                        <Link
                            className="dp-button dp-button--primary"
                            href="/projects"
                            aria-label="PROJECT選択へ戻る"
                            title="PROJECT選択へ戻る"
                        >
                            <ArrowLeft aria-hidden="true" />
                            <RpgText>戻る</RpgText>
                        </Link>
                        <a
                            className="dp-button dp-button--secondary"
                            href="#architecture"
                        >
                            <Layers3 aria-hidden="true" />
                            <RpgText>ADR Patternを再確認</RpgText>
                        </a>
                        <a
                            className="dp-button dp-button--secondary"
                            href="#improvement-loop"
                        >
                            <RotateCcw aria-hidden="true" />
                            <RpgText>改善ループを見る</RpgText>
                        </a>
                    </nav>
                </div>
            </div>
        </footer>
    );
}
