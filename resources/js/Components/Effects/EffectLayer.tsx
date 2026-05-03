import type { ComponentType } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import CausticsBackground from '@/Components/Effects/CausticsBackground';
import ColorShiftBackground from '@/Components/Effects/ColorShiftBackground';
import CursorRippleBackground from '@/Components/Effects/CursorRippleBackground';
import FloatingLightBackground from '@/Components/Effects/FloatingLightBackground';
import NoneBackground from '@/Components/Effects/NoneBackground';
import SurfaceShimmerBackground from '@/Components/Effects/SurfaceShimmerBackground';
import WaterBackground from '@/Components/Effects/WaterBackground';

export const effectNames = [
    'water',
    'caustics',
    'cursorRipple',
    'floatingLight',
    'surfaceShimmer',
    'none',
] as const;

export type EffectName = (typeof effectNames)[number];

export const effectLabels: Record<EffectName, string> = {
    water: 'water',
    caustics: 'caustics',
    cursorRipple: 'cursorRipple',
    floatingLight: 'floatingLight',
    surfaceShimmer: 'surfaceShimmer',
    none: 'none',
};

const effectComponents: Record<EffectName, ComponentType> = {
    water: WaterBackground,
    caustics: CausticsBackground,
    cursorRipple: CursorRippleBackground,
    floatingLight: FloatingLightBackground,
    surfaceShimmer: SurfaceShimmerBackground,
    none: NoneBackground,
};

type EffectLayerProps = {
    effect?: EffectName;
};

/*
 * EffectLayer is the single entrance to the background system. Pages pass an
 * effect name, and this component decides which concrete effect component to
 * render. That keeps page files focused on UI/state instead of importing every
 * visual experiment directly.
 */
export default function EffectLayer({ effect = 'water' }: EffectLayerProps) {
    const Effect = effectComponents[effect];
    const effectZIndex = effect === 'cursorRipple' ? 'z-20' : 'z-10';

    return (
        /*
         * Layer order:
         * - ColorShiftBackground: z-0, always visible as the deepest color wash
         * - active effect: z-10, or z-20 for the cursor-responsive layer
         * - readability veil: z-20, subtle contrast support for text
         * - PublicLayout children: z-30
         *
         * pointer-events-none makes the entire stack visual-only, so START and
         * Lab cards remain clickable even when effects fill the viewport.
         */
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-slate-950">
            <ColorShiftBackground />

            <AnimatePresence mode="wait" initial={false}>
                {/*
                    The key changes when effect changes, so AnimatePresence can
                    fade the old layer out before fading the new one in. A simple
                    opacity transition teaches the switching flow without making
                    the whole page flash.
                */}
                <motion.div
                    key={effect}
                    className={`absolute inset-0 ${effectZIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: 'easeInOut' }}
                >
                    <Effect />
                </motion.div>
            </AnimatePresence>

            {/*
                The veil sits above visual effects but below real page content.
                It keeps white text, START, and Lab cards readable while still
                letting the slow color shift show through.
            */}
            <div className="absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.24),rgba(255,255,255,0)_42%),linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_34%,rgba(1,8,23,0.52)_100%)]" />
            <div className="absolute inset-0 z-20 bg-slate-950/10" />
        </div>
    );
}
