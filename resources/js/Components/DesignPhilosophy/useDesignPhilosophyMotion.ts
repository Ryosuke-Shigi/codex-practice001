import { useEffect, type RefObject } from 'react';

const revealSelector = '.dp-reveal';
const tiltSelector = '[data-tilt]';

function supportsFinePointer() {
    return (
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(pointer: fine)').matches
    );
}

function prefersReducedMotion() {
    return (
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
}

function revealAll(elements: NodeListOf<HTMLElement>) {
    elements.forEach((element) => {
        delete element.dataset.revealState;
    });
}

/**
 * Progressive motion enhancements for the Design Philosophy page.
 *
 * The base CSS keeps every section visible. Capability data attributes are only
 * added after an API is confirmed, so unsupported browsers retain the complete
 * document without an animation dependency.
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

        let observer: IntersectionObserver | undefined;

        if (
            !reducedMotion &&
            typeof window.IntersectionObserver === 'function'
        ) {
            const revealElements =
                root.querySelectorAll<HTMLElement>(revealSelector);
            let candidateObserver: IntersectionObserver | undefined;

            try {
                const activeObserver = new window.IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            if (!entry.isIntersecting) {
                                return;
                            }

                            const element = entry.target as HTMLElement;
                            element.dataset.revealState = 'visible';
                            observer?.unobserve(element);
                        });
                    },
                    {
                        rootMargin: '0px 0px -10% 0px',
                        threshold: 0.08,
                    },
                );
                candidateObserver = activeObserver;

                revealElements.forEach((element) => {
                    element.dataset.revealState = 'pending';
                });
                revealElements.forEach((element) =>
                    activeObserver.observe(element),
                );
                observer = activeObserver;
            } catch {
                candidateObserver?.disconnect();
                observer = undefined;
                revealAll(revealElements);
            }
        }

        const tiltCleanups: Array<() => void> = [];

        if (!reducedMotion && supportsFinePointer()) {
            root.querySelectorAll<HTMLElement>(tiltSelector).forEach(
                (element) => {
                    const handlePointerMove = (event: PointerEvent) => {
                        const bounds = element.getBoundingClientRect();
                        const x = (event.clientX - bounds.left) / bounds.width;
                        const y = (event.clientY - bounds.top) / bounds.height;

                        element.style.setProperty(
                            '--dp-tilt-x',
                            `${((0.5 - y) * 5).toFixed(2)}deg`,
                        );
                        element.style.setProperty(
                            '--dp-tilt-y',
                            `${((x - 0.5) * 7).toFixed(2)}deg`,
                        );
                        element.style.setProperty(
                            '--dp-glow-x',
                            `${(x * 100).toFixed(1)}%`,
                        );
                        element.style.setProperty(
                            '--dp-glow-y',
                            `${(y * 100).toFixed(1)}%`,
                        );
                    };

                    const resetTilt = () => {
                        element.style.removeProperty('--dp-tilt-x');
                        element.style.removeProperty('--dp-tilt-y');
                        element.style.removeProperty('--dp-glow-x');
                        element.style.removeProperty('--dp-glow-y');
                    };

                    element.addEventListener(
                        'pointermove',
                        handlePointerMove,
                    );
                    element.addEventListener('pointerleave', resetTilt);
                    element.addEventListener('pointercancel', resetTilt);
                    tiltCleanups.push(() => {
                        element.removeEventListener(
                            'pointermove',
                            handlePointerMove,
                        );
                        element.removeEventListener(
                            'pointerleave',
                            resetTilt,
                        );
                        element.removeEventListener(
                            'pointercancel',
                            resetTilt,
                        );
                        resetTilt();
                    });
                },
            );
        }

        return () => {
            observer?.disconnect();
            tiltCleanups.forEach((cleanup) => cleanup());
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
            delete root.dataset.reducedMotion;
            delete root.dataset.motionPaused;
        };
    }, [rootRef]);
}
