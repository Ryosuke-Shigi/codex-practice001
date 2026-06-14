import type { Project } from './mockData';

type SiteAccessPanelProps = {
    project: Project;
};

export default function SiteAccessPanel({ project }: SiteAccessPanelProps) {
    const encodedAddress = encodeURIComponent(project.siteAddress);
    // Address-based mock links only: no Maps API key, SDK, geocoding, or current location.
    const mapPreviewUrl = `https://maps.google.com/maps?q=${encodedAddress}&output=embed`;
    const googleMapUrl = `https://www.google.com/maps/search/${encodedAddress}`;
    const googleRouteUrl = `https://www.google.com/maps/dir/?destination=${encodedAddress}`;
    const yahooMapUrl = `https://map.yahoo.co.jp/search?p=${encodedAddress}`;

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
                        Google Mapで開く
                    </a>
                    <a
                        href={googleRouteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 min-w-0 items-center justify-center whitespace-nowrap rounded-lg bg-slate-950 px-3 text-center text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                    >
                        Google Mapで経路を見る
                    </a>
                    <a
                        href={yahooMapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 min-w-0 items-center justify-center whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 text-center text-sm font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        Yahoo!マップで開く
                    </a>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                    <AccessMemo title="駐車メモ" body={project.parkingMemo} />
                    <AccessMemo title="搬入口メモ" body={project.loadingMemo} />
                    <AccessMemo title="訪問注意事項" body={project.visitNote} />
                </div>
            </div>
        </section>
    );
}

function AccessMemo({ title, body }: { title: string; body: string }) {
    return (
        <article className="rounded-lg border border-sky-200 bg-white p-3">
            <h4 className="text-sm font-bold text-sky-950">{title}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>
        </article>
    );
}
