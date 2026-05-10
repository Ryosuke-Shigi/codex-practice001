import { Link } from '@inertiajs/react';
import { motion } from 'motion/react';

import type { ApiCatalogNoteItem } from './ApiCatalogNotesPanel';
import SearchButtons from './SearchButtons';

export type ApiCatalogCardItem = {
    apiKey?: string;
    title: string;
    description: string;
    providerKey: string;
    serviceKey: string | null;
    preferredVersion: string | null;
    openapiVersion: string | null;
    notes?: ApiCatalogNoteItem[];
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
    /*
     * 保存メモは一覧検索にも使われるため、検索結果に出た理由がカード上でも分かるよう
     * 本文プレビューを同じカード内に表示します。全文や編集操作は詳細画面の責務に残し、
     * 一覧ではカード高さが暴れない範囲に絞って先頭2件だけを見せます。
     */
    const savedNotes = (item.notes ?? []).filter((note) => note.body.trim() !== '');
    const visibleSavedNotes = savedNotes.slice(0, 2);

    return (
        <motion.article
            className={`group relative flex min-h-[260px] flex-col rounded-2xl border border-white/35 bg-slate-950/38 p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_18px_38px_rgba(2,24,45,0.22)] backdrop-blur-2xl transition hover:border-cyan-100/55 hover:bg-slate-900/48 ${
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

            {visibleSavedNotes.length > 0 && (
                <div className="mt-3 rounded-xl border border-cyan-100/24 bg-cyan-50/10 px-3 py-2.5">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-cyan-100/70">
                        保存メモ
                    </p>
                    <div className="mt-2 grid gap-2">
                        {visibleSavedNotes.map((note) => (
                            <p
                                key={note.id}
                                className="line-clamp-2 text-xs leading-5 text-cyan-50/84"
                            >
                                {note.body}
                            </p>
                        ))}
                    </div>
                    {savedNotes.length > visibleSavedNotes.length && (
                        <p className="mt-2 text-[0.68rem] font-semibold text-cyan-100/64">
                            +{savedNotes.length - visibleSavedNotes.length}件
                        </p>
                    )}
                </div>
            )}

            <div className="mt-auto pt-4">
                <div className="min-w-0 text-xs font-semibold text-cyan-100/68">
                    <p className="truncate">OpenAPI {displayValue(item.openapiVersion)}</p>
                </div>

                {/*
                    カードはモック/本番の両一覧で共通利用します。
                    外部検索URLはpropsで渡さず、SearchButtons側でAPI名/provider名から毎回生成します。
                */}
                <SearchButtons
                    title={item.title}
                    providerKey={item.providerKey}
                    description={item.description}
                    apiKey={item.apiKey}
                    size="compact"
                    className="mt-3"
                />
            </div>
        </motion.article>
    );
}
