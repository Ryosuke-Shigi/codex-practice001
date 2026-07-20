import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import { engineeringLoopSteps } from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function EngineeringLoop({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <section
            aria-labelledby={`design-philosophy-${section.key}`}
            className="bg-[#161713] px-5 py-20 text-[#f7f5ed] sm:px-8 sm:py-24 lg:px-10 lg:py-28"
        >
            <div className="mx-auto w-full max-w-7xl min-w-0">
                <SectionHeading section={section} theme="dark" />

                <ol
                    aria-label="ループエンジニアリングの流れ"
                    className="mt-12 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-5"
                >
                    {engineeringLoopSteps.map((step, index) => (
                        <li
                            key={step.title}
                            className="relative grid min-h-40 min-w-0 place-items-center rounded-[1.35rem] border border-white/15 bg-white/[0.055] p-6 text-center xl:rounded-full"
                        >
                            <div>
                                <p className="text-sm font-black text-[#f2df3a]">
                                    {String(index + 1).padStart(2, '0')}
                                </p>
                                <h3 className="mt-2 text-xl font-black">
                                    {step.title}
                                </h3>
                                <p className="mt-2 text-sm leading-7 text-[#c8cbc1]">
                                    {step.description}
                                </p>
                            </div>
                            {index < engineeringLoopSteps.length - 1 && (
                                <span
                                    aria-hidden="true"
                                    className="absolute -right-[1.35rem] top-1/2 hidden -translate-y-1/2 text-2xl font-black text-[#f2df3a] xl:block"
                                >
                                    →
                                </span>
                            )}
                        </li>
                    ))}
                </ol>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                    <p className="rounded-[1.1rem] border border-white/15 bg-white/[0.045] p-5 text-base leading-8 text-[#d4d6ce]">
                        問題があれば設計または実装へ戻し、初回出力を完成扱いしません。
                    </p>
                    <p className="rounded-[1.1rem] border border-[#f2df3a]/35 bg-[#f2df3a]/10 p-5 text-base leading-8 text-[#e2e3dc]">
                        同じ原因の無変更再実行は行わず、入力・設計・差分・環境・検証方法が変わった場合だけ再実行します。
                    </p>
                </div>
            </div>
        </section>
    );
}
