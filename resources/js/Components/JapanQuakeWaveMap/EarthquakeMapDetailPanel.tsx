import type { EarthquakeMapPin } from '@/Components/JapanQuakeWaveMap/JapanQuakeWaveMap';

type EarthquakeMapDetailPanelProps = {
    pin: EarthquakeMapPin | null;
};

function formatDateTime(value: string | null) {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function formatDepth(depthMeter: number | null) {
    if (depthMeter === null) {
        return '-';
    }

    return `${Math.round(depthMeter / 1000).toLocaleString()} km`;
}

function valueOrDash(value: string | number | null) {
    if (value === null || value === '') {
        return '-';
    }

    return value;
}

export default function EarthquakeMapDetailPanel({ pin }: EarthquakeMapDetailPanelProps) {
    /*
     * 詳細パネルは選択中 pin の表示専用です。
     * 研究用・学習用の読みやすさを優先し、地域名と震度を中心に置きます。
     * rawCoordinate や sourceEntryId のような検証向け情報は地図上の主表示から外し、
     * DB の全項目をそのまま並べるだけのパネルにしないようにします。
     */
    if (!pin) {
        return (
            <aside className="rounded-lg border border-white/25 bg-slate-950/34 p-4 text-cyan-50 shadow-[0_18px_42px_rgba(2,24,45,0.18)] backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/65">
                    detail
                </p>
                <p className="mt-3 text-sm leading-6 text-cyan-50/78">
                    地図上のピンを選択すると、取得済み地震情報の詳細を表示します。
                </p>
            </aside>
        );
    }

    const rows = [
        ['magnitude', valueOrDash(pin.magnitude)],
        ['depth', formatDepth(pin.depthMeter)],
        ['occurred', formatDateTime(pin.occurredAt)],
        ['reported', formatDateTime(pin.reportedAt)],
    ];

    return (
        <aside className="rounded-lg border border-white/25 bg-slate-950/40 p-4 text-cyan-50 shadow-[0_18px_42px_rgba(2,24,45,0.2)] backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/65">
                detail
            </p>
            <h2 className="mt-3 text-xl font-semibold leading-7 text-white">
                {pin.areaName ?? pin.title ?? '地域名未取得'}
            </h2>

            <div className="mt-4 inline-flex items-center gap-3 rounded-lg border border-white/18 bg-white/10 px-3 py-2">
                <span className="text-xs font-semibold text-cyan-100/62">震度</span>
                <span className="text-2xl font-semibold leading-none text-white">
                    {valueOrDash(pin.maxIntensity)}
                </span>
            </div>

            <dl className="mt-4 grid gap-3 text-sm">
                {rows.map(([label, value]) => (
                    <div key={label}>
                        <dt className="text-xs font-semibold text-cyan-100/62">{label}</dt>
                        <dd className="mt-1 break-words text-cyan-50/88">{value}</dd>
                    </div>
                ))}
            </dl>

            {pin.headline && (
                <p className="mt-4 border-t border-white/15 pt-4 text-sm leading-6 text-cyan-50/84">
                    {pin.headline}
                </p>
            )}

            {pin.comment && pin.comment !== pin.headline && (
                <p className="mt-3 text-sm leading-6 text-cyan-50/72">{pin.comment}</p>
            )}
        </aside>
    );
}
