import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';
import RpgText from '@/Components/DesignPhilosophy/RpgText';

export default function SectionHeading({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <header className="dp-section-heading">
            <div className="dp-section-heading__title">
                <RpgText as="p" className="dp-eyebrow">
                    {section.eyebrow}
                </RpgText>
                <RpgText as="h2" id={`design-philosophy-${section.key}`}>
                    {section.title}
                </RpgText>
            </div>
            <div className="dp-section-heading__copy">
                <RpgText as="p" className="dp-section-heading__lead">
                    {section.lead}
                </RpgText>
                <RpgText as="p">{section.body}</RpgText>
            </div>
        </header>
    );
}
