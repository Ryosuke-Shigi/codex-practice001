import { useEffect, useState } from 'react';

import type { Project } from './mockData';

type SiteAccessPanelProps = {
    project: Project;
};

export default function SiteAccessPanel({ project }: SiteAccessPanelProps) {
    const [accessMemos, setAccessMemos] = useState({
        parking: project.parkingMemo,
        loading: project.loadingMemo,
        visit: project.visitNote,
    });
    const [savedMemoKey, setSavedMemoKey] = useState<keyof typeof accessMemos | null>(
        null,
    );
    const encodedAddress = encodeURIComponent(project.siteAddress);
    // Address-based mock links only: no Maps API key, SDK, geocoding, or current location.
    const mapPreviewUrl = `https://maps.google.com/maps?q=${encodedAddress}&output=embed`;
    const googleMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    const googleRouteUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    const yahooMapUrl = `https://map.yahoo.co.jp/search?p=${encodedAddress}&ei=UTF-8`;

    useEffect(() => {
        setAccessMemos({
            parking: project.parkingMemo,
            loading: project.loadingMemo,
            visit: project.visitNote,
        });
        setSavedMemoKey(null);
    }, [project]);

    const updateMemo = (key: keyof typeof accessMemos, value: string) => {
        setAccessMemos((current) => ({
            ...current,
            [key]: value,
        }));
        setSavedMemoKey(null);
    };

    return (
        <section className="rounded-lg border border-sky-200 bg-sky-50 p-4 shadow-sm sm:p-5">
            <div className="grid gap-3">
                <div>
                    <h3 className="text-lg font-bold text-sky-950">
                        現場アクセス
                    </h3>
                </div>

                <div className="rounded-lg border border-sky-200 bg-white p-3">
                    <p className="text-xs font-bold text-slate-500">現場住所</p>
                    <p className="mt-1 break-words text-base font-bold text-slate-950">
                        {project.siteAddress}
                    </p>
                </div>

                <div className="overflow-hidden rounded-lg border border-sky-200 bg-white">
                    <div className="border-b border-sky-100 px-3 py-2">
                        <p className="text-sm font-bold text-sky-950">
                            地図表示エリア
                        </p>
                    </div>
                    <iframe
                        title={`${project.name} の現場住所マップ`}
                        src={mapPreviewUrl}
                        className="h-56 w-full border-0 sm:h-72"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                    <a
                        href={googleMapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 min-w-0 items-center justify-center whitespace-nowrap rounded-lg bg-sky-700 px-3 text-center text-sm font-bold text-white transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        Google Mapsで現場を開く
                    </a>
                    <a
                        href={googleRouteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 min-w-0 items-center justify-center whitespace-nowrap rounded-lg bg-slate-950 px-3 text-center text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                    >
                        Google Mapsで経路を見る
                    </a>
                    <a
                        href={yahooMapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 min-w-0 items-center justify-center whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 text-center text-sm font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        Yahoo!マップで現場を開く
                    </a>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                    <AccessMemoEditor
                        title="駐車メモ"
                        value={accessMemos.parking}
                        saved={savedMemoKey === 'parking'}
                        onChange={(value) => updateMemo('parking', value)}
                        onSave={() => setSavedMemoKey('parking')}
                    />
                    <AccessMemoEditor
                        title="搬入口メモ"
                        value={accessMemos.loading}
                        saved={savedMemoKey === 'loading'}
                        onChange={(value) => updateMemo('loading', value)}
                        onSave={() => setSavedMemoKey('loading')}
                    />
                    <AccessMemoEditor
                        title="訪問注意事項"
                        value={accessMemos.visit}
                        saved={savedMemoKey === 'visit'}
                        onChange={(value) => updateMemo('visit', value)}
                        onSave={() => setSavedMemoKey('visit')}
                    />
                </div>
            </div>
        </section>
    );
}

function AccessMemoEditor({
    title,
    value,
    saved,
    onChange,
    onSave,
}: {
    title: string;
    value: string;
    saved: boolean;
    onChange: (value: string) => void;
    onSave: () => void;
}) {
    return (
        <article className="grid gap-2 rounded-lg border border-sky-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-sky-950">{title}</h4>
                {saved && (
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-900">
                        保存済み
                    </span>
                )}
            </div>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                rows={4}
                className="min-h-24 rounded-md border border-sky-200 bg-sky-50 px-2 py-1.5 text-sm leading-6 text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
            <button
                type="button"
                onClick={onSave}
                className="min-h-9 rounded-md bg-sky-700 px-3 text-xs font-bold text-white transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
            >
                保存
            </button>
        </article>
    );
}
