import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

import {
    defaultEffectName,
    effectLabels,
    readPreferredEffectName,
    storePreferredEffectName,
    type EffectName,
} from '@/Components/Effects/EffectLayer';
import EffectPatternSelector from '@/Components/Effects/EffectPatternSelector';
import PublicLayout from '@/Layouts/PublicLayout';

export default function Welcome() {
    /*
     * Welcome owns the selection interaction, while the selected effect is also
     * saved as a shared visual preference so START can carry it into Lab.
     */
    const [currentEffect, setCurrentEffect] = useState<EffectName>(
        () => readPreferredEffectName() ?? defaultEffectName,
    );

    useEffect(() => {
        /*
         * Persist after React accepts the state change. The selector is the only
         * Welcome interaction now, and START can reuse this browser-local choice
         * after the Inertia visit to Lab.
         */
        storePreferredEffectName(currentEffect);
    }, [currentEffect]);

    return (
        <PublicLayout
            effect={currentEffect}
            effectIntensity="showcase"
            className="h-dvh w-screen overflow-hidden"
        >
            <Head title="Portfolio" />

            <section className="relative h-full w-full overflow-hidden px-6 text-center">
                {/*
                    The selector sits between the background and the title. It is
                    interactive, but title/START remain higher z-index targets so
                    the entrance screen keeps its primary reading order.
                */}
                <EffectPatternSelector
                    activeEffect={currentEffect}
                    onSelectEffect={setCurrentEffect}
                    className="z-10"
                />

                {/*
                    Keep the title physically centered and large. The current
                    effect name is shown here rather than on the moving orb layer
                    so the selected state remains readable while the orbs drift.
                */}
                <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 -translate-y-1/2 px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.38em] text-cyan-950/65 sm:text-sm">
                            AI Driven Portfolio
                        </p>
                        <h1 className="mt-3 text-7xl font-semibold leading-none text-white drop-shadow-[0_10px_34px_rgba(5,24,46,0.38)] sm:text-9xl lg:text-[10rem]">
                            Portfolio
                        </h1>
                        <p className="mt-5 text-xs font-bold uppercase tracking-[0.28em] text-cyan-50/82 drop-shadow-[0_8px_22px_rgba(2,24,45,0.28)] sm:text-sm">
                            Effect: {effectLabels[currentEffect]}
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    className="absolute inset-x-0 bottom-[10dvh] z-30 flex flex-col items-center justify-center gap-4 px-6 sm:bottom-[12dvh]"
                    initial={{ opacity: 0, scale: 0.94, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.8, ease: 'easeOut' }}
                >
                    {/*
                        START と設計思想は、PC幅でも横並びにしない導線です。
                        motion の hover / tap は各ボタンに分け、親は縦積みレイアウトだけを担当します。
                    */}
                    <motion.div
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

                    <motion.div
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Link
                            href="/design-philosophy"
                            className="group relative inline-flex min-h-[54px] min-w-[200px] items-center justify-center overflow-hidden rounded-full border border-cyan-50/50 bg-cyan-950/24 px-9 py-3 text-base font-bold text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.46),0_14px_34px_rgba(2,35,63,0.24)] outline-none backdrop-blur-2xl transition duration-300 hover:bg-cyan-50/18 focus-visible:ring-4 focus-visible:ring-cyan-100/70 sm:min-w-[232px] sm:text-lg"
                        >
                            <span className="absolute inset-x-5 top-2 h-4 rounded-full bg-white/20 blur-md transition duration-300 group-hover:bg-white/30" />
                            <span className="relative">設計思想</span>
                        </Link>
                    </motion.div>
                </motion.div>
            </section>
        </PublicLayout>
    );
}
