import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';

type PointerPosition = {
    x: number;
    y: number;
};

export default function CursorRippleBackground() {
    /*
     * This effect owns only the cursor-responsive ripple position. React state is
     * enough here because the visual state is tiny, and Motion can turn that
     * state into a soft animated highlight without involving jquery.ripples.
     */
    const [position, setPosition] = useState<PointerPosition>({ x: 50, y: 48 });
    const frameRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        /*
         * The outer EffectLayer has pointer-events-none so it never blocks clicks.
         * Listening on window lets the ripple follow pointer movement as a visual
         * response while normal UI elements keep receiving the actual interaction.
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
