import RpgText from '@/Components/DesignPhilosophy/RpgText';
import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import { developmentStages } from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function DevelopmentStages({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <section
            id={section.key}
            aria-labelledby={`design-philosophy-${section.key}`}
            className="dp-section dp-section--stages"
            data-rpg-section
        >
            <div className="dp-shell">
                <SectionHeading section={section} />

                <ol className="dp-stage-grid">
                    {developmentStages.map((stage, index) => (
                        <li key={stage.key}>
                            <article className="dp-paper-card dp-stage-card">
                                <RpgText className="dp-card__index">
                                    {String(index + 1).padStart(2, '0')}
                                </RpgText>
                                <RpgText className="dp-technical">
                                    {stage.key}
                                </RpgText>
                                <RpgText as="h3">{stage.label}</RpgText>
                                <RpgText as="p">{stage.purpose}</RpgText>
                                <dl>
                                    <div>
                                        <RpgText as="dt">確認する</RpgText>
                                        <RpgText as="dd">{stage.includes.join(' / ')}</RpgText>
                                    </div>
                                    <div>
                                        <RpgText as="dt">まだ作らない</RpgText>
                                        <RpgText as="dd">{stage.excludes.join(' / ')}</RpgText>
                                    </div>
                                    <div>
                                        <RpgText as="dt">次へ渡す</RpgText>
                                        <RpgText as="dd">{stage.deliverable}</RpgText>
                                    </div>
                                </dl>
                                <div className="dp-stage-card__gate">
                                    <RpgText className="dp-technical">HUMAN GATE</RpgText>
                                    <RpgText as="strong">
                                        {stage.key === 'PRODUCT'
                                            ? '受入条件で判断する'
                                            : '次段階へ自動昇格しない'}
                                    </RpgText>
                                </div>
                            </article>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
