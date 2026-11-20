import HeroEvidenceIllustration from './HeroEvidenceIllustration';
import PhilosophyInkText from './PhilosophyInkText';
import type { DesignPhilosophySectionProps } from './designPhilosophyTypes';

export default function Hero({ section }: DesignPhilosophySectionProps) {
    return <header id={section.key} className="dp-hero" aria-labelledby="design-philosophy-hero" data-scroll-reveal>
        <div className="dp-shell dp-hero__layout">
            <div className="dp-hero__content">
                <p className="dp-eyebrow">{section.eyebrow}</p>
                <h1 id="design-philosophy-hero" aria-label={section.title}><PhilosophyInkText text={section.title} /></h1>
                <p className="dp-hero__lead">{section.lead}</p>
                {section.body && <p className="dp-hero__body">{section.body}</p>}
            </div>
            <div className="dp-hero__visual"><HeroEvidenceIllustration /></div>
        </div>
    </header>;
}
