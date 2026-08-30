import RpgText from '@/Components/DesignPhilosophy/RpgText';
import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import {
    evidenceTypes,
    failClosedConditions,
} from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function QualityGates({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <section
            id={section.key}
            aria-labelledby={`design-philosophy-${section.key}`}
            className="dp-section dp-section--evidence"
            data-rpg-section
        >
            <div className="dp-shell">
                <SectionHeading section={section} />

                <RpgText as="p" className="dp-evidence-rule">
                    Static、Installed、Runtime、Browser、Verification / Review、Human Reviewは相互代替しない
                </RpgText>

                <div
                    className="dp-evidence-grid"
                    data-structure-motion="evidence"
                >
                    {evidenceTypes.map((evidence, index) => (
                        <article key={evidence.title} className="dp-paper-card">
                            <RpgText className="dp-card__index">
                                {`E${String(index + 1).padStart(2, '0')}`}
                            </RpgText>
                            <div aria-hidden="true" className="dp-evidence-meter">
                                <span />
                                <span />
                                <span />
                            </div>
                            <RpgText as="h3">{evidence.title}</RpgText>
                            <RpgText as="p">{evidence.description}</RpgText>
                            <RpgText as="strong">{evidence.boundary}</RpgText>
                        </article>
                    ))}
                </div>

                <div className="dp-fail-closed">
                    <div className="dp-fail-closed__heading">
                        <RpgText className="dp-technical">
                            FAIL CLOSED / STOP SIGNALS
                        </RpgText>
                        <RpgText as="h3">不明なまま、次のgateを開かない</RpgText>
                        <RpgText as="p">
                            設定値、AI自己申告、ひとつのPASSを他のEvidenceへ変換しません。
                        </RpgText>
                    </div>
                    <ul>
                        {failClosedConditions.map((condition) => (
                            <li key={condition}>
                                <span aria-hidden="true" />
                                <RpgText>{condition}</RpgText>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
