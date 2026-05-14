type VerticalIntensitySwitchProps = {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    tone?: 'strong' | 'high' | 'middle' | 'low' | 'unknown';
};

const toneClassNames = {
    strong: 'from-rose-400 to-red-500 shadow-rose-500/35',
    high: 'from-orange-300 to-rose-400 shadow-orange-400/30',
    middle: 'from-violet-300 to-fuchsia-400 shadow-violet-400/30',
    low: 'from-sky-300 to-cyan-400 shadow-sky-400/30',
    unknown: 'from-slate-300 to-slate-500 shadow-slate-400/24',
};

export default function VerticalIntensitySwitch({
    label,
    checked,
    onChange,
    tone = 'middle',
}: VerticalIntensitySwitchProps) {
    return (
        <div className="flex w-10 shrink-0 flex-col items-center gap-1 text-center">
            <span className="min-h-4 text-[11px] font-bold leading-4 text-white">
                {label}
            </span>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={`震度${label}の表示`}
                onClick={() => onChange(!checked)}
                className={`relative flex h-10 w-6 rounded-full border p-0.5 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/70 ${
                    checked
                        ? 'items-start border-white/60 bg-white/24'
                        : 'items-end border-white/20 bg-slate-950/54'
                }`}
            >
                <span
                    className={`h-5 w-5 rounded-full bg-gradient-to-br shadow-lg transition-transform duration-150 ${toneClassNames[tone]} ${
                        checked ? 'translate-y-0' : 'translate-y-0'
                    }`}
                    aria-hidden="true"
                />
            </button>
        </div>
    );
}
