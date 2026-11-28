import PhilosophyIllustration from './PhilosophyIllustration';
import type { DesignPhilosophySection } from './designPhilosophyTypes';

export default function Hero({ section }: { section: DesignPhilosophySection }) {
    return (
        <header id={section.key} className="dp-hero dp-shell" aria-labelledby="design-philosophy-hero">
            <div className="dp-hero__copy" data-scroll-reveal>
                <p className="dp-eyebrow">設計思想</p>
                <h1 id="design-philosophy-hero">
                    {section.title.split(/(?<=。)/u).map((phrase, index) => (
                        <span key={index}>{phrase}</span>
                    ))}
                </h1>
                <p className="dp-hero__lead">{section.lead}</p>
            </div>
            <PhilosophyIllustration name="hero-open-book" alt="開いた本から設計片が立ち上がり、藍色の光でつながる" />
        </header>
    );
}
