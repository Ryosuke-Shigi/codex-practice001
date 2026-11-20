import type { DesignPhilosophySectionProps } from './designPhilosophyTypes';
import { closingAuthorityPath } from './designPhilosophyData';

export default function ClosingStatement({ section, visibleSectionKeys }: DesignPhilosophySectionProps) {
    return <section id={section.key} aria-labelledby="design-philosophy-closing" className="dp-section dp-authority-note">
        <h3 id="design-philosophy-closing">{section.title}</h3><p>{section.lead}</p><p>{section.body}</p>
        <dl>{closingAuthorityPath.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.description}</dd></div>)}</dl>
        {visibleSectionKeys.has('architecture') && <a href="#architecture">責務の詳細へ</a>}{visibleSectionKeys.has('improvement-loop') && <a href="#improvement-loop">改善の詳細へ</a>}
    </section>;
}
