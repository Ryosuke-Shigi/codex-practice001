import { useEffect, useRef, useState } from 'react';
import DesignPhilosophySection from './DesignPhilosophySection';
import Hero from './Hero';
import PhilosophyInkText from './PhilosophyInkText';
import PhilosophyDetails from './PhilosophyDetails';
import PhilosophyOverviewDiagram from './PhilosophyOverviewDiagram';
import type { DesignPhilosophySection as Section } from './designPhilosophyTypes';
import useDesignPhilosophyMotion from './useDesignPhilosophyMotion';
import './designPhilosophy.css';
import './philosophyOverview.css';

const groups = [
    { id: 'roles', key: 'human-ai-roles', number: '01', details: ['human-ai-roles', 'ai-development-flow'] },
    { id: 'structure', key: 'architecture', number: '02', details: ['architecture'] },
    { id: 'checks', key: 'quality-gates', number: '03', details: ['principles', 'quality-gates', 'improvement-loop', 'closing'] },
    { id: 'stages', key: 'development-stages', number: '04', details: ['development-stages'] },
] as const;

export default function DesignPhilosophyView({ sections }: { sections: Section[] }) {
    const rootRef = useRef<HTMLElement>(null);
    const [motionOff, setMotionOff] = useState(false);
    const visibleSectionKeys = new Set(sections.map(({ key }) => key));
    const byKey = new Map(sections.map(section => [section.key, section]));
    // 主節が無効でも、独立して有効な旧章の詳細は表示します。
    const visibleGroups = groups.flatMap(group => {
        const details = sections.filter(section => group.details.some(key => key === section.key));
        const primary = byKey.get(group.key);
        const heading = primary ?? details[0];
        return heading ? [{ ...group, primary, heading, details }] : [];
    });
    useDesignPhilosophyMotion(rootRef);

    // 旧章への直接リンクでは、折りたたみを開いてから内容へ移動します。
    useEffect(() => {
        const followHash = () => {
            let id: string;
            try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
            if (!id) return;
            const target = document.getElementById(id);
            if (!target || !rootRef.current?.contains(target)) return;
            const detail = target.closest('details');
            if (detail) { detail.dispatchEvent(new Event('dp-open-details')); detail.open = true; }
            target.scrollIntoView?.({ block: 'start', behavior: 'instant' });
        };
        followHash();
        window.addEventListener('hashchange', followHash);
        return () => window.removeEventListener('hashchange', followHash);
    }, [sections]);

    const hero = byKey.get('hero');
    return <article ref={rootRef} className="dp-page dp-simplified" data-motion-off={motionOff ? '' : undefined}>
        {hero && <Hero section={hero} visibleSectionKeys={visibleSectionKeys} />}
        <div className="dp-shell dp-motion-controls"><button type="button" data-motion-toggle aria-pressed={motionOff} onClick={() => { setMotionOff(!motionOff); if (!motionOff) rootRef.current?.querySelectorAll('details').forEach(detail => detail.dispatchEvent(new Event('dp-stop-motion'))); }}>{motionOff ? '動きを再生' : '動きを止める'}</button><small>モーション軽減の設定を優先します</small></div>
        <nav className="dp-shell dp-overview-nav" aria-label="設計思想の4つの考え方">
            {visibleGroups.map(group => <a key={group.id} href={`#${group.id}`}><span>{group.number}</span>{group.heading.title}</a>)}
        </nav>
        {visibleGroups.map(group => {
            const section = group.heading;
            return <section key={group.id} id={group.id} className="dp-overview-section dp-shell" aria-labelledby={`overview-${group.id}`}>
                <header className="dp-overview-heading" data-scroll-reveal><p className="dp-eyebrow">{section.eyebrow}</p><h2 id={`overview-${group.id}`} aria-label={section.title}><PhilosophyInkText text={section.title} /></h2><p className="dp-overview-lead">{section.lead}</p>{section.body && <p className="dp-understanding-note">{section.body}</p>}</header>
                {group.primary && <PhilosophyOverviewDiagram kind={group.id} />}
                <PhilosophyDetails label={group.id === 'roles' ? '作業条件・担当・8工程' : group.id === 'structure' ? 'ADR・設計パターン・理解再起動' : group.id === 'checks' ? '4要素・独立確認・改善工程' : '入出力・対象外・移行条件'}>{group.details.map(detail => <DesignPhilosophySection key={detail.key} section={detail} visibleSectionKeys={visibleSectionKeys} />)}</PhilosophyDetails>
            </section>;
        })}
        <footer className="dp-shell dp-overview-footer"><p>考え方を、実際の作品へ。</p><a className="dp-button dp-button--primary" href="/projects">作品を見る <span aria-hidden="true">→</span></a><a className="dp-button dp-button--secondary" href="/">トップへ戻る</a></footer>
    </article>;
}
