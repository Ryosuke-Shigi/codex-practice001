export type QuakeDateRange = {
    startDate: string;
    endDate: string;
};

type QuakeDateRangeFilterProps = {
    value: QuakeDateRange;
    onChange: (value: QuakeDateRange) => void;
};

export default function QuakeDateRangeFilter({
    value,
    onChange,
}: QuakeDateRangeFilterProps) {
    return (
        <section className="w-full min-w-0 rounded-lg border border-white/25 bg-slate-950/34 p-3 text-cyan-50 shadow-[0_18px_42px_rgba(2,24,45,0.16)] backdrop-blur-md sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold tracking-[0.08em] text-cyan-100/82">
                    日付範囲
                </h2>
            </div>

            <div className="mt-3 grid w-full min-w-0 gap-3 sm:grid-cols-2">
                <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-cyan-100/72">
                    開始日
                    <input
                        type="date"
                        value={value.startDate}
                        onChange={(event) => onChange({
                            ...value,
                            startDate: event.currentTarget.value,
                        })}
                        className="min-h-10 w-full min-w-0 rounded-md border border-white/20 bg-white/10 px-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-100/70 focus:ring-4 focus:ring-cyan-100/20"
                    />
                </label>
                <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-cyan-100/72">
                    終了日
                    <input
                        type="date"
                        value={value.endDate}
                        onChange={(event) => onChange({
                            ...value,
                            endDate: event.currentTarget.value,
                        })}
                        className="min-h-10 w-full min-w-0 rounded-md border border-white/20 bg-white/10 px-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-100/70 focus:ring-4 focus:ring-cyan-100/20"
                    />
                </label>
            </div>
        </section>
    );
}
