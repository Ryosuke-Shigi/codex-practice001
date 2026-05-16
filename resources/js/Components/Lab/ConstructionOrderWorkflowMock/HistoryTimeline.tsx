import type { HistoryItem } from './mockData';

type HistoryTimelineProps = {
    historyItems: HistoryItem[];
};

export default function HistoryTimeline({ historyItems }: HistoryTimelineProps) {
    return (
        <section className="rounded-lg border border-white/15 bg-slate-950/70 p-4 backdrop-blur-xl sm:p-5">
            <h2 className="text-xl font-semibold text-white">履歴タイムライン</h2>
            <div className="mt-5 grid gap-3">
                {historyItems.map((item) => (
                    <article
                        key={item.id}
                        className="grid gap-2 rounded-lg border border-white/12 bg-white/6 p-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-start"
                    >
                        <time className="text-xs font-semibold text-cyan-100">
                            {item.time}
                        </time>
                        <div>
                            <h3 className="font-semibold text-white">{item.label}</h3>
                            <p className="mt-1 text-sm leading-6 text-slate-300">
                                {item.detail}
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
