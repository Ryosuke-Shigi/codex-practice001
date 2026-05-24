import { Head, Link } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';

import DirectionalNavigationButton from '@/Components/DirectionalNavigationButton';
import {
    defaultEffectName,
    effectLabels,
    effectNames,
    readPreferredEffectName,
    storePreferredEffectName,
    type EffectName,
} from '@/Components/Effects/EffectLayer';
import useSwipeNavigation from '@/Hooks/useSwipeNavigation';
import PublicLayout from '@/Layouts/PublicLayout';

function shouldIgnoreEffectKey(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    /*
     * Keyboard shortcuts should not steal arrow keys from real form controls.
     * Welcome has no form today, but this guard keeps the pattern safe if a
     * small input or select is added later.
     */
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
}

export default function Welcome() {
    /*
     * Welcome owns the switching interaction, while the selected effect is also
     * saved as a shared visual preference so START can carry it into Lab.
     */
    const [currentEffect, setCurrentEffect] = useState<EffectName>(
        () => readPreferredEffectName() ?? defaultEffectName,
    );

    const switchEffect = useCallback((direction: 1 | -1) => {
        setCurrentEffect((effect) => {
            const currentIndex = effectNames.indexOf(effect);
            const nextIndex = (currentIndex + direction + effectNames.length) % effectNames.length;

            return effectNames[nextIndex];
        });
    }, []);

    const showPreviousEffect = useCallback(() => {
        switchEffect(-1);
    }, [switchEffect]);

    const showNextEffect = useCallback(() => {
        switchEffect(1);
    }, [switchEffect]);

    useSwipeNavigation({
        onSwipeLeft: showNextEffect,
        onSwipeRight: showPreviousEffect,
    });

    useEffect(() => {
        /*
         * Persist after React accepts the state change, not inside switchEffect.
         * That keeps keyboard, button, and swipe changes on the same path and
         * avoids duplicating storage writes in each interaction handler.
         */
        storePreferredEffectName(currentEffect);
    }, [currentEffect]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (shouldIgnoreEffectKey(event.target)) {
                return;
            }

            if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
                return;
            }

            event.preventDefault();

            /*
             * Arrow keys, buttons, and swipe all call the same effect switching
             * functions. Navigation to /lab remains attached to START.
             */
            if (event.key === 'ArrowRight') {
                showNextEffect();
                return;
            }

            showPreviousEffect();
        };

        /*
         * Registering keydown in useEffect scopes the shortcut to Welcome's mount
         * lifetime. Cleanup matters because Inertia can move to /lab without a
         * full reload, and /lab should not keep this background-switch behavior.
         */
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [showNextEffect, showPreviousEffect]);

    return (
        <PublicLayout
            effect={currentEffect}
            effectIntensity="showcase"
            className="flex items-center justify-center px-6 py-10"
        >
            <Head title="Portfolio" />

            <section className="flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col items-center justify-end pb-[15vh] text-center sm:pb-[16vh]">
                <motion.div
                    className="mb-[16vh] sm:mb-[18vh]"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.38em] text-cyan-950/65 sm:text-sm">
                        AI Driven Portfolio
                    </p>
                    <h1 className="mt-4 text-5xl font-semibold text-white drop-shadow-[0_8px_28px_rgba(5,24,46,0.35)] sm:text-7xl">
                        Portfolio
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.8, ease: 'easeOut' }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Link
                        href="/lab"
                        className="group relative inline-flex min-h-[68px] min-w-[200px] items-center justify-center overflow-hidden rounded-full border border-white/60 bg-white/22 px-11 py-4 text-lg font-bold uppercase tracking-[0.26em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.78),inset_0_-18px_36px_rgba(18,99,131,0.24),0_20px_46px_rgba(2,35,63,0.34)] outline-none backdrop-blur-2xl transition duration-300 hover:bg-white/30 focus-visible:ring-4 focus-visible:ring-cyan-100/70 sm:min-h-[76px] sm:min-w-[232px] sm:text-xl"
                    >
                        {/*
                            Inertia Link keeps this as a client-side page visit
                            instead of a full reload, so the Laravel/Inertia shell
                            remains intact when moving from Welcome to Lab.
                        */}
                        <span className="absolute inset-x-5 top-2 h-5 rounded-full bg-white/35 blur-md transition duration-300 group-hover:bg-white/45" />
                        <span className="relative">START</span>
                    </Link>
                </motion.div>
            </section>

            <DirectionalNavigationButton
                direction="previous"
                ariaLabel="前の背景エフェクトへ切り替え"
                onClick={showPreviousEffect}
                className="bg-white/18 text-cyan-50 hover:bg-white/28"
            />

            <DirectionalNavigationButton
                direction="next"
                ariaLabel="次の背景エフェクトへ切り替え"
                onClick={showNextEffect}
                className="bg-white/18 text-cyan-50 hover:bg-white/28"
            />

            {/*
                A small status hint makes the effect state discoverable without
                turning the portfolio entrance into a settings panel. It is
                pointer-events-none because the actual controls are the keyboard
                shortcut and START button.
            */}
            <motion.div
                className="pointer-events-none fixed inset-x-0 bottom-5 z-20 flex justify-center px-4 text-center text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-cyan-50/72 sm:text-xs"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.6, ease: 'easeOut' }}
            >
                <div className="inline-flex max-w-full flex-col items-center gap-1 rounded-full border border-white/25 bg-slate-950/22 px-4 py-2 shadow-[0_12px_30px_rgba(2,24,45,0.18)] backdrop-blur-xl sm:flex-row sm:gap-3">
                    <span>{effectLabels[currentEffect]}</span>
                    <span className="hidden h-1 w-1 rounded-full bg-cyan-50/50 sm:block" />
                    <span>← / → / スワイプで背景切替</span>
                </div>
            </motion.div>
        </PublicLayout>
    );
}
