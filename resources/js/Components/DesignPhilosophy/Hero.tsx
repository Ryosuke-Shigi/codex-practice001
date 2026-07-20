import { heroKeywords } from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function Hero({ section }: { section: DesignPhilosophySection }) {
    const [titlePrefix, ...titleRest] = section.title.split(' ');
    const highlightedTitle = titleRest.join(' ');

    return (
        <header
            aria-labelledby="design-philosophy-hero"
            className="relative isolate overflow-hidden px-5 py-16 sm:px-8 sm:py-24 lg:px-10 lg:py-32 [@media(orientation:landscape)_and_(max-height:560px)]:py-12"
        >
            <div
                aria-hidden="true"
                className="absolute -right-36 bottom-0 -z-10 h-[28rem] w-[28rem] rounded-full border border-black/10 shadow-[inset_0_0_0_70px_rgba(255,255,255,0.22),inset_0_0_0_140px_rgba(242,223,58,0.08)] sm:-right-24 lg:right-[-4rem] lg:h-[38rem] lg:w-[38rem]"
            />

            <div className="mx-auto grid w-full max-w-7xl min-w-0 gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-center lg:gap-14">
                <div className="min-w-0">
                    <p className="flex items-center gap-3 text-xs font-black tracking-[0.16em] text-[#4d4f47] sm:text-sm">
                        <span
                            aria-hidden="true"
                            className="h-[3px] w-8 shrink-0 rounded-full bg-[#d8c100]"
                        />
                        {section.eyebrow}
                    </p>
                    <h1
                        id="design-philosophy-hero"
                        className="mt-6 max-w-5xl break-words text-[clamp(3rem,11vw,7.5rem)] font-black leading-[0.98] tracking-[-0.065em] text-[#11120f] [overflow-wrap:anywhere]"
                    >
                        {titlePrefix}{' '}
                        <span className="relative mt-1 inline-block px-[0.03em]">
                            <span className="relative z-10">
                                {highlightedTitle}
                            </span>
                            <span
                                aria-hidden="true"
                                className="absolute inset-x-0 bottom-[0.08em] h-[0.25em] -rotate-1 rounded-full bg-[#f2df3a]"
                            />
                        </span>
                    </h1>
                    <p className="mt-8 max-w-3xl text-lg font-bold leading-9 text-[#383a34] sm:text-xl">
                        {section.lead}
                    </p>
                    <ul
                        aria-label="設計思想のキーワード"
                        className="mt-8 flex min-w-0 flex-wrap gap-2.5"
                    >
                        {heroKeywords.map((keyword) => (
                            <li
                                key={keyword}
                                className="max-w-full break-words rounded-full border border-black/15 bg-white/75 px-3 py-2 text-xs font-black text-[#40413c] shadow-sm [overflow-wrap:anywhere] sm:text-sm"
                            >
                                {keyword}
                            </li>
                        ))}
                    </ul>
                </div>

                <aside className="relative min-w-0 overflow-hidden rounded-[1.75rem] bg-[#161713] p-6 text-[#f7f5ed] shadow-[0_22px_60px_rgba(38,38,27,0.16)] sm:p-8 lg:rotate-1">
                    <span
                        aria-hidden="true"
                        className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[#f2df3a]"
                    />
                    <p className="relative z-10 text-xs font-black uppercase tracking-[0.16em] text-[#f2df3a]">
                        Core statement
                    </p>
                    <p className="relative z-10 mt-4 break-words text-2xl font-black leading-relaxed [overflow-wrap:anywhere] sm:text-3xl">
                        人間が目的と境界を設計する。
                        <br />
                        AIが境界内で反復する。
                        <br />
                        結果を理解再起動可能な形で残す。
                    </p>
                    <p className="relative z-10 mt-6 text-base leading-8 text-[#c8cbc1]">
                        {section.body}
                    </p>
                </aside>
            </div>
        </header>
    );
}
