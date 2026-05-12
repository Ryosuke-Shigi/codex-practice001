import type { EarthquakeMapPin } from '@/Components/JapanQuakeWaveMap/JapanQuakeWaveMapMock';

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

    return `${depthMeter.toLocaleString()} m`;
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
     * 地図上の選択状態は親で管理し、ここでは DB から来た項目を欠損に強い形で並べます。
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
        ['area', valueOrDash(pin.areaName)],
        ['maxIntensity', valueOrDash(pin.maxIntensity)],
        ['magnitude', valueOrDash(pin.magnitude)],
        ['depthMeter', formatDepth(pin.depthMeter)],
        ['occurredAt', formatDateTime(pin.occurredAt)],
        ['reportedAt', formatDateTime(pin.reportedAt)],
        ['rawCoordinate', valueOrDash(pin.rawCoordinate)],
    ];

    return (
        <aside className="rounded-lg border border-white/25 bg-slate-950/40 p-4 text-cyan-50 shadow-[0_18px_42px_rgba(2,24,45,0.2)] backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/65">
                detail
            </p>
            <h2 className="mt-3 text-lg font-semibold leading-7 text-white">
                {pin.title ?? '地震情報'}
            </h2>

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
