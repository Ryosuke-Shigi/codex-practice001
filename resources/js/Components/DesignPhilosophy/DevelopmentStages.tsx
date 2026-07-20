import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import { developmentStages } from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function DevelopmentStages({
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

                <ol className="mt-12 grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {developmentStages.map((stage, index) => (
                        <li
                            key={stage.key}
                            className={`relative min-w-0 overflow-hidden rounded-[1.35rem] border p-6 shadow-[0_12px_32px_rgba(36,37,30,0.06)] ${
                                stage.optional
                                    ? 'border-dashed border-[#b5a000] bg-gradient-to-b from-[#f2df3a]/15 to-white'
                                    : 'border-black/10 bg-white'
                            }`}
                        >
                            <span
                                aria-hidden="true"
                                className="absolute -bottom-10 right-0 text-[8rem] font-black leading-none text-black/[0.035]"
                            >
                                {index + 1}
                            </span>
                            <p className="relative inline-flex min-h-8 items-center rounded-full bg-[#f2df3a]/25 px-3 py-1 text-xs font-black tracking-[0.08em] text-[#3d3e38]">
                                {stage.label}
                            </p>
                            <h3 className="relative mt-6 break-words text-2xl font-black tracking-[-0.03em] [overflow-wrap:anywhere]">
                                {stage.key}
                            </h3>
                            <p className="relative mt-3 text-base leading-8 text-[#62635d]">
                                {stage.description}
                            </p>
                            <ul className="relative mt-5 grid gap-2 text-sm font-bold text-[#3d3e38]">
                                {stage.details.map((detail) => (
                                    <li key={detail} className="flex gap-2">
                                        <span aria-hidden="true" className="text-[#a28f00]">
                                            •
                                        </span>
                                        <span>{detail}</span>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ol>

                <p className="mt-7 border-l-[6px] border-[#d8c100] bg-[#f2df3a]/15 px-5 py-5 text-lg font-black leading-8 text-[#2d2e29] sm:px-6">
                    MOCKから引き継ぐのはコードではなく、確定したUI・導線・状態・入出力の契約。
                </p>
            </div>
        </section>
    );
}
