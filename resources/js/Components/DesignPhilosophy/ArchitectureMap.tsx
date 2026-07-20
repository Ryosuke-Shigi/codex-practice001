import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import { architectureLayers } from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function ArchitectureMap({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <section
            aria-labelledby={`design-philosophy-${section.key}`}
            className="relative isolate overflow-hidden bg-[#161713] px-5 py-20 text-[#f7f5ed] sm:px-8 sm:py-24 lg:px-10 lg:py-28"
        >
            <div
                aria-hidden="true"
                className="absolute -left-[22rem] top-24 -z-10 h-[42rem] w-[42rem] rounded-full border border-[#f2df3a]/15 shadow-[inset_0_0_0_80px_rgba(242,223,58,0.035),inset_0_0_0_160px_rgba(242,223,58,0.02)]"
            />
            <div className="mx-auto w-full max-w-7xl min-w-0">
                <SectionHeading section={section} theme="dark" />

                <p className="mt-8 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-[#f2df3a]/35 bg-[#f2df3a]/10 px-4 py-2 text-sm font-black text-[#f2df3a]">
                    <span>ADR Pattern</span>
                    <span aria-hidden="true">=</span>
                    <span>Action - Domain - Responder</span>
                </p>

                <div
                    aria-label="Action Domain Responderの責務図"
                    className="mt-8 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-stretch"
                >
                    {architectureLayers.map((layer, index) => (
                        <div key={layer.key} className="contents">
                            {index > 0 && (
                                <div
                                    aria-hidden="true"
                                    className="grid min-h-10 place-items-center text-3xl font-black text-[#f2df3a] max-lg:rotate-90"
                                >
                                    →
                                </div>
                            )}
                            <article className="flex min-w-0 flex-col rounded-[1.35rem] border border-white/15 bg-white/[0.055] p-6 sm:p-7">
                                <p className="text-sm font-black uppercase tracking-[0.14em] text-[#f2df3a]">
                                    {layer.key}
                                </p>
                                <h3 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                                    {layer.title}
                                </h3>
                                <p className="mt-4 text-base leading-8 text-[#c8cbc1]">
                                    {layer.description}
                                </p>
                                <ul className="mt-6 grid gap-2 lg:mt-auto lg:pt-6">
                                    {layer.responsibilities.map((item) => (
                                        <li
                                            key={item}
                                            className="break-words rounded-lg bg-white/[0.07] px-3 py-2.5 text-sm font-bold text-[#efefe9] [overflow-wrap:anywhere]"
                                        >
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        </div>
                    ))}
                </div>

                <aside className="mt-6 grid min-w-0 gap-5 rounded-[1.35rem] border border-[#f2df3a]/35 bg-[#f2df3a]/10 p-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
                    <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-[#f2df3a] text-sm font-black text-[#11120f]">
                        DTO
                    </span>
                    <div className="min-w-0">
                        <h3 className="text-xl font-black">DTOは、層と層の境界線</h3>
                        <p className="mt-2 text-base leading-8 text-[#d4d6ce]">
                            DTOはデータだけを運び、業務判断・DB操作・Service・Repository・Containerを持ちません。人間とAIの双方に入力と出力を明示します。
                        </p>
                    </div>
                </aside>
            </div>
        </section>
    );
}
