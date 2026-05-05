import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export type ApiCatalogNoteItem = {
    id: number;
    title: string | null;
    body: string;
    createdAt: string | null;
    updatedAt: string | null;
};

type EditableApiCatalogNote = {
    id: number | string;
    title: string;
    body: string;
    isNew: boolean;
};

type ApiCatalogNotesPanelProps = {
    notes?: ApiCatalogNoteItem[];
    isPersistable: boolean;
    storeUrl?: string;
    updateUrl?: (note: ApiCatalogNoteItem) => string;
    deleteUrl?: (note: ApiCatalogNoteItem) => string;
};

type ApiCatalogNoteField = keyof Pick<EditableApiCatalogNote, 'title' | 'body'>;

function createDraftNote(): EditableApiCatalogNote {
    /*
     * 未保存メモはDB IDを持たないため、React描画用の一時IDだけを持たせます。
     * persistable=false のモックも同じdraft構造で扱い、保存URLは呼びません。
     */
    return {
        id: `api-catalog-note-draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: '',
        body: '',
        isNew: true,
    };
}

function toEditableNote(note: ApiCatalogNoteItem): EditableApiCatalogNote {
    return {
        id: note.id,
        title: note.title ?? '',
        body: note.body,
        isNew: false,
    };
}

function toPersistedNote(note: EditableApiCatalogNote): ApiCatalogNoteItem | null {
    if (note.isNew || typeof note.id !== 'number') {
        return null;
    }

    return {
        id: note.id,
        title: note.title,
        body: note.body,
        createdAt: null,
        updatedAt: null,
    };
}

function normalizePayload(note: EditableApiCatalogNote) {
    return {
        title: note.title.trim() === '' ? null : note.title.trim(),
        body: note.body.trim(),
    };
}

export default function ApiCatalogNotesPanel({
    notes = [],
    isPersistable,
    storeUrl,
    updateUrl,
    deleteUrl,
}: ApiCatalogNotesPanelProps) {
    const [editableNotes, setEditableNotes] = useState<EditableApiCatalogNote[]>(() =>
        isPersistable ? notes.map(toEditableNote) : [createDraftNote()],
    );
    const [processingNoteId, setProcessingNoteId] = useState<number | string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    useEffect(() => {
        /*
         * 本番詳細では保存後のリダイレクトで最新 props が返るため、DBの状態に同期します。
         * モックは画面内 state のまま確認したいので、props同期で入力中メモを消しません。
         */
        if (isPersistable) {
            setEditableNotes(notes.map(toEditableNote));
        }
    }, [isPersistable, notes]);

    const addNote = () => {
        setEditableNotes((currentNotes) => [...currentNotes, createDraftNote()]);
        setStatusMessage(null);
    };

    const updateNoteField = (noteId: number | string, field: ApiCatalogNoteField, value: string) => {
        setEditableNotes((currentNotes) =>
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

    const removeLocalNote = (noteId: number | string) => {
        setEditableNotes((currentNotes) => currentNotes.filter((note) => note.id !== noteId));
    };

    const saveNote = (note: EditableApiCatalogNote) => {
        /*
         * Component は保存先URLを props として受け取るだけです。
         * どのAPIに属するか、どのnoteを更新できるかの判断はAction/Repository側で行います。
         */
        if (!isPersistable || !storeUrl) {
            return;
        }

        const payload = normalizePayload(note);

        if (payload.body === '') {
            setStatusMessage('本文を入力してください。');
            return;
        }

        setProcessingNoteId(note.id);
        setStatusMessage(null);

        if (note.isNew) {
            router.post(storeUrl, payload, {
                preserveScroll: true,
                onSuccess: () => setStatusMessage('メモを保存しました。'),
                onError: () => setStatusMessage('メモの保存に失敗しました。入力内容を確認してください。'),
                onFinish: () => setProcessingNoteId(null),
            });

            return;
        }

        const persistedNote = toPersistedNote(note);

        if (!persistedNote || !updateUrl) {
            setProcessingNoteId(null);
            return;
        }

        router.patch(updateUrl(persistedNote), payload, {
            preserveScroll: true,
            onSuccess: () => setStatusMessage('メモを更新しました。'),
            onError: () => setStatusMessage('メモの更新に失敗しました。入力内容を確認してください。'),
            onFinish: () => setProcessingNoteId(null),
        });
    };

    const deleteNote = (note: EditableApiCatalogNote) => {
        if (!isPersistable || note.isNew) {
            removeLocalNote(note.id);
            return;
        }

        const persistedNote = toPersistedNote(note);

        if (!persistedNote || !deleteUrl) {
            return;
        }

        setProcessingNoteId(note.id);
        setStatusMessage(null);

        router.delete(deleteUrl(persistedNote), {
            preserveScroll: true,
            onSuccess: () => setStatusMessage('メモを削除しました。'),
            onError: () => setStatusMessage('メモの削除に失敗しました。'),
            onFinish: () => setProcessingNoteId(null),
        });
    };

    return (
        <div className="mt-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-white">調査メモ</h3>
                    <p className="mt-1 text-xs font-semibold text-cyan-100/64">
                        {isPersistable
                            ? '保存できます。本文を入力して保存してください。'
                            : 'このメモは画面内の一時入力です。モックのため保存されません。'}
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

            {statusMessage && (
                <div
                    role="status"
                    aria-live="polite"
                    className="mt-4 rounded-xl border border-cyan-100/25 bg-cyan-50/12 px-3 py-2 text-sm font-semibold text-cyan-50/86"
                >
                    {statusMessage}
                </div>
            )}

            <div className="mt-4 grid gap-3">
                {editableNotes.map((note, index) => {
                    const isProcessing = processingNoteId === note.id;
                    const canPersist = isPersistable && note.body.trim() !== '';

                    return (
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
                                    onClick={() => deleteNote(note)}
                                    disabled={isProcessing}
                                    className="inline-flex min-h-8 items-center justify-center rounded-lg border border-rose-100/25 bg-rose-100/8 px-3 text-xs font-semibold text-rose-50/86 transition hover:bg-rose-100/16 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100/20 disabled:cursor-wait disabled:opacity-55"
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
                                        updateNoteField(note.id, 'title', event.target.value)
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
                                        updateNoteField(note.id, 'body', event.target.value)
                                    }
                                    placeholder="このAPIについての調査メモを書く"
                                    className="min-h-[120px] w-full resize-y rounded-xl border border-white/30 bg-white/14 p-3 text-sm leading-7 text-white outline-none backdrop-blur-xl placeholder:text-cyan-50/50 focus:border-cyan-100/75 focus:ring-4 focus:ring-cyan-100/24"
                                />
                            </label>

                            {isPersistable && (
                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => saveNote(note)}
                                        disabled={!canPersist || isProcessing}
                                        className="inline-flex min-h-9 items-center justify-center rounded-lg border border-cyan-100/35 bg-cyan-50/15 px-4 text-sm font-bold text-cyan-50 transition hover:bg-cyan-50/24 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/24 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isProcessing ? '処理中' : note.isNew ? '保存' : '更新'}
                                    </button>
                                </div>
                            )}
                        </article>
                    );
                })}

                {editableNotes.length === 0 && (
                    <div className="rounded-2xl border border-white/24 bg-white/8 p-5 text-center text-sm font-semibold text-cyan-50/76 backdrop-blur-xl">
                        メモはありません。+ メモ追加から追加できます。
                    </div>
                )}
            </div>
        </div>
    );
}
