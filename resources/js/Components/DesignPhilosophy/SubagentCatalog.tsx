import { useMemo, useState } from 'react';

import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import {
    subagentFilters,
    subagents,
} from '@/Components/DesignPhilosophy/designPhilosophyData';
import type {
    DesignPhilosophySection,
    SubagentFilterKey,
} from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export default function SubagentCatalog({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    const [activeFilter, setActiveFilter] =
        useState<SubagentFilterKey>('all');
    const visibleSubagents = useMemo(
        () =>
            activeFilter === 'all'
                ? subagents
                : subagents.filter((subagent) => subagent.group === activeFilter),
        [activeFilter],
    );

    return (
        <section
            aria-labelledby={`design-philosophy-${section.key}`}
            className="px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28"
        >
            <div className="mx-auto w-full max-w-7xl min-w-0">
                <SectionHeading section={section} />

                <div
                    aria-label="Subagentの絞り込み"
                    className="mt-10 flex min-w-0 flex-wrap gap-2.5"
                >
                    {subagentFilters.map((filter) => {
                        const active = filter.key === activeFilter;

                        return (
                            <button
                                key={filter.key}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setActiveFilter(filter.key)}
                                className={`min-h-11 rounded-full border px-4 py-2.5 text-sm font-black outline-none transition-colors focus-visible:ring-4 focus-visible:ring-[#d8c100]/45 motion-reduce:transition-none ${
                                    active
                                        ? 'border-[#d8c100] bg-[#f2df3a] text-[#11120f] shadow-sm'
                                        : 'border-black/15 bg-white/80 text-[#3d3e38] hover:border-[#d8c100] hover:bg-[#f2df3a]/20'
                                }`}
                            >
                                {filter.label}
                                {active && (
                                    <span className="ml-2" aria-hidden="true">
                                        ●
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <p
                    aria-live="polite"
                    className="mt-5 text-sm font-bold text-[#62635d]"
                >
                    {visibleSubagents.length}件を表示中／全18件
                </p>

                <div className="mt-6 grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {subagents.map((subagent) => {
                        const visible = visibleSubagents.includes(subagent);

                        return (
                            <article
                                key={subagent.name}
                                data-subagent-card
                                hidden={!visible}
                                className="min-w-0 rounded-[1.1rem] border border-black/10 bg-white/85 p-6 shadow-[0_8px_26px_rgba(36,37,30,0.05)]"
                            >
                                <p className="text-xs font-black tracking-[0.1em] text-[#52534d]">
                                    {subagent.groupLabel}
                                </p>
                                <p className="mt-3 inline-flex rounded-full bg-[#f2df3a]/25 px-2.5 py-1 text-xs font-black text-[#4a4631]">
                                    {subagent.roleLabel}
                                </p>
                                <h3 className="mt-4 break-all font-mono text-lg font-black text-[#11120f] [overflow-wrap:anywhere]">
                                    {subagent.name}
                                </h3>
                                <p className="mt-3 text-base leading-8 text-[#62635d]">
                                    {subagent.description}
                                </p>
                            </article>
                        );
                    })}
                </div>

                {visibleSubagents.length === 0 && (
                    <div className="mt-6 rounded-[1.1rem] border border-dashed border-black/20 bg-white/70 p-6">
                        <p className="font-bold">該当する役割はありません。</p>
                        <button
                            type="button"
                            onClick={() => setActiveFilter('all')}
                            className="mt-4 min-h-11 rounded-full bg-[#f2df3a] px-4 py-2 font-black outline-none focus-visible:ring-4 focus-visible:ring-[#d8c100]/45"
                        >
                            すべてへ戻す
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
