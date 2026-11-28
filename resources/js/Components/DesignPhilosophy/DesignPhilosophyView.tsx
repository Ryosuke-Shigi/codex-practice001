import { useEffect, useRef, useState } from 'react';

import Hero from './Hero';
import PhilosophyDetails from './PhilosophyDetails';
import PhilosophyIllustration from './PhilosophyIllustration';
import PhilosophyTopicDetail from './PhilosophyTopicDetail';
import type { DesignPhilosophySection } from './designPhilosophyTypes';
import { buildPhilosophyTopics } from './philosophyTopics';
import useDesignPhilosophyMotion from './useDesignPhilosophyMotion';
import './philosophyOverview.css';

export default function DesignPhilosophyView({ sections }: { sections: readonly DesignPhilosophySection[] }) {
    const rootRef = useRef<HTMLElement>(null);
    const [motionOff, setMotionOff] = useState(false);
    const topics = buildPhilosophyTopics(sections);
    const hero = sections.find(section => section.key === 'hero');
    useDesignPhilosophyMotion(rootRef, sections);

    // 詳細内の旧章と旧群のアンカーは、スクロールの前に開きます。
    useEffect(() => {
        const followHash = () => {
            let id: string;
            try {
                id = decodeURIComponent(window.location.hash.slice(1));
            } catch {
                return;
            }
            if (!id) return;

            const target = document.getElementById(id);
            if (!target || !rootRef.current?.contains(target)) return;

            const detail = target.closest('details');
            if (detail) {
                detail.dispatchEvent(new Event('dp-open-details'));
            }
            target.scrollIntoView?.({ block: 'start', behavior: 'instant' });
        };

        followHash();
        window.addEventListener('hashchange', followHash);
        return () => window.removeEventListener('hashchange', followHash);
    }, [sections]);

    function toggleMotion() {
        if (!motionOff) {
            rootRef.current?.querySelectorAll('details').forEach(detail => {
                detail.dispatchEvent(new Event('dp-stop-motion'));
            });
        }
        setMotionOff(!motionOff);
    }

    return (
        <article ref={rootRef} className="dp-page" data-motion-off={motionOff ? '' : undefined}>
            {hero && <Hero section={hero} />}

            {(hero || topics.length > 0) && (
                <div className="dp-toolbar dp-shell">
                    {topics.length > 0 && (
                        <nav className="dp-nav" aria-label="設計思想の各節">
                            {topics.map(topic => <a key={topic.id} href={'#' + topic.id}>{topic.title}</a>)}
                        </nav>
                    )}
                    <div className="dp-motion-controls">
                        <button type="button" data-motion-toggle aria-pressed={motionOff} onClick={toggleMotion}>
                            <span aria-hidden="true">{motionOff ? '▷' : 'Ⅱ'}</span>
                            {motionOff ? '動きを再生' : '動きを止める'}
                        </button>
                        <small>モーション軽減の設定を優先します</small>
                    </div>
                </div>
            )}

            <div className="dp-topics dp-shell">
                {topics.map(topic => (
                    <section
                        key={topic.id}
                        id={topic.id}
                        className="dp-topic"
                        aria-labelledby={topic.id + '-heading'}
                    >
                        <PhilosophyIllustration name={topic.image} alt="" />
                        <header className="dp-topic__head" data-scroll-reveal>
                            <h2 id={topic.id + '-heading'}>{topic.title}</h2>
                            <p>{topic.summary}</p>
                        </header>
                        <PhilosophyDetails label={topic.title}>
                            {topic.details.map(detail => (
                                <div key={detail.key} id={detail.id} className="dp-chapter">
                                    {detail.aliases.map(alias => <span key={alias} id={alias} className="dp-legacy-anchor" aria-hidden="true" />)}
                                    <PhilosophyTopicDetail kind={detail.key} />
                                </div>
                            ))}
                        </PhilosophyDetails>
                    </section>
                ))}
            </div>

            <footer className="dp-footer dp-shell">
                <a className="dp-footer__primary" href="/projects">作品を見る <span aria-hidden="true">→</span></a>
                <a href="/">トップへ戻る</a>
            </footer>
        </article>
    );
}
