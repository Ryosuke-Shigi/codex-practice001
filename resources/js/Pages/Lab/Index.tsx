import { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'motion/react';

import PublicLayout from '@/Layouts/PublicLayout';

type LabCategory = 'PROJECT' | 'MOCK' | 'PP';

type LabExperiment = {
    id: string;
    title: string;
    summary: string;
    status: string;
    category: LabCategory;
    href?: string;
};

type LabIndexProps = {
    experiments: LabExperiment[];
};

const labCategories: {
    key: LabCategory;
    title: string;
    description: string;
}[] = [
    {
        key: 'PROJECT',
        title: '本番寄りのポートフォリオ',
        description:
            '実データ、DB、API、保存処理、同期処理などを持つ完成寄りのページです。',
    },
    {
        key: 'MOCK',
        title: '見た目確認用モック',
        description:
            'UI、操作感、画面遷移、業務フローを仮データで確認するためのページです。',
    },
    {
        key: 'PP',
        title: 'Presentation Page',
        description:
            '構想、設計思想、画面イメージ、システム案を説明・検討するためのページです。',
    },
];

export default function Index({ experiments }: LabIndexProps) {
    const [selectedCategory, setSelectedCategory] =
        useState<LabCategory>('PROJECT');

    // カテゴリごとの入口説明だけをここで持ち、カード本体の定義は Inertia prop 側に寄せます。
    const selectedCategoryDefinition =
        labCategories.find((category) => category.key === selectedCategory) ??
        labCategories[0];

    // Lab は入口整理が目的なので、選択カテゴリに一致するカードだけを表示します。
    const filteredExperiments = useMemo(
        () =>
            experiments.filter(
                (experiment) => experiment.category === selectedCategory,
            ),
        [experiments, selectedCategory],
    );

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
                            Lab / Portfolio
                        </h1>
                        <p className="mt-5 max-w-2xl text-sm leading-7 text-cyan-50/90 sm:text-base">
                            本番寄りのPROJECT、見た目確認用のMOCK、構想説明用のPPを切り替えて確認できます。
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {labCategories.map((category) => {
                            const isSelected =
                                selectedCategory === category.key;

                            return (
                                <button
                                    key={category.key}
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() =>
                                        setSelectedCategory(category.key)
                                    }
                                    className={[
                                        'min-h-[52px] rounded-2xl border px-5 py-3 text-center text-sm font-semibold tracking-[0.12em] shadow-[0_14px_32px_rgba(2,24,45,0.18)] backdrop-blur-xl transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/70',
                                        isSelected
                                            ? 'border-white/70 bg-white/85 text-cyan-950'
                                            : 'border-white/30 bg-white/14 text-white hover:bg-white/24',
                                    ].join(' ')}
                                >
                                    {category.key}
                                </button>
                            );
                        })}
                    </div>

                    <motion.div
                        key={selectedCategory}
                        className="rounded-[1.5rem] border border-white/35 bg-white/16 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_18px_42px_rgba(2,24,45,0.2)] backdrop-blur-2xl sm:p-6"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                            {selectedCategory}
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold text-white">
                            {selectedCategoryDefinition.title}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-cyan-50/90">
                            {selectedCategoryDefinition.description}
                        </p>
                    </motion.div>

                    {/*
                        experiments は routes/web.php から渡される Inertia prop です。
                        現在は将来 DB 取得へ置き換える前提の仮データで、固定配列を
                        完成扱いにしないため、カードUIとデータ取得元を分けて考えます。
                    */}
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                        {filteredExperiments.map((experiment, index) => {
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
                                                {experiment.href ? '開く' : '準備中'}
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
