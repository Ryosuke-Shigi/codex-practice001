import { Head, Link } from '@inertiajs/react';
import { motion } from 'motion/react';

import PublicLayout from '@/Layouts/PublicLayout';

export default function Welcome() {
    return (
        <PublicLayout className="flex items-center justify-center px-6 py-10">
            <Head title="Welcome" />

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
                        Into the Lab
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
                        <span className="absolute inset-x-5 top-2 h-5 rounded-full bg-white/35 blur-md transition duration-300 group-hover:bg-white/45" />
                        <span className="relative">START</span>
                    </Link>
                </motion.div>
            </section>
        </PublicLayout>
    );
}
