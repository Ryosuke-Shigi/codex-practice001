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
 * 公開ページ用背景の catalog です。
 * 選択可能な effect は実 background component と小さな preview data をここへ追加します。
 * Welcome 側は EffectName だけを扱い、WaterBackground や CausticsBackground などの
 * 実 component import を page file へ広げないようにします。
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
             * preview data は意図的に CSS-only にしています。
             * orb は軽量な円形 preview に留め、選択時の本体 component だけが豊かな layer animation を持ちます。
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
 * effect の明示的な切替 UI は Welcome だけが持ちます。
 * START は通常の Inertia navigation なので、sessionStorage に browser-local な preference を置き、
 * query parameter、backend props、page 固有 effect code を増やさず Lab へ選択を引き継ぎます。
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
         * 保存値は React の型システム外にあります。
         * canonical な effectNames で検証し、古い browser data が存在しない component 描画を要求しないようにします。
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
         * 背景選択は装飾設定です。
         * private browsing、storage quota、storage block では preference を失うだけにし、
         * START navigation やページ本体の表示は止めません。
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
 * EffectLayer は背景システムの単一入口です。
 * page は effect name だけを渡し、どの concrete effect component を描画するかはここで決めます。
 * page file は UI / state に集中し、背景実験の import を直接持たないようにします。
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
         * layer 順序:
         * - ColorShiftBackground: z-0、最背面の色面として常時表示
         * - active effect: z-10、cursor-responsive layer のみ z-20
         * - readability veil: z-20、文字用の控えめな contrast 補助
         * - PublicLayout children: z-30
         *
         * pointer-events-none により stack 全体を visual-only にし、effect が viewport を覆っても
         * START や Lab card を click できる状態にします。
         */
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-slate-950">
            <ColorShiftBackground />

            <AnimatePresence mode="wait" initial={false}>
                {/*
                    effect 変更時に key も変わるため、AnimatePresence が旧 layer を fade out してから
                    新 layer を fade in できます。opacity だけの遷移にして、画面全体の flash を避けます。
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
                        Water はタイトル/入口画面と情報量の多い実用画面の両方で使うため strength variant を持ちます。
                        他の effect は現時点で tuned presentation が1つなので、page 側の分岐を増やさず共通 map から描画します。
                    */}
                    {resolvedEffect === 'water' ? (
                        <WaterBackground intensity={effectIntensity} />
                    ) : (
                        <Effect />
                    )}
                </motion.div>
            </AnimatePresence>

            {/*
                veil は visual effect より上、実 page content より下に置きます。
                遅い色変化を見せつつ、白文字、START、Lab card の読みやすさを保ちます。
            */}
            <div className="absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.24),rgba(255,255,255,0)_42%),linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_34%,rgba(1,8,23,0.52)_100%)]" />
            <div className="absolute inset-0 z-20 bg-slate-950/10" />
        </div>
    );
}
