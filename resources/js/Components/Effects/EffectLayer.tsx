import type { ComponentType } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import AquaParticlesBackground from '@/Components/Effects/AquaParticlesBackground';
import CausticsBackground from '@/Components/Effects/CausticsBackground';
import ColorShiftBackground from '@/Components/Effects/ColorShiftBackground';
import CursorRippleBackground from '@/Components/Effects/CursorRippleBackground';
import SurfaceShimmerBackground from '@/Components/Effects/SurfaceShimmerBackground';
import WaterBackground, {
    type WaterBackgroundIntensity,
} from '@/Components/Effects/WaterBackground';

export type EffectPatternPreview = {
    baseBackground: string;
    textureBackground: string;
    textureOpacity: number;
    highlightBackground: string;
};

type EffectPatternDefinition = {
    key: string;
    label: string;
    Component: ComponentType;
    preview: EffectPatternPreview;
};

/*
 * This list is the public background catalog. Add a new selectable effect here
 * with its real background component and compact preview data, and the Welcome
 * selector will automatically render one more orb. Keeping the catalog in
 * EffectLayer avoids page-level imports such as WaterBackground/Caustics in
 * Welcome, so pages only deal with EffectName values.
 */
export const effectPatterns = [
    {
        key: 'water',
        label: 'water',
        Component: WaterBackground,
        preview: {
            baseBackground:
                'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.9), rgba(165,243,252,0.58) 32%, rgba(14,116,144,0.48) 68%, rgba(8,47,73,0.72) 100%)',
            textureBackground:
                'repeating-radial-gradient(ellipse at 42% 45%, rgba(255,255,255,0.34) 0 2px, rgba(255,255,255,0) 3px 18px)',
            textureOpacity: 0.64,
            highlightBackground:
                'linear-gradient(120deg, rgba(255,255,255,0.64), rgba(255,255,255,0) 42%, rgba(103,232,249,0.32) 72%, rgba(255,255,255,0))',
        },
    },
    {
        key: 'caustics',
        label: 'caustics',
        Component: CausticsBackground,
        preview: {
            baseBackground:
                'linear-gradient(145deg, rgba(217,251,255,0.74), rgba(34,211,238,0.48) 42%, rgba(8,47,73,0.78) 100%)',
            textureBackground:
                'repeating-linear-gradient(112deg, rgba(255,255,255,0) 0 12px, rgba(255,255,255,0.64) 13px 15px, rgba(255,255,255,0) 18px 34px), repeating-linear-gradient(66deg, rgba(255,255,255,0) 0 16px, rgba(165,243,252,0.46) 18px 20px, rgba(255,255,255,0) 22px 42px)',
            textureOpacity: 0.74,
            highlightBackground:
                'radial-gradient(circle at 34% 26%, rgba(255,255,255,0.84), rgba(255,255,255,0) 34%)',
        },
    },
    {
        key: 'cursorRipple',
        label: 'cursorRipple',
        Component: CursorRippleBackground,
        preview: {
            baseBackground:
                'linear-gradient(150deg, rgba(199,251,255,0.72), rgba(45,212,191,0.46) 44%, rgba(6,25,54,0.82) 100%)',
            textureBackground:
                'radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0 22%, rgba(255,255,255,0.62) 23% 25%, rgba(255,255,255,0) 26% 42%, rgba(165,243,252,0.5) 43% 45%, rgba(255,255,255,0) 46%)',
            textureOpacity: 0.82,
            highlightBackground:
                'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.54), rgba(255,255,255,0) 52%)',
        },
    },
    {
        key: 'aquaParticles',
        label: 'AQUAParticles',
        Component: AquaParticlesBackground,
        preview: {
            /*
             * Preview data is CSS-only on purpose. The orb must be cheap and
             * circular, while the full background component can use a richer
             * layered animation when it is selected.
             */
            baseBackground:
                'linear-gradient(150deg, rgba(236,254,255,0.78), rgba(45,212,191,0.5) 42%, rgba(4,19,44,0.82) 100%)',
            textureBackground:
                'radial-gradient(circle at 28% 28%, rgba(255,255,255,0.82) 0 4px, rgba(255,255,255,0) 5px), radial-gradient(circle at 62% 42%, rgba(153,246,228,0.74) 0 5px, rgba(255,255,255,0) 6px), radial-gradient(circle at 46% 70%, rgba(125,211,252,0.7) 0 4px, rgba(255,255,255,0) 5px), radial-gradient(circle at 78% 68%, rgba(255,255,255,0.58) 0 3px, rgba(255,255,255,0) 4px)',
            textureOpacity: 0.82,
            highlightBackground:
                'radial-gradient(circle at 50% 38%, rgba(255,255,255,0.46), rgba(255,255,255,0) 48%)',
        },
    },
    {
        key: 'surfaceShimmer',
        label: 'surfaceShimmer',
        Component: SurfaceShimmerBackground,
        preview: {
            baseBackground:
                'linear-gradient(160deg, rgba(216,252,255,0.72), rgba(34,211,238,0.34) 42%, rgba(4,23,51,0.84) 100%)',
            textureBackground:
                'repeating-linear-gradient(96deg, rgba(255,255,255,0.68) 0 1px, rgba(255,255,255,0) 1px 11px), repeating-linear-gradient(4deg, rgba(255,255,255,0.22) 0 1px, rgba(255,255,255,0) 1px 25px)',
            textureOpacity: 0.58,
            highlightBackground:
                'linear-gradient(94deg, rgba(255,255,255,0), rgba(255,255,255,0.62) 48%, rgba(255,255,255,0))',
        },
    },
] as const satisfies readonly EffectPatternDefinition[];

export type EffectName = (typeof effectPatterns)[number]['key'];
export type EffectPattern = (typeof effectPatterns)[number];
export type EffectIntensity = WaterBackgroundIntensity;

export const defaultEffectName: EffectName = 'water';
export const effectNames = effectPatterns.map((pattern) => pattern.key) as EffectName[];

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

export function resolveEffectName(value: unknown): EffectName {
    return isEffectName(value) ? value : defaultEffectName;
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
        return storedEffect === null ? null : resolveEffectName(storedEffect);
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

export const effectLabels = effectPatterns.reduce(
    (labels, pattern) => ({
        ...labels,
        [pattern.key]: pattern.label,
    }),
    {} as Record<EffectName, string>,
);

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
    const resolvedEffect = resolveEffectName(effect);
    const activePattern = effectPatterns.find((pattern) => pattern.key === resolvedEffect) ?? effectPatterns[0];
    const Effect = activePattern.Component;
    const effectZIndex = resolvedEffect === 'cursorRipple' ? 'z-20' : 'z-10';

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
                    key={resolvedEffect}
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
                    {resolvedEffect === 'water' ? (
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
