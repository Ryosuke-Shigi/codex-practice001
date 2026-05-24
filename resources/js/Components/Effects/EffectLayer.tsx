import type { ComponentType } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import CausticsBackground from '@/Components/Effects/CausticsBackground';
import ColorShiftBackground from '@/Components/Effects/ColorShiftBackground';
import CursorRippleBackground from '@/Components/Effects/CursorRippleBackground';
import FloatingLightBackground from '@/Components/Effects/FloatingLightBackground';
import NoneBackground from '@/Components/Effects/NoneBackground';
import SurfaceShimmerBackground from '@/Components/Effects/SurfaceShimmerBackground';
import WaterBackground, {
    type WaterBackgroundIntensity,
} from '@/Components/Effects/WaterBackground';

export const effectNames = [
    'water',
    'caustics',
    'cursorRipple',
    'floatingLight',
    'surfaceShimmer',
    'none',
] as const;

export type EffectName = (typeof effectNames)[number];
export type EffectIntensity = WaterBackgroundIntensity;

export const defaultEffectName: EffectName = 'water';

/*
 * Welcome is the only page with explicit effect-switch controls, but START is a
 * normal Inertia navigation. sessionStorage gives the public layout a small
 * browser-local preference so the selected title effect can continue into Lab
 * without adding query parameters, backend props, or page-specific effect code.
 */
const effectPreferenceStorageKey = 'portfolio.backgroundEffect';

export function isEffectName(value: unknown): value is EffectName {
    return typeof value === 'string' && effectNames.includes(value as EffectName);
}

export function readPreferredEffectName(): EffectName | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const storedEffect = window.sessionStorage.getItem(effectPreferenceStorageKey);

        /*
         * Stored values are outside React's type system. Validate against the
         * canonical effectNames list so stale browser data cannot ask
         * EffectLayer to render a component that does not exist anymore.
         */
        return isEffectName(storedEffect) ? storedEffect : null;
    } catch {
        return null;
    }
}

export function storePreferredEffectName(effect: EffectName) {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.sessionStorage.setItem(effectPreferenceStorageKey, effect);
    } catch {
        /*
         * The background choice is decorative. Private browsing, storage quotas,
         * or blocked storage should only drop the preference, never block START
         * navigation or the page's real content.
         */
    }
}

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
    effectIntensity?: EffectIntensity;
};

/*
 * EffectLayer is the single entrance to the background system. Pages pass an
 * effect name, and this component decides which concrete effect component to
 * render. That keeps page files focused on UI/state instead of importing every
 * visual experiment directly.
 */
export default function EffectLayer({
    effect = 'water',
    effectIntensity = 'subtle',
}: EffectLayerProps) {
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
                    {/*
                        Water has strength variants because the same water
                        direction must serve both title/entry screens and dense
                        practical screens. Other effects currently expose only
                        one tuned presentation, so they render through the shared
                        effect map without extra page-level branching.
                    */}
                    {effect === 'water' ? (
                        <WaterBackground intensity={effectIntensity} />
                    ) : (
                        <Effect />
                    )}
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
