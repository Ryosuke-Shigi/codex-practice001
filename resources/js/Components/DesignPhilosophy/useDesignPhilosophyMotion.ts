import { useEffect, type RefObject } from 'react';
import type { DesignPhilosophySection } from './designPhilosophyTypes';

const targetsSelector = '[data-scroll-reveal]';
const seenAttribute = 'data-scroll-seen';

/** 表示を隠さず、画面に入った演出対象だけを一度強調します。 */
export default function useDesignPhilosophyMotion(
    rootRef: RefObject<HTMLElement | null>,
    sections: readonly DesignPhilosophySection[],
) {
    useEffect(() => {
        const root = rootRef.current;
        if (!root || typeof window.IntersectionObserver !== 'function') return;

        const targets = root.querySelectorAll<HTMLElement>(targetsSelector);
        const seenThisRun = new Set<Element>();
        let observer: IntersectionObserver | undefined;
        try {
            observer = new window.IntersectionObserver((entries) => {
                if (!observer) return;
                for (const { target, isIntersecting } of entries) {
                    if (!isIntersecting || target.hasAttribute(seenAttribute)) continue;

                    target.setAttribute(seenAttribute, '');
                    seenThisRun.add(target);
                    observer.unobserve(target);
                }
            }, { rootMargin: '0px 0px -5% 0px', threshold: 0.05 });

            for (const target of targets) {
                if (!target.hasAttribute(seenAttribute)) observer.observe(target);
            }
        } catch {
            observer?.disconnect();
            observer = undefined;
            seenThisRun.forEach(target => target.removeAttribute(seenAttribute));
            return;
        }

        const syncVisibility = () => {
            root.toggleAttribute('data-motion-paused', document.hidden);
        };
        syncVisibility();
        document.addEventListener('visibilitychange', syncVisibility);

        return () => {
            observer?.disconnect();
            observer = undefined;
            document.removeEventListener('visibilitychange', syncVisibility);
            root.removeAttribute('data-motion-paused');
        };
    }, [rootRef, sections]);
}
