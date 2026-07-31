import { ArrowRight, Layers3, RotateCcw } from 'lucide-react';

import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

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
        >
            <div className="dp-shell">
                <div className="dp-closing__panel dp-reveal">
                    <div className="dp-closing__signal">
                        <span />
                        <span />
                        <span />
                    </div>
                    <p className="dp-eyebrow">
                        <span aria-hidden="true" />
                        {section.eyebrow}
                    </p>
                    <h2 id={`design-philosophy-${section.key}`}>
                        {section.title}
                    </h2>
                    <p className="dp-closing__lead">{section.lead}</p>
                    <p className="dp-closing__body">{section.body}</p>

                    <nav
                        aria-label="設計思想からの次の導線"
                        className="dp-closing__links"
                    >
                        <a
                            className="dp-button dp-button--primary"
                            href="/projects"
                        >
                            プロジェクトへ戻る
                            <ArrowRight aria-hidden="true" />
                        </a>
                        <a
                            className="dp-button dp-button--secondary"
                            href="#architecture"
                        >
                            <Layers3 aria-hidden="true" />
                            責務設計を再確認
                        </a>
                        <a
                            className="dp-button dp-button--secondary"
                            href="#improvement-loop"
                        >
                            <RotateCcw aria-hidden="true" />
                            改善ループを見る
                        </a>
                    </nav>
                </div>
            </div>
        </footer>
    );
}
