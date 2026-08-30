import { Link } from '@inertiajs/react';
import { ArrowLeft, Layers3, RotateCcw } from 'lucide-react';

import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';
import RpgText from '@/Components/DesignPhilosophy/RpgText';
import { closingAuthorityPath } from '@/Components/DesignPhilosophy/designPhilosophyData';

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

                    <figure
                        className="dp-closing__diagram"
                        data-diagram="authority-boundary"
                    >
                    <ol
                        aria-label="CapabilityからHuman Judgmentまでの判断境界"
                        className="dp-closing__authority"
                    >
                        {closingAuthorityPath.map((node, index) => (
                            <li
                                key={node.label}
                                data-diagram-node={node.label}
                            >
                                <RpgText className="dp-card__index">
                                    {String(index + 1).padStart(2, '0')}
                                </RpgText>
                                <RpgText as="strong">{node.label}</RpgText>
                                <RpgText as="small">{node.description}</RpgText>
                                {index < closingAuthorityPath.length - 1 && (
                                    <span
                                        aria-hidden="true"
                                        className="dp-diagram-edge dp-diagram-edge--authority"
                                        data-diagram-edge
                                        data-edge-kind={
                                            index === closingAuthorityPath.length - 2
                                                ? 'human-gate'
                                                : 'forward'
                                        }
                                    />
                                )}
                            </li>
                        ))}
                    </ol>
                        <figcaption className="dp-diagram-caption">
                            <RpgText>
                                CapabilityはOperation AuthorityとEvidenceを経て、最終のHuman Judgmentへ戻る。
                            </RpgText>
                        </figcaption>
                    </figure>

                    <nav
                        aria-label="設計思想からの次の導線"
                        className="dp-closing__links"
                    >
                        <Link
                            className="dp-button dp-button--primary"
                            href="/"
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
