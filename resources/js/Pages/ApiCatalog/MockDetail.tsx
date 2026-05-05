import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';

import SearchButtons from '@/Components/ApiCatalog/SearchButtons';
import PublicLayout from '@/Layouts/PublicLayout';
import { mockApiCatalogItems, type ApiCatalogListItem } from './mockApiCatalogData';

type MockDetailProps = {
    apiKey: string;
    returnUrl: string;
};

type MockApiNote = {
    id: string;
    title: string;
    body: string;
};

type MockApiNoteField = keyof Pick<MockApiNote, 'title' | 'body'>;

/*
 * 将来の本番仕様メモ:
 * - saved_api_notes テーブルで保存する想定
 * - 1つの saved_api に複数 note が紐づく想定
 * - API一覧検索では saved_api_notes.title / saved_api_notes.body も検索対象にする想定
 * - 同期処理では saved_api_notes を触らない想定
 */
function createMockApiNote(): MockApiNote {
    return {
        id: `mock-note-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: '',
        body: '',
    };
}

function safeDecodeURIComponent(value: string) {
    try {
        return decodeURIComponent(value);
    } catch {
        // ルートパラメータが既に decode 済みでも詳細画面を落とさないための保険です。
        return value;
    }
}

function findMockApiCatalogItem(apiKey: string) {
    const decodedApiKey = safeDecodeURIComponent(apiKey);

    /*
     * 本実装では apiKey を Query Action へ渡して Repository から取得します。
     * 今回は React 側モックデータだけで詳細表示を確認するため、固定配列から検索します。
     */
    return mockApiCatalogItems.find(
        (item) => item.apiKey === apiKey || item.apiKey === decodedApiKey,
    );
}

function buildTechnicalRows(item: ApiCatalogListItem) {
    /*
     * 技術情報は初期表示から隠し、必要な時だけ確認する UI にします。
     * OpenAPI 本文や paths / schemas はまだ取得・表示しません。
     */
    return [
        ['apiKey', item.apiKey],
        ['providerKey', item.providerKey],
        ['serviceKey', item.serviceKey],
        ['domain', item.domain],
        ['preferredVersion', item.preferredVersion],
        ['openapiVersion', item.openapiVersion],
        ['sourceLatestUpdatedAt', item.sourceLatestUpdatedAt],
    ];
}

export default function MockDetail({ apiKey, returnUrl }: MockDetailProps) {
    const [notes, setNotes] = useState<MockApiNote[]>(() => [createMockApiNote()]);
    const [isTechnicalOpen, setIsTechnicalOpen] = useState(false);
    const item = useMemo(() => findMockApiCatalogItem(apiKey), [apiKey]);

    const addNote = () => {
        setNotes((currentNotes) => [...currentNotes, createMockApiNote()]);
    };

    const updateNote = (noteId: string, field: MockApiNoteField, value: string) => {
        setNotes((currentNotes) =>
            currentNotes.map((note) =>
                note.id === noteId
                    ? {
                          ...note,
                          [field]: value,
                      }
                    : note,
            ),
        );
    };

    const deleteNote = (noteId: string) => {
        setNotes((currentNotes) => currentNotes.filter((note) => note.id !== noteId));
    };

    if (!item) {
        return (
            <PublicLayout className="px-4 py-5 sm:px-6 lg:px-8">
                <Head title="API Catalog Mock Detail" />

                <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-5 pb-5">
                    <header className="flex flex-wrap items-center justify-end gap-3">
                        <span className="rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-950/70 backdrop-blur-xl">
                            Mock
                        </span>
                        <Link
                            href={returnUrl}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/35 bg-white/18 px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                        >
                            {/* returnUrl は route 側でモック一覧 URL に限定済みです。 */}
                            一覧へ戻る
                        </Link>
                    </header>

                    <section className="rounded-2xl border border-white/35 bg-slate-950/38 p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_22px_44px_rgba(2,24,45,0.24)] backdrop-blur-2xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                            API Discovery Hub
                        </p>
                        <h1 className="mt-3 text-3xl font-semibold text-white">APIが見つかりません</h1>
                        <p className="mt-4 break-all text-sm leading-7 text-cyan-50/84">
                            指定された apiKey はモックデータに存在しません: {safeDecodeURIComponent(apiKey)}
                        </p>
                    </section>
                </div>
            </PublicLayout>
        );
    }

    const technicalRows = buildTechnicalRows(item);

    return (
        <PublicLayout className="px-4 py-5 sm:px-6 lg:px-8">
            <Head title={`${item.title} Mock Detail`} />

            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 pb-5">
                <header className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-950/70 backdrop-blur-xl">
                            Mock
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                        {/*
                            モック詳細でも本番詳細と同じ SearchButtons を使い、
                            モック専用の検索リンク実装を持たないようにします。
                        */}
                        <SearchButtons
                            title={item.title}
                            providerKey={item.providerKey}
                            description={item.description}
                            apiKey={item.apiKey}
                        />
                        <Link
                            href={returnUrl}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/35 bg-white/18 px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                        >
                            {/* モック詳細でも一覧状態を含む returnUrl へ戻します。 */}
                            一覧へ戻る
                        </Link>
                    </div>
                </header>

                <motion.section
                    className="rounded-2xl border border-white/35 bg-slate-950/36 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_22px_48px_rgba(2,24,45,0.24)] backdrop-blur-2xl sm:p-6"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.42, ease: 'easeOut' }}
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/72">
                        API Discovery Hub
                    </p>
                    <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0">
                            <h1 className="text-3xl font-semibold text-white drop-shadow-[0_8px_26px_rgba(3,25,48,0.34)] sm:text-5xl">
                                {item.title}
                            </h1>
                            <p className="mt-3 break-all text-sm font-semibold text-cyan-100/78">
                                {item.providerKey} / {item.serviceKey} / {item.domain}
                            </p>
                        </div>

                        <span className="w-fit rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1.5 text-xs font-semibold text-cyan-50">
                            {item.preferredVersion}
                        </span>
                    </div>
                </motion.section>

                <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
                    <section className="rounded-2xl border border-white/35 bg-slate-950/36 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.36),0_18px_40px_rgba(2,24,45,0.20)] backdrop-blur-2xl sm:p-6">
                        <h2 className="text-2xl font-semibold text-white">{item.title}</h2>
                        <p className="mt-4 text-sm leading-7 text-cyan-50/86">{item.description}</p>

                        <div className="mt-7">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">調査メモ</h3>
                                    <p className="mt-1 text-xs font-semibold text-cyan-100/64">
                                        モックのため保存されません
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addNote}
                                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-cyan-100/35 bg-cyan-50/15 px-4 text-sm font-bold text-cyan-50 transition hover:bg-cyan-50/24 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/30"
                                >
                                    + メモ追加
                                </button>
                            </div>

                            {/*
                                複数メモの追加・編集・削除だけを React state で確認します。
                                保存ボタンや Repository / Action 連携はまだ作りません。
                            */}
                            <div className="mt-4 grid gap-3">
                                {notes.map((note, index) => (
                                    <article
                                        key={note.id}
                                        className="rounded-2xl border border-white/28 bg-white/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] backdrop-blur-xl"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <span className="rounded-full border border-cyan-100/30 bg-cyan-50/12 px-3 py-1 text-xs font-semibold text-cyan-50/86">
                                                No.{index + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => deleteNote(note.id)}
                                                className="inline-flex min-h-8 items-center justify-center rounded-lg border border-rose-100/25 bg-rose-100/8 px-3 text-xs font-semibold text-rose-50/86 transition hover:bg-rose-100/16 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100/20"
                                            >
                                                削除
                                            </button>
                                        </div>

                                        <label className="mt-4 grid gap-2 text-sm font-semibold text-cyan-50">
                                            <span>Title</span>
                                            <input
                                                type="text"
                                                value={note.title}
                                                onChange={(event) =>
                                                    updateNote(note.id, 'title', event.target.value)
                                                }
                                                placeholder="メモタイトル"
                                                className="h-10 w-full max-w-md rounded-xl border border-white/30 bg-white/14 px-3 text-sm text-white outline-none backdrop-blur-xl placeholder:text-cyan-50/50 focus:border-cyan-100/75 focus:ring-4 focus:ring-cyan-100/24"
                                            />
                                        </label>

                                        <label className="mt-4 grid gap-2 text-sm font-semibold text-cyan-50">
                                            <span>Body</span>
                                            <textarea
                                                value={note.body}
                                                onChange={(event) =>
                                                    updateNote(note.id, 'body', event.target.value)
                                                }
                                                placeholder="このAPIについての調査メモを書く"
                                                className="min-h-[120px] w-full resize-y rounded-xl border border-white/30 bg-white/14 p-3 text-sm leading-7 text-white outline-none backdrop-blur-xl placeholder:text-cyan-50/50 focus:border-cyan-100/75 focus:ring-4 focus:ring-cyan-100/24"
                                            />
                                        </label>
                                    </article>
                                ))}

                                {notes.length === 0 && (
                                    <div className="rounded-2xl border border-white/24 bg-white/8 p-5 text-center text-sm font-semibold text-cyan-50/76 backdrop-blur-xl">
                                        メモはありません。+ メモ追加から追加できます。
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <aside className="rounded-2xl border border-white/35 bg-slate-950/36 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.36),0_18px_40px_rgba(2,24,45,0.20)] backdrop-blur-2xl sm:p-6">
                        <button
                            type="button"
                            onClick={() => setIsTechnicalOpen((current) => !current)}
                            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-cyan-100/35 bg-cyan-50/15 px-4 text-left text-sm font-bold text-cyan-50 transition hover:bg-cyan-50/24 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/30"
                            aria-expanded={isTechnicalOpen}
                        >
                            <span>{isTechnicalOpen ? '技術情報を隠す' : '技術情報を表示'}</span>
                            <span aria-hidden="true">{isTechnicalOpen ? '↑' : '↓'}</span>
                        </button>

                        {isTechnicalOpen && (
                            <dl className="mt-4 grid gap-2 text-sm">
                                {technicalRows.map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="rounded-xl border border-white/15 bg-black/18 p-3"
                                    >
                                        <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/56">
                                            {label}
                                        </dt>
                                        <dd className="mt-1 break-all font-mono text-xs leading-5 text-cyan-50/88">
                                            {value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </aside>
                </div>
            </div>
        </PublicLayout>
    );
}
