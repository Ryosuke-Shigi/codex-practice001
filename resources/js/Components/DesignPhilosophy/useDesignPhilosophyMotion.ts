import { useEffect, type RefObject } from 'react';

const sectionSelector = '[data-rpg-section]';
const textSelector = '[data-rpg-text]';

function prefersReducedMotion() {
    return (
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
}

function revealAll(sections: NodeListOf<HTMLElement>) {
    sections.forEach((section) => {
        delete section.dataset.rpgState;
        delete section.dataset.motionState;
    });
}

/**
 * Enables character reveal and structural motion only after every section has
 * been registered with IntersectionObserver. Sections remain observed so
 * activity can update offscreen without hiding already revealed copy.
 * The document remains complete when observer setup fails.
 */
export default function useDesignPhilosophyMotion(
    rootRef: RefObject<HTMLElement | null>,
) {
    useEffect(() => {
        const root = rootRef.current;

        if (!root) {
            return;
        }

        const reducedMotion = prefersReducedMotion();
        root.dataset.reducedMotion = reducedMotion ? 'true' : 'false';

        const handleVisibilityChange = () => {
            root.dataset.motionPaused = document.hidden ? 'true' : 'false';
        };

        handleVisibilityChange();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        const sections = root.querySelectorAll<HTMLElement>(sectionSelector);
        let observer: IntersectionObserver | undefined;
        let candidateObserver: IntersectionObserver | undefined;

        if (
            !reducedMotion &&
            sections.length > 0 &&
            typeof window.IntersectionObserver === 'function'
        ) {
            try {
                const activeObserver = new window.IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            const section = entry.target as HTMLElement;
                            section.dataset.motionState = entry.isIntersecting
                                ? 'active'
                                : 'inactive';

                            if (entry.isIntersecting) {
                                section.dataset.rpgState = 'visible';
                            }
                        });
                    },
                    {
                        rootMargin: '0px 0px -8% 0px',
                        threshold: 0.06,
                    },
                );
                candidateObserver = activeObserver;

                sections.forEach((section) => {
                    section.dataset.rpgState = 'pending';
                    section.dataset.motionState = 'inactive';
                    section
                        .querySelectorAll<HTMLElement>(textSelector)
                        .forEach((text, index) => {
                            text.style.setProperty(
                                '--dp-rpg-block-delay',
                                `${Math.min(index * 55, 770)}ms`,
                            );
                        });
                    activeObserver.observe(section);
                });

                observer = activeObserver;
                root.dataset.rpgEnhanced = 'true';
            } catch {
                candidateObserver?.disconnect();
                observer = undefined;
                revealAll(sections);
                delete root.dataset.rpgEnhanced;
            }
        }

        return () => {
            observer?.disconnect();
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
            sections.forEach((section) => {
                delete section.dataset.rpgState;
                delete section.dataset.motionState;
                section
                    .querySelectorAll<HTMLElement>(textSelector)
                    .forEach((text) =>
                        text.style.removeProperty('--dp-rpg-block-delay'),
                    );
            });
            delete root.dataset.rpgEnhanced;
            delete root.dataset.reducedMotion;
            delete root.dataset.motionPaused;
        };
    }, [rootRef]);
}
