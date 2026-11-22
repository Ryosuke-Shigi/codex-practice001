/**
 * API Catalog 一覧カードの表示 Component です。
 *
 * 一覧/モックの props を表示し、検索条件・ページング・保存メモ CRUD の判断は呼び出し元や backend へ分けます。
 */
import { Link } from '@inertiajs/react';
import { motion } from 'motion/react';

import type { ApiCatalogNoteItem } from './ApiCatalogNotesPanel';
import SearchButtons from './SearchButtons';
import { apiCatalogDescriptionExcerpt } from './apiCatalogDescription';

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
            className="group relative flex min-w-0 flex-col rounded-2xl border border-white/40 bg-slate-950/80 p-5 text-white shadow-xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: index * 0.035,
                duration: 0.36,
                ease: 'easeOut',
            }}
            whileHover={{ y: -3 }}
        >
            <div className="min-w-0">
                <div className="min-w-0">
                    <h2 className="break-words text-lg font-semibold leading-7 text-white">
                        {title}
                    </h2>
                    <p className="mt-2 break-all text-xs leading-5 text-cyan-100">
                        Provider: {displayValue(item.providerKey)}<br />Service: {displayValue(item.serviceKey)}
                    </p>
                </div>
            </div>

            <p className="mt-3 line-clamp-3 text-sm leading-6 text-cyan-50/86">
                {apiCatalogDescriptionExcerpt(item.description)}
            </p>

            <p className="mt-3 break-words text-xs leading-6 text-cyan-100">
                API版: {displayValue(item.preferredVersion)} / OpenAPI版: {displayValue(item.openapiVersion)}
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
                {item.detailHref && <Link href={item.detailHref} aria-label={`${title} の詳細を開く`}
                    className="inline-flex min-h-11 items-center rounded-xl border border-cyan-200 bg-cyan-50 px-4 text-sm font-bold text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300">
                    仕様・詳細を見る →
                </Link>}

                {/*
                    カードはモック/本番の両一覧で共通利用します。
                    外部検索URLはpropsで渡さず、SearchButtons側でAPI名/provider名から毎回生成します。
                */}
                <p className="mt-4 text-xs font-semibold text-cyan-100">外部で関連情報を検索 ↗</p>
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
