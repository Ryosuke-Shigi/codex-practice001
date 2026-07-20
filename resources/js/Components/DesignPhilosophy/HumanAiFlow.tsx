import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import {
    contextSources,
    humanAiActors,
} from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function HumanAiFlow({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <section
            aria-labelledby={`design-philosophy-${section.key}`}
            className="bg-[#eeece3] px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28"
        >
            <div className="mx-auto w-full max-w-7xl min-w-0">
                <SectionHeading section={section} />

                <div className="mt-12 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-stretch">
                    {humanAiActors.map((actor, index) => (
                        <div key={actor.title} className="contents">
                            {index > 0 && (
                                <div
                                    aria-hidden="true"
                                    className="grid min-h-10 place-items-center text-3xl font-black text-[#a28f00] max-lg:rotate-90"
                                >
                                    →
                                </div>
                            )}
                            <article
                                className={`min-w-0 rounded-[1.35rem] border p-6 shadow-[0_12px_32px_rgba(36,37,30,0.06)] sm:p-7 ${
                                    actor.primary
                                        ? 'border-[#161713] bg-[#161713] text-[#f7f5ed]'
                                        : 'border-black/10 bg-white text-[#11120f]'
                                }`}
                            >
                                <p
                                    className={`text-xs font-black uppercase tracking-[0.14em] ${
                                        actor.primary
                                            ? 'text-[#f2df3a]'
                                            : 'text-[#655b00]'
                                    }`}
                                >
                                    {actor.label}
                                </p>
                                <h3 className="mt-3 break-words text-3xl font-black tracking-[-0.04em] [overflow-wrap:anywhere]">
                                    {actor.title}
                                </h3>
                                <p
                                    className={`mt-4 text-base leading-8 ${
                                        actor.primary
                                            ? 'text-[#c8cbc1]'
                                            : 'text-[#62635d]'
                                    }`}
                                >
                                    {actor.description}
                                </p>
                                <ul className="mt-5 grid gap-2 text-sm font-bold">
                                    {actor.responsibilities.map((item) => (
                                        <li key={item} className="flex gap-2">
                                            <span
                                                aria-hidden="true"
                                                className="text-[#b5a000]"
                                            >
                                                •
                                            </span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        </div>
                    ))}
                </div>

                <aside className="mt-7 min-w-0 rounded-[1.35rem] bg-[#252720] p-6 text-[#f7f5ed] sm:p-7">
                    <div className="grid min-w-0 gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
                        <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-[#f2df3a] text-sm font-black text-[#11120f]">
                            MD
                        </span>
                        <div className="min-w-0">
                            <h3 className="text-xl font-black">MD情報源の帯</h3>
                            <p className="mt-2 text-base leading-8 text-[#c8cbc1]">
                                誰が動いても、同じ正本・同じ境界・同じ停止条件へ到達させる。
                            </p>
                        </div>
                    </div>
                    <ul className="mt-5 flex min-w-0 flex-wrap gap-2">
                        {contextSources.map((source) => (
                            <li
                                key={source}
                                className="max-w-full break-words rounded-full border border-white/15 px-3 py-2 text-xs font-black text-[#f2df3a] [overflow-wrap:anywhere]"
                            >
                                {source}
                            </li>
                        ))}
                    </ul>
                </aside>
            </div>
        </section>
    );
}
