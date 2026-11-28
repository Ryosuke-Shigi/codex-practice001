import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

function returnFocus(details: HTMLDetailsElement) {
    const summary = details.querySelector('summary');
    if (summary && details.contains(document.activeElement) && document.activeElement !== summary) {
        summary.focus({ preventScroll: true });
    }
}

/** 開閉はネイティブのdetailsに委ね、開閉途中の操作だけ最後の指定に揃えます。 */
export default function PhilosophyDetails({ label, children }: { label: string; children: ReactNode }) {
    const ref = useRef<HTMLDetailsElement>(null);
    const animation = useRef<Animation | null>(null);
    const desiredOpen = useRef<boolean | null>(null);
    const [open, setOpen] = useState(false);

    const stopAnimation = useCallback((details: HTMLDetailsElement) => {
        animation.current?.cancel();
        animation.current = null;
        details.style.overflow = '';
    }, []);

    const settle = useCallback((details: HTMLDetailsElement, target: boolean) => {
        if (!target) returnFocus(details);
        details.open = target;
        desiredOpen.current = null;
        setOpen(target);
    }, []);

    useEffect(() => {
        const details = ref.current;
        if (!details) return;

        const motionPreference = window.matchMedia?.(reducedMotionQuery);
        const revealTarget = () => {
            stopAnimation(details);
            settle(details, true);
        };
        const stop = () => {
            const target = desiredOpen.current ?? details.open;
            stopAnimation(details);
            settle(details, target);
        };
        const onMotionPreferenceChange = (event: MediaQueryListEvent) => {
            if (event.matches) stop();
        };

        details.addEventListener('dp-open-details', revealTarget);
        details.addEventListener('dp-stop-motion', stop);
        motionPreference?.addEventListener?.('change', onMotionPreferenceChange);
        return () => {
            stopAnimation(details);
            details.removeEventListener('dp-open-details', revealTarget);
            details.removeEventListener('dp-stop-motion', stop);
            motionPreference?.removeEventListener?.('change', onMotionPreferenceChange);
        };
    }, [settle, stopAnimation]);

    function toggle(event: MouseEvent<HTMLElement>) {
        const details = ref.current;
        if (!details) return;

        event.preventDefault();
        const target = !(desiredOpen.current ?? details.open);
        const start = details.getBoundingClientRect().height;
        stopAnimation(details);
        if (!target) returnFocus(details);

        const reduce = window.matchMedia?.(reducedMotionQuery).matches;
        if (reduce || details.closest('[data-motion-off]') || typeof details.animate !== 'function') {
            settle(details, target);
            return;
        }

        desiredOpen.current = target;
        details.open = true;
        setOpen(true);
        const end = target ? details.getBoundingClientRect().height : event.currentTarget.getBoundingClientRect().height;
        try {
            details.style.overflow = 'hidden';
            const current = details.animate(
                [{ height: start + 'px' }, { height: end + 'px' }],
                { duration: 230, easing: 'ease-out' },
            );
            animation.current = current;
            current.onfinish = () => {
                if (animation.current !== current) return;
                animation.current = null;
                details.style.overflow = '';
                settle(details, target);
            };
        } catch {
            stopAnimation(details);
            settle(details, target);
        }
    }

    return (
        <details ref={ref} className="dp-details" onToggle={event => setOpen(event.currentTarget.open)}>
            <summary onClick={toggle}>
                {open ? '詳細を閉じる' : '詳しく見る'}
                <span className="dp-visually-hidden">（{label}）</span>
                <i aria-hidden="true" className="dp-details-icon" />
            </summary>
            <div className="dp-details-content">{children}</div>
        </details>
    );
}
