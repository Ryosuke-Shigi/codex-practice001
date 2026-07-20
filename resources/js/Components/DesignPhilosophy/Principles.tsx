import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import { principles } from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function Principles({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <section
            aria-labelledby={`design-philosophy-${section.key}`}
            className="px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28"
        >
            <div className="mx-auto w-full max-w-7xl min-w-0">
                <SectionHeading section={section} />

                <div className="mt-12 grid min-w-0 gap-4 lg:grid-cols-12">
                    {principles.map((principle, index) => (
                        <article
                            key={principle.title}
                            className={`min-w-0 rounded-[1.35rem] border border-black/10 bg-white/80 p-6 shadow-[0_10px_34px_rgba(36,37,30,0.06)] sm:p-7 ${
                                index === 0 || index === 3
                                    ? 'lg:col-span-7'
                                    : 'lg:col-span-5'
                            }`}
                        >
                            <span className="inline-grid h-11 w-11 place-items-center rounded-xl bg-[#f2df3a] text-sm font-black text-[#11120f]">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <h3 className="mt-7 break-words text-2xl font-black tracking-[-0.03em] [overflow-wrap:anywhere]">
                                {principle.title}
                            </h3>
                            <p className="mt-3 text-base leading-8 text-[#62635d]">
                                {principle.description}
                            </p>
                            <ul className="mt-5 flex min-w-0 flex-wrap gap-2">
                                {principle.details.map((detail) => (
                                    <li
                                        key={detail}
                                        className="max-w-full break-words rounded-lg border border-black/10 bg-[#f6f4ed] px-3 py-2 text-sm font-bold text-[#3d3e38] [overflow-wrap:anywhere]"
                                    >
                                        {detail}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
