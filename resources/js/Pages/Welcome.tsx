/**
 * トップページの Page Component です。
 *
 * 公開入口の表示だけを担当し、Lab や各 PRODUCT 画面のデータ取得・業務判断はそれぞれの route / Page に分けます。
 */
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
     * Welcome は effect 選択の操作だけを担当します。
     * 選択結果は共有の見た目 preference として保存し、START 後の Lab でも同じ背景を引き継げるようにします。
     */
    const [currentEffect, setCurrentEffect] = useState<EffectName>(
        () => readPreferredEffectName() ?? defaultEffectName,
    );

    useEffect(() => {
        /*
         * React が state 変更を受け入れた後に保存します。
         * Welcome の操作は selector に限定し、Inertia で Lab へ移動した後も browser-local な選択を再利用します。
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

            <section className="relative h-full min-h-full w-full overflow-hidden px-6 text-center">
                {/*
                    selector は背景とタイトルの間に置きます。
                    操作可能ですが、title / START はより高い z-index にして入口画面の読み順を保ちます。
                */}
                <EffectPatternSelector
                    activeEffect={currentEffect}
                    onSelectEffect={setCurrentEffect}
                    className="z-10"
                />

                {/*
                    タイトルは画面中央で大きく固定します。
                    現在の effect 名は移動する orb ではなくここに表示し、orb が動いても選択状態を読み取れるようにします。
                */}
                <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 -translate-y-1/2 px-6 [@media(orientation:landscape)_and_(max-height:520px)]:top-[31%] [@media(orientation:landscape)_and_(max-height:520px)]:px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.38em] text-cyan-950/65 sm:text-sm [@media(orientation:landscape)_and_(max-height:520px)]:text-[0.68rem] [@media(orientation:landscape)_and_(max-height:520px)]:tracking-[0.24em]">
                            AI Driven Portfolio
                        </p>
                        <h1 className="mx-auto mt-3 max-w-full whitespace-nowrap text-[clamp(3.5rem,15vw,4.5rem)] font-semibold leading-[0.95] text-white drop-shadow-[0_10px_34px_rgba(5,24,46,0.38)] sm:text-[clamp(5.5rem,15vw,10rem)] lg:text-[10rem] [@media(orientation:landscape)_and_(max-height:520px)]:mt-2 [@media(orientation:landscape)_and_(max-height:520px)]:text-[clamp(3.25rem,10vw,4.75rem)]">
                            Portfolio
                        </h1>
                        <p className="mx-auto mt-5 max-w-full text-xs font-bold uppercase tracking-[0.28em] text-cyan-50/82 drop-shadow-[0_8px_22px_rgba(2,24,45,0.28)] sm:text-sm [@media(orientation:landscape)_and_(max-height:520px)]:mt-3 [@media(orientation:landscape)_and_(max-height:520px)]:text-[0.68rem] [@media(orientation:landscape)_and_(max-height:520px)]:tracking-[0.2em]">
                            Effect: {effectLabels[currentEffect]}
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    className="absolute inset-x-0 bottom-[10dvh] z-30 flex flex-col items-center justify-center gap-4 px-6 sm:bottom-[12dvh] [@media(orientation:landscape)_and_(max-height:520px)]:bottom-4 [@media(orientation:landscape)_and_(max-height:520px)]:gap-2"
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
                            href="/projects"
                            className="group relative inline-flex min-h-[68px] min-w-[200px] items-center justify-center overflow-hidden rounded-full border border-white/60 bg-white/22 px-11 py-4 text-lg font-bold uppercase tracking-[0.26em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.78),inset_0_-18px_36px_rgba(18,99,131,0.24),0_20px_46px_rgba(2,35,63,0.34)] outline-none backdrop-blur-2xl transition duration-300 hover:bg-white/30 focus-visible:ring-4 focus-visible:ring-cyan-100/70 sm:min-h-[76px] sm:min-w-[232px] sm:text-xl [@media(orientation:landscape)_and_(max-height:520px)]:min-h-[46px] [@media(orientation:landscape)_and_(max-height:520px)]:px-8 [@media(orientation:landscape)_and_(max-height:520px)]:py-2 [@media(orientation:landscape)_and_(max-height:520px)]:text-base"
                        >
                            {/*
                                Inertia Link により full reload ではなく client-side visit にします。
                                Welcome から Lab へ移動しても Laravel / Inertia shell を維持できます。
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
                            className="group relative inline-flex min-h-[54px] min-w-[200px] items-center justify-center overflow-hidden rounded-full border border-cyan-50/50 bg-cyan-950/24 px-9 py-3 text-base font-bold text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.46),0_14px_34px_rgba(2,35,63,0.24)] outline-none backdrop-blur-2xl transition duration-300 hover:bg-cyan-50/18 focus-visible:ring-4 focus-visible:ring-cyan-100/70 sm:min-w-[232px] sm:text-lg [@media(orientation:landscape)_and_(max-height:520px)]:min-h-[40px] [@media(orientation:landscape)_and_(max-height:520px)]:px-7 [@media(orientation:landscape)_and_(max-height:520px)]:py-2 [@media(orientation:landscape)_and_(max-height:520px)]:text-base"
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
