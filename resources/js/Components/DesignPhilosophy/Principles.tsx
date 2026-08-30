import RpgText from '@/Components/DesignPhilosophy/RpgText';
import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import {
    aiFailureModes,
    taskContractItems,
    trustFrame,
} from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function Principles({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <section
            id={section.key}
            aria-labelledby={`design-philosophy-${section.key}`}
            className="dp-section dp-section--contract"
            data-rpg-section
        >
            <div className="dp-shell">
                <SectionHeading section={section} />

                <div className="dp-risk-register">
                    <div className="dp-risk-register__heading">
                        <RpgText className="dp-technical">WHY ZERO TRUST</RpgText>
                        <RpgText as="h3">AIは、もっともらしく間違えられる</RpgText>
                    </div>
                    <ul>
                        {aiFailureModes.map((risk, index) => (
                            <li key={risk.label}>
                                <RpgText className="dp-card__index">
                                    {`R${String(index + 1).padStart(2, '0')}`}
                                </RpgText>
                                <RpgText as="strong">{risk.label}</RpgText>
                                <RpgText as="small">{risk.description}</RpgText>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="dp-trust-frame" data-structure-motion="trust-frame">
                    <div className="dp-trust-frame__equation">
                        <RpgText className="dp-technical">SEPARATE THE DECISION INPUTS</RpgText>
                        <RpgText as="strong">Claim ≠ Evidence ≠ Authority ≠ Acceptance</RpgText>
                    </div>
                    <ol aria-label="検証可能な判断の4要素">
                        {trustFrame.map((node, index) => (
                            <li key={node.label} data-trust-node>
                                <RpgText className="dp-card__index">
                                    {String(index + 1).padStart(2, '0')}
                                </RpgText>
                                <RpgText as="h3">{node.label}</RpgText>
                                <RpgText as="p">{node.description}</RpgText>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="dp-contract-heading">
                    <RpgText className="dp-technical">TASK CONTRACT / 9 FIELDS</RpgText>
                    <RpgText as="h3">AIが動く前に、境界を固定する</RpgText>
                </div>
                <div className="dp-contract-grid">
                    {taskContractItems.map((item, index) => (
                        <article
                            key={item.title}
                            className="dp-paper-card"
                            data-contract-group={item.group}
                        >
                            <RpgText className="dp-card__index">
                                {String(index + 1).padStart(2, '0')}
                            </RpgText>
                            <RpgText as="h3">{item.title}</RpgText>
                            <RpgText as="p">{item.description}</RpgText>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
