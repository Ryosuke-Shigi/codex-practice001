import { useEffect, type RefObject } from 'react';

const targetsSelector = '[data-rpg-section], [data-structure-motion], [data-scroll-reveal]';
const seenAttribute = 'data-scroll-seen';

/** 表示を隠さず、画面に入った演出対象だけを一度強調します。 */
export default function useDesignPhilosophyMotion(
    rootRef: RefObject<HTMLElement | null>,
) {
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const reducedMotion = typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion || typeof window.IntersectionObserver !== 'function') return;

        const targets = root.querySelectorAll<HTMLElement>(targetsSelector);
        let observer: IntersectionObserver | undefined;
        const clearSeen = () => targets.forEach((target) => target.removeAttribute(seenAttribute));

        try {
            observer = new window.IntersectionObserver((entries) => {
                if (!observer) return;
                for (const { target, isIntersecting } of entries) {
                    if (!isIntersecting || target.hasAttribute(seenAttribute)) continue;

                    target.setAttribute(seenAttribute, '');
                    observer.unobserve(target);
                }
            }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

            for (const target of targets) observer.observe(target);
        } catch {
            observer?.disconnect();
            observer = undefined;
            clearSeen();
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
            clearSeen();
        };
    }, [rootRef]);
}
