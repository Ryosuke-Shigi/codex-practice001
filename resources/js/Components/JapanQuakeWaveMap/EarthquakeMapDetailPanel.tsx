import type { EarthquakeMapPin } from '@/Components/JapanQuakeWaveMap/JapanQuakeWaveMap';

type EarthquakeMapDetailPanelProps = {
    pin: EarthquakeMapPin | null;
};

function formatDepth(depthMeter: number | null) {
    if (depthMeter === null) {
        return '-';
    }

    return `${Math.round(depthMeter / 1000).toLocaleString()}km`;
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
                <p className="text-sm font-semibold text-white">詳細</p>
                <p className="mt-3 text-sm leading-6 text-cyan-50/78">
                    地図上のピンを選択すると、取得済み地震情報の詳細を表示します。
                </p>
            </aside>
        );
    }

    const areaName = pin.areaName?.trim() || '発生場所未取得';
    const earthquakeStatement = pin.headline?.trim() || pin.comment?.trim() || null;
    const rows = [
        ['マグニチュード', valueOrDash(pin.magnitude)],
        ['最大震度', valueOrDash(pin.maxIntensity)],
        ['深さ', formatDepth(pin.depthMeter)],
    ];

    return (
        <aside className="rounded-lg border border-white/25 bg-slate-950/40 p-4 text-cyan-50 shadow-[0_18px_42px_rgba(2,24,45,0.2)] backdrop-blur-md">
            <h2 className="text-xl font-semibold leading-7 text-white">
                {areaName}
            </h2>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                {rows.map(([label, value]) => (
                    <div key={label} className="rounded-md border border-white/15 bg-white/10 px-3 py-2">
                        <dt className="text-xs font-semibold text-cyan-100/62">{label}</dt>
                        <dd className="mt-1 break-words text-base font-semibold text-white">{value}</dd>
                    </div>
                ))}
            </dl>

            {earthquakeStatement && (
                <p className="mt-4 border-t border-white/15 pt-4 text-sm leading-6 text-cyan-50/84">
                    {earthquakeStatement}
                </p>
            )}
        </aside>
    );
}
