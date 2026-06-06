import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';

type PointerPosition = {
    x: number;
    y: number;
};

export default function CursorRippleBackground() {
    /*
     * この effect は cursor に反応する ripple 位置だけを担当します。
     * 見た目 state が小さいため React state で十分で、jquery.ripples を使わず Motion の highlight に変換します。
     */
    const [position, setPosition] = useState<PointerPosition>({ x: 50, y: 48 });
    const frameRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        /*
         * 外側の EffectLayer は pointer-events-none なので click を塞ぎません。
         * window で pointer movement だけを聞き、通常の UI 要素は実際の操作を受け取り続けます。
         */
        const handlePointerMove = (event: PointerEvent) => {
            if (frameRef.current !== undefined) {
                window.cancelAnimationFrame(frameRef.current);
            }

            frameRef.current = window.requestAnimationFrame(() => {
                setPosition({
                    x: (event.clientX / window.innerWidth) * 100,
                    y: (event.clientY / window.innerHeight) * 100,
                });
            });
        };

        window.addEventListener('pointermove', handlePointerMove, { passive: true });

        return () => {
            if (frameRef.current !== undefined) {
                window.cancelAnimationFrame(frameRef.current);
            }

            window.removeEventListener('pointermove', handlePointerMove);
        };
    }, []);

    const rippleStyle = {
        left: `${position.x}%`,
        top: `${position.y}%`,
    } satisfies CSSProperties;

    return (
        <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(155deg,rgba(199,251,255,0.18)_0%,rgba(75,208,223,0.18)_35%,rgba(11,106,140,0.2)_60%,rgba(4,24,50,0.38)_100%)]">
            <motion.div
                className="absolute inset-0"
                style={{
                    backgroundImage: `radial-gradient(circle at ${position.x}% ${position.y}%, rgba(255,255,255,0.46) 0%, rgba(165,243,252,0.22) 16%, rgba(255,255,255,0) 34%)`,
                }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
            />
            <motion.div
                className="absolute h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/38 shadow-[0_0_38px_rgba(207,250,254,0.22)]"
                style={rippleStyle}
                animate={{ scale: [0.8, 1.45, 0.8], opacity: [0.18, 0.42, 0.18] }}
                transition={{ duration: 2.6, ease: 'easeInOut', repeat: Infinity }}
            />
        </div>
    );
}
