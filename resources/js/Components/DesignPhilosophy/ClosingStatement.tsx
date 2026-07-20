import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function ClosingStatement({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <footer
            aria-labelledby={`design-philosophy-${section.key}`}
            className="px-5 pb-20 pt-8 sm:px-8 sm:pb-24 lg:px-10 lg:pb-28"
        >
            <div className="mx-auto w-full max-w-7xl min-w-0 rounded-[1.75rem] border border-black/10 bg-white/80 p-7 text-center shadow-[0_18px_60px_rgba(38,38,27,0.10)] sm:p-10 lg:p-14">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#52534d]">
                    {section.eyebrow}
                </p>
                <h2
                    id={`design-philosophy-${section.key}`}
                    className="mx-auto mt-5 max-w-5xl break-words text-[clamp(2rem,6vw,3.75rem)] font-black leading-[1.3] tracking-[-0.045em] text-[#11120f] [overflow-wrap:anywhere]"
                >
                    {section.title}
                </h2>
                <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-[#62635d] sm:text-lg">
                    {section.body}
                </p>
            </div>
        </footer>
    );
}
