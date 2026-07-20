import { rebootSources } from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function UnderstandingReboot({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <section
            aria-labelledby={`design-philosophy-${section.key}`}
            className="px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28"
        >
            <div className="mx-auto grid w-full max-w-7xl min-w-0 gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
                <article className="min-w-0 rounded-[1.75rem] bg-gradient-to-br from-[#f2df3a] to-[#f5e973] p-7 sm:p-10">
                    <p className="flex items-center gap-3 text-xs font-black tracking-[0.16em] text-[#454329]">
                        <span
                            aria-hidden="true"
                            className="h-[3px] w-8 shrink-0 rounded-full bg-[#827500]"
                        />
                        {section.eyebrow}
                    </p>
                    <h2
                        id={`design-philosophy-${section.key}`}
                        className="mt-6 break-words text-[clamp(2.5rem,8vw,4.75rem)] font-black leading-[1.03] tracking-[-0.055em] text-[#11120f] [overflow-wrap:anywhere]"
                    >
                        {section.title}
                    </h2>
                    <p className="mt-6 text-lg font-black leading-8 text-[#2d2e29]">
                        {section.lead}
                    </p>
                    <p className="mt-4 text-base leading-8 text-[#3f403a]">
                        {section.body}
                    </p>
                </article>

                <aside className="min-w-0 rounded-[1.75rem] bg-[#161713] p-7 text-[#f7f5ed] sm:p-10">
                    <h3 className="text-2xl font-black">理解を残す場所</h3>
                    <ul className="mt-6 grid gap-3">
                        {rebootSources.map((source) => (
                            <li
                                key={source}
                                className="grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-3 text-base font-bold leading-7 text-[#d1d3cb]"
                            >
                                <span
                                    aria-hidden="true"
                                    className="inline-grid h-8 w-8 place-items-center rounded-lg bg-[#f2df3a] text-sm font-black text-[#11120f]"
                                >
                                    ✓
                                </span>
                                <span className="break-words [overflow-wrap:anywhere]">
                                    {source}
                                </span>
                            </li>
                        ))}
                    </ul>
                </aside>
            </div>
        </section>
    );
}
