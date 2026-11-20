import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';

/** native detailsを保ち、最後の操作へ追従する短い開閉だけを補います。 */
export default function PhilosophyDetails({ label, children }: { label: string; children: ReactNode }) {
    const ref = useRef<HTMLDetailsElement>(null);
    const animation = useRef<Animation | null>(null);
    const desiredOpen = useRef<boolean | null>(null);

    useEffect(() => {
        const details = ref.current;
        if (!details) return;
        const revealTarget = () => {
            animation.current?.cancel();
            animation.current = null;
            details.style.overflow = '';
            desiredOpen.current = true;
            details.open = true;
        };
        const stop = () => {
            animation.current?.cancel(); animation.current = null;
            details.style.overflow = '';
            if (desiredOpen.current !== null) details.open = desiredOpen.current;
        };
        details.addEventListener('dp-stop-motion', stop);
        details.addEventListener('dp-open-details', revealTarget);
        return () => {
            animation.current?.cancel();
            details.removeEventListener('dp-open-details', revealTarget);
            details.removeEventListener('dp-stop-motion', stop);
        };
    }, []);

    function toggle(event: MouseEvent<HTMLElement>) {
        event.preventDefault();
        const details = ref.current;
        const summary = details?.querySelector('summary');
        if (!details || !summary) return;
        const target = !(desiredOpen.current ?? details.open);
        desiredOpen.current = target;
        const start = details.getBoundingClientRect().height;
        animation.current?.cancel();
        animation.current = null;
        details.style.overflow = '';
        if (!target && details.contains(document.activeElement) && document.activeElement !== summary) summary.focus();
        const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const disabled = details.closest('[data-motion-off]') !== null;
        if (reduce || disabled || typeof details.animate !== 'function') {
            details.open = target;
            return;
        }
        details.open = true;
        const end = target ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + 2;
        try {
            details.style.overflow = 'hidden';
            const current = details.animate([{ height: `${start}px` }, { height: `${end}px` }], { duration: 250, easing: 'ease-out' });
            animation.current = current;
            current.onfinish = () => {
                if (animation.current !== current) return;
                if (!target && details.contains(document.activeElement) && document.activeElement !== summary) summary.focus();
                details.open = target;
                details.style.overflow = '';
                animation.current = null;
            };
        } catch {
            details.style.overflow = '';
            details.open = target;
        }
    }

    return <details ref={ref} className="dp-details" onToggle={() => { if (!animation.current) desiredOpen.current = ref.current?.open ?? false; }}>
        <summary onClick={toggle}>詳しく見る<span>{label}</span><i aria-hidden="true" className="dp-details-icon" /></summary>
        <div className="dp-details-content">{children}</div>
    </details>;
}
