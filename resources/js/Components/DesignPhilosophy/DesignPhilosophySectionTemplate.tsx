/**
 * Design Philosophy セクションを表示する template Component です。
 *
 * DTO 由来 props の表示だけを担当し、section の有効判定や並び順は backend 側へ分けます。
 */
import {
    BookOpen,
    Bot,
    Compass,
    Milestone,
    Radar,
    RefreshCcw,
    Workflow,
    type LucideIcon,
} from 'lucide-react';

type DesignPhilosophyItem = {
    label: string;
    description: string;
};

export type DesignPhilosophySection = {
    /*
     * Laravel の DesignPhilosophySectionDTO::toArray() と対応する props です。
     * LP本文は config から渡されるため、この型は「受け取る形」だけを定義し、
     * React 側に固定本文配列を増やさないようにします。
     */
    key: string;
    sortOrder: number;
    eyebrow: string;
    visualType: string;
    icon: string;
    title: string;
    lead: string;
    body: string;
    proofLabel: string;
    proofText: string;
    items: DesignPhilosophyItem[];
    leftLabel: string | null;
    rightLabel: string | null;
    leftItems: string[];
    rightItems: string[];
};

type DesignPhilosophySectionTemplateProps = {
    section: DesignPhilosophySection;
    index: number;
};

type SectionTheme = {
    section: string;
    eyebrow: string;
    accent: string;
    card: string;
    softCard: string;
    badge: string;
    line: string;
};

const iconMap: Record<string, LucideIcon> = {
    BookOpen,
    Bot,
    Compass,
    Milestone,
    Radar,
    RefreshCcw,
    Workflow,
};

const themes: Record<string, SectionTheme> = {
    hero: {
        section: 'bg-[#07111f]',
        eyebrow: 'text-cyan-100',
        accent: 'text-cyan-50',
        card: 'border-cyan-200/25 bg-cyan-50/10',
        softCard: 'border-white/15 bg-white/10',
        badge: 'bg-cyan-200 text-slate-950',
        line: 'border-cyan-200/30',
    },
    flow: {
        section: 'bg-[#0c1713]',
        eyebrow: 'text-emerald-100',
        accent: 'text-emerald-50',
        card: 'border-emerald-200/25 bg-emerald-50/10',
        softCard: 'border-white/15 bg-white/10',
        badge: 'bg-emerald-200 text-slate-950',
        line: 'border-emerald-200/30',
    },
    steps: {
        section: 'bg-[#191407]',
        eyebrow: 'text-amber-100',
        accent: 'text-amber-50',
        card: 'border-amber-200/25 bg-amber-50/10',
        softCard: 'border-white/15 bg-white/10',
        badge: 'bg-amber-200 text-slate-950',
        line: 'border-amber-200/30',
    },
    loop: {
        section: 'bg-[#071625]',
        eyebrow: 'text-sky-100',
        accent: 'text-sky-50',
        card: 'border-sky-200/25 bg-sky-50/10',
        softCard: 'border-white/15 bg-white/10',
        badge: 'bg-sky-200 text-slate-950',
        line: 'border-sky-200/30',
    },
    split: {
        section: 'bg-[#17111b]',
        eyebrow: 'text-fuchsia-100',
        accent: 'text-fuchsia-50',
        card: 'border-fuchsia-200/25 bg-fuchsia-50/10',
        softCard: 'border-white/15 bg-white/10',
        badge: 'bg-fuchsia-200 text-slate-950',
        line: 'border-fuchsia-200/30',
    },
    sources: {
        section: 'bg-[#111827]',
        eyebrow: 'text-indigo-100',
        accent: 'text-indigo-50',
        card: 'border-indigo-200/25 bg-indigo-50/10',
        softCard: 'border-white/15 bg-white/10',
        badge: 'bg-indigo-200 text-slate-950',
        line: 'border-indigo-200/30',
    },
    closing: {
        section: 'bg-[#151515]',
        eyebrow: 'text-stone-100',
        accent: 'text-white',
        card: 'border-stone-200/20 bg-stone-50/10',
        softCard: 'border-white/15 bg-white/10',
        badge: 'bg-stone-200 text-slate-950',
        line: 'border-stone-200/25',
    },
};

const defaultTheme = themes.hero;

export default function DesignPhilosophySectionTemplate({
    section,
    index,
}: DesignPhilosophySectionTemplateProps) {
    const theme = themes[section.visualType] ?? defaultTheme;
    const BackgroundIcon = iconMap[section.icon] ?? Compass;
    const Heading = index === 0 ? 'h1' : 'h2';
    const titleId = `design-philosophy-${section.key}`;

    return (
        <section
            aria-labelledby={titleId}
            className={`design-philosophy-section relative isolate flex min-h-[88svh] min-w-0 items-center overflow-hidden px-5 py-20 text-white sm:px-8 sm:py-24 lg:min-h-[92svh] lg:px-10 ${theme.section} [@media(orientation:landscape)_and_(max-height:560px)]:min-h-[auto] [@media(orientation:landscape)_and_(max-height:560px)]:py-12`}
        >
            <BackgroundIcon
                aria-hidden="true"
                className="pointer-events-none absolute -right-14 top-12 h-52 w-52 text-white/10 sm:-right-10 sm:h-72 sm:w-72 lg:right-10 lg:top-16 lg:h-96 lg:w-96"
                strokeWidth={1.1}
            />

            <div className="relative z-10 mx-auto grid w-full max-w-7xl min-w-0 gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)] lg:items-center lg:gap-14">
                <div className="min-w-0 break-words [overflow-wrap:anywhere]">
                    {section.eyebrow !== '' && (
                        <p className={`text-sm font-semibold ${theme.eyebrow}`}>
                            {section.eyebrow}
                        </p>
                    )}

                    <Heading
                        id={titleId}
                        className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-white drop-shadow-[0_18px_36px_rgba(0,0,0,0.28)] sm:text-5xl lg:text-7xl [@media(orientation:landscape)_and_(max-height:560px)]:text-4xl"
                    >
                        {section.title}
                    </Heading>

                    <p
                        className={`mt-6 max-w-2xl break-words text-2xl font-semibold leading-relaxed ${theme.accent} sm:text-3xl [@media(orientation:landscape)_and_(max-height:560px)]:mt-4 [@media(orientation:landscape)_and_(max-height:560px)]:text-xl`}
                    >
                        {section.lead}
                    </p>

                    <p className="mt-6 max-w-2xl break-words text-base leading-8 text-white/75 sm:text-lg [@media(orientation:landscape)_and_(max-height:560px)]:mt-4 [@media(orientation:landscape)_and_(max-height:560px)]:leading-7">
                        {section.body}
                    </p>
                </div>

                <div className="min-w-0">
                    {renderSectionVisual(section, theme)}
                </div>
            </div>
        </section>
    );
}

function renderSectionVisual(
    section: DesignPhilosophySection,
    theme: SectionTheme,
) {
    if (section.visualType === 'flow') {
        return <FlowVisual section={section} theme={theme} />;
    }

    if (section.visualType === 'steps') {
        return <StepsVisual section={section} theme={theme} />;
    }

    if (section.visualType === 'loop') {
        return <LoopVisual section={section} theme={theme} />;
    }

    if (section.visualType === 'split') {
        return <SplitVisual section={section} theme={theme} />;
    }

    if (section.visualType === 'sources') {
        return <SourceVisual section={section} theme={theme} />;
    }

    return <CardGridVisual section={section} theme={theme} />;
}

function CardGridVisual({
    section,
    theme,
}: {
    section: DesignPhilosophySection;
    theme: SectionTheme;
}) {
    return (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {section.items.map((item) => (
                <ItemCard key={item.label} item={item} theme={theme} />
            ))}
            <ProofBlock section={section} theme={theme} className="sm:col-span-2" />
        </div>
    );
}

function FlowVisual({
    section,
    theme,
}: {
    section: DesignPhilosophySection;
    theme: SectionTheme;
}) {
    return (
        <div className="min-w-0">
            <ol className="grid min-w-0 gap-3 lg:grid-cols-5">
                {section.items.map((item, itemIndex) => (
                    <li
                        key={item.label}
                        className={`relative min-w-0 rounded-lg border p-4 backdrop-blur-md ${theme.card}`}
                    >
                        <p className={`text-xs font-semibold ${theme.eyebrow}`}>
                            {String(itemIndex + 1).padStart(2, '0')}
                        </p>
                        <h3 className="mt-3 break-words text-base font-semibold leading-snug text-white [overflow-wrap:anywhere]">
                            {item.label}
                        </h3>
                        <p className="mt-3 break-words text-sm leading-6 text-white/70 [overflow-wrap:anywhere]">
                            {item.description}
                        </p>
                    </li>
                ))}
            </ol>
            <div className={`my-5 border-t ${theme.line}`} />
            <ProofBlock section={section} theme={theme} />
        </div>
    );
}

function StepsVisual({
    section,
    theme,
}: {
    section: DesignPhilosophySection;
    theme: SectionTheme;
}) {
    return (
        <div className="min-w-0">
            <ol className="grid min-w-0 gap-4 sm:grid-cols-2">
                {section.items.map((item, itemIndex) => (
                    <li
                        key={item.label}
                        className={`min-w-0 rounded-lg border p-5 backdrop-blur-md ${theme.card}`}
                    >
                        <p className={`text-xs font-semibold ${theme.eyebrow}`}>
                            STEP {String(itemIndex + 1).padStart(2, '0')}
                        </p>
                        <h3 className="mt-4 break-words text-xl font-semibold leading-snug text-white [overflow-wrap:anywhere]">
                            {item.label}
                        </h3>
                        <p className="mt-3 break-words text-sm leading-7 text-white/70 [overflow-wrap:anywhere]">
                            {item.description}
                        </p>
                    </li>
                ))}
            </ol>
            <ProofBlock section={section} theme={theme} className="mt-4" />
        </div>
    );
}

function LoopVisual({
    section,
    theme,
}: {
    section: DesignPhilosophySection;
    theme: SectionTheme;
}) {
    return (
        <div className="min-w-0">
            <ol className="grid min-w-0 gap-4 sm:grid-cols-2">
                {section.items.map((item, itemIndex) => (
                    <li
                        key={item.label}
                        className={`min-w-0 rounded-lg border p-5 backdrop-blur-md ${theme.card}`}
                    >
                        <div
                            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-3 text-sm font-semibold ${theme.badge}`}
                        >
                            {itemIndex + 1}
                        </div>
                        <h3 className="mt-4 break-words text-lg font-semibold leading-snug text-white [overflow-wrap:anywhere]">
                            {item.label}
                        </h3>
                        <p className="mt-3 break-words text-sm leading-7 text-white/70 [overflow-wrap:anywhere]">
                            {item.description}
                        </p>
                    </li>
                ))}
            </ol>
            <div
                className={`mt-4 rounded-lg border p-5 text-sm leading-7 text-white/80 backdrop-blur-md ${theme.softCard}`}
            >
                ズレが残れば、修正して同じ確認手段へ戻ります。
            </div>
        </div>
    );
}

function SplitVisual({
    section,
    theme,
}: {
    section: DesignPhilosophySection;
    theme: SectionTheme;
}) {
    return (
        <div className="min-w-0">
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <TextListCard
                    label={section.leftLabel ?? 'Human'}
                    items={section.leftItems}
                    theme={theme}
                />
                <TextListCard
                    label={section.rightLabel ?? 'AI'}
                    items={section.rightItems}
                    theme={theme}
                />
            </div>
            <ProofBlock section={section} theme={theme} className="mt-4" />
        </div>
    );
}

function SourceVisual({
    section,
    theme,
}: {
    section: DesignPhilosophySection;
    theme: SectionTheme;
}) {
    return (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {section.items.map((item) => (
                <ItemCard key={item.label} item={item} theme={theme} />
            ))}
            <ProofBlock section={section} theme={theme} className="sm:col-span-2" />
        </div>
    );
}

function ItemCard({
    item,
    theme,
}: {
    item: DesignPhilosophyItem;
    theme: SectionTheme;
}) {
    return (
        <div
            className={`min-w-0 rounded-lg border p-5 backdrop-blur-md ${theme.card}`}
        >
            <h3 className="break-words text-lg font-semibold leading-snug text-white [overflow-wrap:anywhere]">
                {item.label}
            </h3>
            <p className="mt-3 break-words text-sm leading-7 text-white/70 [overflow-wrap:anywhere]">
                {item.description}
            </p>
        </div>
    );
}

function TextListCard({
    label,
    items,
    theme,
}: {
    label: string;
    items: string[];
    theme: SectionTheme;
}) {
    return (
        <section
            className={`min-w-0 rounded-lg border p-5 backdrop-blur-md ${theme.card}`}
        >
            <h3 className="break-words text-xl font-semibold text-white [overflow-wrap:anywhere]">
                {label}
            </h3>
            <ul className="mt-5 grid gap-3">
                {items.map((item) => (
                    <li
                        key={item}
                        className="min-w-0 rounded-md border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold leading-6 text-white/80 [overflow-wrap:anywhere]"
                    >
                        {item}
                    </li>
                ))}
            </ul>
        </section>
    );
}

function ProofBlock({
    section,
    theme,
    className = '',
}: {
    section: DesignPhilosophySection;
    theme: SectionTheme;
    className?: string;
}) {
    return (
        <aside
            className={`min-w-0 rounded-lg border p-5 backdrop-blur-md ${theme.softCard} ${className}`}
        >
            <p className={`text-sm font-semibold ${theme.eyebrow}`}>
                {section.proofLabel}
            </p>
            <p className="mt-3 break-words text-sm leading-7 text-white/75 [overflow-wrap:anywhere]">
                {section.proofText}
            </p>
        </aside>
    );
}
