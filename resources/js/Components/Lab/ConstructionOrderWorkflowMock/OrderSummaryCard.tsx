import type { OrderDraft } from './mockData';
import { formatCurrency } from './mockData';

type OrderSummaryCardProps = {
    orderDraft: OrderDraft;
    grandTotal: number;
};

const mapLinkClassName =
    'inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-100/35 bg-cyan-100/12 px-3 py-2 text-center text-sm font-bold text-cyan-50 transition hover:bg-cyan-100/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100';

const disabledMapButtonClassName =
    'inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-lg border border-white/10 bg-white/6 px-3 py-2 text-center text-sm font-bold text-slate-400';

export default function OrderSummaryCard({
    orderDraft,
    grandTotal,
}: OrderSummaryCardProps) {
    const siteAddress = orderDraft.siteAddress.trim();
    const hasSiteAddress = siteAddress.length > 0;
    const encodedAddress = hasSiteAddress ? encodeURIComponent(siteAddress) : '';
    const googleMapPreviewUrl = hasSiteAddress
        ? `https://maps.google.com/maps?q=${encodedAddress}&output=embed`
        : '';
    const mapLinks = hasSiteAddress
        ? [
              {
                  label: 'Google Mapで表示',
                  href: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
              },
              {
                  label: 'Yahoo!マップで表示',
                  href: `https://map.yahoo.co.jp/search?q=${encodedAddress}`,
              },
              {
                  label: 'Google Mapで経路を見る',
                  href: `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`,
                  className: 'sm:col-span-2',
              },
          ]
        : [];
    const summaryItems = [
        ['現場名', orderDraft.siteName],
        ['取引先', orderDraft.partner],
        ['発注日', orderDraft.orderDate],
        ['担当者', orderDraft.owner],
        ['発注番号', 'CO-2026-0516-008'],
        ['金額合計', formatCurrency(grandTotal)],
    ];

    return (
        <article className="rounded-lg border border-white/15 bg-slate-950/70 p-4 backdrop-blur-xl sm:p-5">
            <h2 className="text-xl font-semibold text-white">基本情報カード</h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm">
                {summaryItems.map(([label, value]) => (
                    <div
                        key={label}
                        className="rounded-lg border border-white/10 bg-white/6 p-3"
                    >
                        <dt className="text-xs text-slate-300">{label}</dt>
                        <dd className="mt-1 break-words font-semibold text-white">
                            {value}
                        </dd>
                    </div>
                ))}

                <div className="rounded-lg border border-cyan-100/25 bg-cyan-100/10 p-3">
                    <dt className="text-xs text-slate-300">現場住所</dt>
                    <dd className="mt-1 break-words font-semibold text-white">
                        {hasSiteAddress ? orderDraft.siteAddress : '未入力'}
                    </dd>

                    {hasSiteAddress ? (
                        <>
                            <div className="mt-3 overflow-hidden rounded-lg border border-cyan-100/25 bg-slate-950/55">
                                <iframe
                                    title="現場住所のGoogle Map"
                                    src={googleMapPreviewUrl}
                                    className="h-56 w-full border-0 sm:h-64"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {mapLinks.map((link) => (
                                    <a
                                        key={link.label}
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`${mapLinkClassName} ${link.className ?? ''}`}
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="mt-3 flex min-h-32 items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/6 px-3 text-center text-sm font-semibold text-amber-100">
                                住所未入力のため地図を開けません
                            </p>
                            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {[
                                    'Google Mapで表示',
                                    'Yahoo!マップで表示',
                                    'Google Mapで経路を見る',
                                ].map((label, index) => (
                                    <button
                                        key={label}
                                        type="button"
                                        disabled
                                        className={`${disabledMapButtonClassName} ${
                                            index === 2 ? 'sm:col-span-2' : ''
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </dl>
        </article>
    );
}
