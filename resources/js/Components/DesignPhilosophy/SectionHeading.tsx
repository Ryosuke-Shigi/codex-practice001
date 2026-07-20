import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

type SectionHeadingProps = {
    section: DesignPhilosophySection;
    theme?: 'light' | 'dark';
};

export default function SectionHeading({
    section,
    theme = 'light',
}: SectionHeadingProps) {
    const dark = theme === 'dark';

    return (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-end lg:gap-12">
            <div className="min-w-0">
                <p
                    className={`flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] ${
                        dark ? 'text-[#f2df3a]' : 'text-[#4d4f47]'
                    }`}
                >
                    <span
                        aria-hidden="true"
                        className="h-[3px] w-8 shrink-0 rounded-full bg-[#d8c100]"
                    />
                    {section.eyebrow}
                </p>
                <h2
                    id={`design-philosophy-${section.key}`}
                    className={`mt-5 break-words text-[clamp(2.25rem,7vw,4.75rem)] font-black leading-[1.05] tracking-[-0.055em] [overflow-wrap:anywhere] ${
                        dark ? 'text-[#f7f5ed]' : 'text-[#11120f]'
                    }`}
                >
                    {section.title}
                </h2>
            </div>

            <div className="min-w-0 space-y-4">
                <p
                    className={`break-words text-lg font-bold leading-8 [overflow-wrap:anywhere] ${
                        dark ? 'text-[#f0efe7]' : 'text-[#30312c]'
                    }`}
                >
                    {section.lead}
                </p>
                <p
                    className={`break-words text-base leading-8 [overflow-wrap:anywhere] ${
                        dark ? 'text-[#c8cbc1]' : 'text-[#62635d]'
                    }`}
                >
                    {section.body}
                </p>
            </div>
        </div>
    );
}
