import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function SectionHeading({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <header className="dp-section-heading dp-reveal">
            <div className="dp-section-heading__title">
                <p className="dp-eyebrow">
                    <span aria-hidden="true" />
                    {section.eyebrow}
                </p>
                <h2 id={`design-philosophy-${section.key}`}>
                    {section.title}
                </h2>
            </div>
            <div className="dp-section-heading__copy">
                <p className="dp-section-heading__lead">{section.lead}</p>
                <p>{section.body}</p>
            </div>
        </header>
    );
}
