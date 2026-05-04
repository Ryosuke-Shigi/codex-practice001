import { Link } from '@inertiajs/react';
import { motion } from 'motion/react';

export type ApiCatalogCardItem = {
    title: string;
    description: string;
    providerKey: string;
    serviceKey: string | null;
    preferredVersion: string | null;
    openapiVersion: string | null;
    googleSearchUrl: string;
    detailHref: string | null;
};

type ApiCatalogCardProps = {
    item: ApiCatalogCardItem;
    index: number;
};

function displayValue(value: string | null) {
    return value && value.trim() !== '' ? value : 'n/a';
}

export default function ApiCatalogCard({ item, index }: ApiCatalogCardProps) {
    const title = displayValue(item.title);

    return (
        <motion.article
            className={`group relative flex min-h-[194px] flex-col rounded-2xl border border-white/35 bg-slate-950/38 p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_18px_38px_rgba(2,24,45,0.22)] backdrop-blur-2xl transition hover:border-cyan-100/55 hover:bg-slate-900/48 ${
                item.detailHref ? 'cursor-pointer' : ''
            }`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: index * 0.035,
                duration: 0.36,
                ease: 'easeOut',
            }}
            whileHover={{ y: -3 }}
        >
            {/* detailHref を渡した一覧だけ、カード全体を詳細へのクリック領域にします。 */}
            {item.detailHref && (
                <Link
                    href={item.detailHref}
                    aria-label={`${title} の詳細を開く`}
                    className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                />
            )}

            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-cyan-100/70">
                        {displayValue(item.providerKey)} / {displayValue(item.serviceKey)}
                    </p>
                    <h2 className="mt-1 line-clamp-2 text-lg font-semibold leading-tight text-white">
                        {title}
                    </h2>
                </div>

                <span className="shrink-0 rounded-full border border-cyan-100/35 bg-cyan-50/15 px-2.5 py-1 text-[0.68rem] font-semibold text-cyan-50">
                    {displayValue(item.preferredVersion)}
                </span>
            </div>

            <p className="mt-3 line-clamp-3 text-sm leading-6 text-cyan-50/86">
                {displayValue(item.description)}
            </p>

            <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
                <div className="min-w-0 text-xs font-semibold text-cyan-100/68">
                    <p className="truncate">OpenAPI {displayValue(item.openapiVersion)}</p>
                </div>

                <a
                    href={item.googleSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="relative z-20 inline-flex min-h-9 items-center justify-center rounded-lg border border-cyan-100/35 bg-cyan-50/15 px-3 text-sm font-bold text-cyan-50 transition hover:bg-cyan-50/24 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/30"
                >
                    Search
                </a>
            </div>
        </motion.article>
    );
}
