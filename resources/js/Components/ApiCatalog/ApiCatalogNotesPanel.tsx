import { useState } from 'react';

type ApiCatalogNote = {
    id: string;
    title: string;
    body: string;
};

type ApiCatalogNoteField = keyof Pick<ApiCatalogNote, 'title' | 'body'>;

function createApiCatalogNote(): ApiCatalogNote {
    /*
     * まだ保存用テーブル/Actionは作らず、画面内の一時メモとして扱います。
     * id は React の描画安定化だけに使い、DBには保存しません。
     */
    return {
        id: `api-catalog-note-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: '',
        body: '',
    };
}

export default function ApiCatalogNotesPanel() {
    const [notes, setNotes] = useState<ApiCatalogNote[]>(() => [createApiCatalogNote()]);

    const addNote = () => {
        setNotes((currentNotes) => [...currentNotes, createApiCatalogNote()]);
    };

    const updateNote = (noteId: string, field: ApiCatalogNoteField, value: string) => {
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

    return (
        <div className="mt-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-white">調査メモ</h3>
                    <p className="mt-1 text-xs font-semibold text-cyan-100/64">
                        このメモは画面内の一時入力です。まだ保存されません。
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
                本番/モックで同じメモUIを使います。
                永続化責務はまだ持たせず、保存仕様が決まるまでは React state の表示確認に限定します。
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
    );
}
