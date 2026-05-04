import { Head, Link } from '@inertiajs/react';
import { motion } from 'motion/react';

import PublicLayout from '@/Layouts/PublicLayout';

type LabExperiment = {
    id: string;
    title: string;
    summary: string;
    status: string;
    href?: string;
};

type LabIndexProps = {
    experiments: LabExperiment[];
};

export default function Index({ experiments }: LabIndexProps) {
    return (
        /*
            Lab uses PublicLayout for the same public background stack, but it
            does not pass an effect prop or register key handlers. The left/right
            switching demo belongs to Welcome only, so this list page stays
            focused on showing experiments.
        */
        <PublicLayout className="px-5 py-8 sm:px-8 lg:px-10">
            <Head title="Portfolio" />

            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 pb-14 pt-4 sm:pt-8">
                <header className="flex items-center justify-between gap-4">
                    <Link
                        href="/"
                        className="rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(2,24,45,0.18)] backdrop-blur-xl transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/70"
                    >
                        Portfolio
                    </Link>
                    <span className="rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-950/70 backdrop-blur-xl">
                        Preview
                    </span>
                </header>

                <section className="flex flex-1 flex-col justify-center gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.75, ease: 'easeOut' }}
                    >
                        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-950/70">
                            Lab Index
                        </p>
                        <h1 className="mt-3 text-4xl font-semibold text-white drop-shadow-[0_8px_26px_rgba(3,25,48,0.35)] sm:text-6xl">
                            Experiments
                        </h1>
                    </motion.div>

                    {/*
                        experiments は routes/web.php から渡される Inertia prop です。
                        現在は将来 DB 取得へ置き換える前提の仮データで、固定配列を
                        完成扱いにしないため、カードUIとデータ取得元を分けて考えます。
                    */}
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                        {experiments.map((experiment, index) => {
                            const card = (
                                <motion.article
                                    className="h-full min-h-[230px] rounded-[2rem] border border-white/35 bg-slate-950/36 p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_22px_48px_rgba(2,24,45,0.26)] backdrop-blur-2xl"
                                    initial={{ opacity: 0, y: 22 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: index * 0.08,
                                        duration: 0.65,
                                        ease: 'easeOut',
                                    }}
                                    whileHover={{ y: -5 }}
                                >
                                    <div className="flex h-full flex-col justify-between gap-8">
                                        <div>
                                            <span className="inline-flex rounded-full border border-cyan-100/45 bg-cyan-50/20 px-3 py-1 text-xs font-semibold text-cyan-50">
                                                {experiment.status}
                                            </span>
                                            <h2 className="mt-5 text-2xl font-semibold leading-tight text-white">
                                                {experiment.title}
                                            </h2>
                                        </div>

                                        <div>
                                            <p className="text-sm leading-7 text-cyan-50/90">
                                                {experiment.summary}
                                            </p>
                                            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/70">
                                                {experiment.href ? '開く' : '詳細ページ未実装'}
                                            </p>
                                        </div>
                                    </div>
                                </motion.article>
                            );

                            if (experiment.href) {
                                return (
                                    <Link
                                        key={experiment.id}
                                        href={experiment.href}
                                        className="block h-full rounded-[2rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/70"
                                    >
                                        {card}
                                    </Link>
                                );
                            }

                            return <div key={experiment.id}>{card}</div>;
                        })}
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
