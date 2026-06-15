import { useState, type ReactNode } from 'react';

import type {
    DetailRow,
    FileImportItem,
    PhotoQueueItem,
    WorkCard,
} from './mockData';
import { cardKindLabels, cardKindStyles } from './mockData';

type WorkCardDetailPanelProps = {
    card: WorkCard;
    onBackToProject: () => void;
    onSaveCard: (card: WorkCard) => void;
    onDeleteCard: (cardId: string) => void;
};

type BasicDraft = {
    title: string;
    status: string;
    amount: string;
    summary: string;
};

type EditModal =
    | {
          type: 'basic';
          draft: BasicDraft;
      }
    | {
          type: 'detail';
          rowId: string;
          draft: DetailRow;
      }
    | {
          type: 'memo';
          draft: string;
      }
    | {
          type: 'photo';
          photoId: string;
          draft: PhotoQueueItem;
      }
    | {
          type: 'file';
          fileId: string;
          draft: FileImportItem;
      };

export default function WorkCardDetailPanel({
    card,
    onBackToProject,
    onSaveCard,
    onDeleteCard,
}: WorkCardDetailPanelProps) {
    const styles = cardKindStyles[card.kind];
    const [editModal, setEditModal] = useState<EditModal | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const openBasicEdit = () => {
        setEditModal({
            type: 'basic',
            draft: {
                title: card.title,
                status: card.status,
                amount: card.amount,
                summary: card.summary,
            },
        });
    };

    const addDetailRow = () => {
        onSaveCard({
            ...card,
            detailRows: [
                ...card.detailRows,
                {
                    id: `row-${card.id}-${Date.now()}`,
                    content: '追加明細',
                    displayLabel: '数量',
                    measuredValue: '1',
                    unit: '式',
                    fixedAmount: '0円',
                    memo: '',
                },
            ],
        });
    };

    const saveEditModal = () => {
        if (!editModal) {
            return;
        }

        if (editModal.type === 'basic') {
            onSaveCard({
                ...card,
                ...editModal.draft,
            });
        }

        if (editModal.type === 'detail') {
            onSaveCard({
                ...card,
                detailRows: card.detailRows.map((row) =>
                    row.id === editModal.rowId ? editModal.draft : row,
                ),
            });
        }

        if (editModal.type === 'memo') {
            onSaveCard({
                ...card,
                hasMemo: editModal.draft.trim().length > 0,
                memo: editModal.draft,
            });
        }

        if (editModal.type === 'photo') {
            onSaveCard({
                ...card,
                photos: card.photos.map((photo) =>
                    photo.id === editModal.photoId ? editModal.draft : photo,
                ),
            });
        }

        if (editModal.type === 'file') {
            onSaveCard({
                ...card,
                files: card.files.map((file) =>
                    file.id === editModal.fileId ? editModal.draft : file,
                ),
            });
        }

        setEditModal(null);
    };

    return (
        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <header className={`shrink-0 border-b p-2 ${styles.panel}`}>
                <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                    <button
                        type="button"
                        onClick={onBackToProject}
                        className="min-h-8 w-fit rounded-md border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        案件詳細へ戻る
                    </button>
                    <div className="min-w-0">
                        <span
                            className={`w-fit rounded-md border px-2 py-0.5 text-xs font-bold ${styles.badge}`}
                        >
                            {cardKindLabels[card.kind]}
                        </span>
                        <h2 className="mt-1 break-words text-base font-bold text-slate-950 sm:text-lg">
                            {card.title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => setDeleteModalOpen(true)}
                        className="min-h-9 rounded-md bg-rose-600 px-3 text-xs font-bold text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
                    >
                        削除
                    </button>
                </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <div className="grid gap-3">
                    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-base font-bold text-slate-950">
                                カード基本情報
                            </h3>
                            <button
                                type="button"
                                onClick={openBasicEdit}
                                className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                            >
                                編集
                            </button>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            <InfoButton
                                label="カード種別"
                                value={cardKindLabels[card.kind]}
                                onClick={openBasicEdit}
                            />
                            <InfoButton
                                label="カード名"
                                value={card.title}
                                onClick={openBasicEdit}
                            />
                            <InfoButton
                                label="状態"
                                value={card.status}
                                onClick={openBasicEdit}
                            />
                            <InfoButton
                                label="金額"
                                value={card.amount}
                                onClick={openBasicEdit}
                            />
                            <InfoButton
                                label="作業内容メモ"
                                value={card.summary}
                                onClick={openBasicEdit}
                            />
                            <InfoButton
                                label="写真 / ファイル"
                                value={`${card.hasPhotos ? '写真あり' : '写真なし'} / ${
                                    card.hasFiles ? 'ファイルあり' : 'ファイルなし'
                                }`}
                                onClick={openBasicEdit}
                            />
                        </div>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-base font-bold text-slate-950">
                                詳細
                            </h3>
                            <button
                                type="button"
                                onClick={addDetailRow}
                                className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                            >
                                追加
                            </button>
                        </div>

                        <div className="mt-3 grid gap-2">
                            {card.detailRows.map((row) => (
                                <button
                                    key={row.id}
                                    type="button"
                                    onClick={() =>
                                        setEditModal({
                                            type: 'detail',
                                            rowId: row.id,
                                            draft: row,
                                        })
                                    }
                                    className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-sky-300 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 sm:grid-cols-3"
                                >
                                    <DetailValue label="内容" value={row.content} />
                                    <DetailValue
                                        label="表示ラベル"
                                        value={row.displayLabel}
                                    />
                                    <DetailValue
                                        label="計測値 / 単位"
                                        value={`${row.measuredValue} ${row.unit}`}
                                    />
                                    <DetailValue
                                        label="確定金額"
                                        value={row.fixedAmount}
                                    />
                                    <DetailValue label="メモ" value={row.memo} />
                                    <span className="self-end text-xs font-bold text-sky-700">
                                        編集する
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-lg border border-amber-200 bg-amber-50 p-3 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-base font-bold text-amber-950">メモ</h3>
                            <button
                                type="button"
                                onClick={() =>
                                    setEditModal({
                                        type: 'memo',
                                        draft: card.memo,
                                    })
                                }
                                className="h-8 rounded-md border border-amber-300 bg-white px-2.5 text-xs font-bold text-amber-900 transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-100"
                            >
                                編集
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                setEditModal({
                                    type: 'memo',
                                    draft: card.memo,
                                })
                            }
                            className="mt-3 w-full rounded-lg border border-amber-200 bg-white p-3 text-left text-sm leading-7 text-amber-950 transition hover:border-amber-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-100"
                        >
                            {card.memo}
                        </button>
                    </section>

                    <section className="grid gap-3 lg:grid-cols-2">
                        <MediaPanel
                            title="写真"
                            tone="blue"
                            emptyLabel="写真なし"
                            items={
                                card.photos.length > 0
                                    ? card.photos
                                    : [
                                          {
                                              id: 'empty-photo',
                                              title: 'サムネイル枠',
                                              memo: '写真なしの空状態',
                                              status: '投入待ち',
                                          },
                                      ]
                            }
                            onOpen={(photo) => {
                                if (photo.id === 'empty-photo') {
                                    return;
                                }

                                setEditModal({
                                    type: 'photo',
                                    photoId: photo.id,
                                    draft: photo,
                                });
                            }}
                        />
                        <FilePanel
                            items={
                                card.files.length > 0
                                    ? card.files
                                    : [
                                          {
                                              id: 'empty-file',
                                              fileName: '未選択',
                                              displayName: 'ファイルなし',
                                              memo: '空状態',
                                              status: '投入待ち',
                                          },
                                      ]
                            }
                            onOpen={(file) => {
                                if (file.id === 'empty-file') {
                                    return;
                                }

                                setEditModal({
                                    type: 'file',
                                    fileId: file.id,
                                    draft: file,
                                });
                            }}
                        />
                    </section>
                </div>
            </div>

            {editModal && (
                <Modal
                    title={getEditModalTitle(editModal)}
                    onClose={() => setEditModal(null)}
                    onSave={saveEditModal}
                    saveLabel="保存"
                >
                    {editModal.type === 'basic' && (
                        <div className="grid gap-3">
                            <TextField
                                label="カード名"
                                value={editModal.draft.title}
                                onChange={(value) =>
                                    setEditModal({
                                        ...editModal,
                                        draft: {
                                            ...editModal.draft,
                                            title: value,
                                        },
                                    })
                                }
                            />
                            <TextField
                                label="状態"
                                value={editModal.draft.status}
                                onChange={(value) =>
                                    setEditModal({
                                        ...editModal,
                                        draft: {
                                            ...editModal.draft,
                                            status: value,
                                        },
                                    })
                                }
                            />
                            <TextField
                                label="金額"
                                value={editModal.draft.amount}
                                onChange={(value) =>
                                    setEditModal({
                                        ...editModal,
                                        draft: {
                                            ...editModal.draft,
                                            amount: value,
                                        },
                                    })
                                }
                            />
                            <TextField
                                label="作業内容メモ"
                                value={editModal.draft.summary}
                                onChange={(value) =>
                                    setEditModal({
                                        ...editModal,
                                        draft: {
                                            ...editModal.draft,
                                            summary: value,
                                        },
                                    })
                                }
                                multiline
                            />
                        </div>
                    )}

                    {editModal.type === 'detail' && (
                        <div className="grid gap-3">
                            <TextField
                                label="内容"
                                value={editModal.draft.content}
                                onChange={(value) =>
                                    setEditModal({
                                        ...editModal,
                                        draft: {
                                            ...editModal.draft,
                                            content: value,
                                        },
                                    })
                                }
                            />
                            <TextField
                                label="表示ラベル"
                                value={editModal.draft.displayLabel}
                                onChange={(value) =>
                                    setEditModal({
                                        ...editModal,
                                        draft: {
                                            ...editModal.draft,
                                            displayLabel: value,
                                        },
                                    })
                                }
                            />
                            <div className="grid gap-3 sm:grid-cols-2">
                                <TextField
                                    label="計測値"
                                    value={editModal.draft.measuredValue}
                                    onChange={(value) =>
                                        setEditModal({
                                            ...editModal,
                                            draft: {
                                                ...editModal.draft,
                                                measuredValue: value,
                                            },
                                        })
                                    }
                                />
                                <TextField
                                    label="単位"
                                    value={editModal.draft.unit}
                                    onChange={(value) =>
                                        setEditModal({
                                            ...editModal,
                                            draft: {
                                                ...editModal.draft,
                                                unit: value,
                                            },
                                        })
                                    }
                                />
                            </div>
                            <TextField
                                label="確定金額"
                                value={editModal.draft.fixedAmount}
                                onChange={(value) =>
                                    setEditModal({
                                        ...editModal,
                                        draft: {
                                            ...editModal.draft,
                                            fixedAmount: value,
                                        },
                                    })
                                }
                            />
                            <TextField
                                label="メモ"
                                value={editModal.draft.memo}
                                onChange={(value) =>
                                    setEditModal({
                                        ...editModal,
                                        draft: {
                                            ...editModal.draft,
                                            memo: value,
                                        },
                                    })
                                }
                                multiline
                            />
                        </div>
                    )}

                    {editModal.type === 'memo' && (
                        <TextField
                            label="メモ"
                            value={editModal.draft}
                            onChange={(value) =>
                                setEditModal({
                                    ...editModal,
                                    draft: value,
                                })
                            }
                            multiline
                        />
                    )}

                    {editModal.type === 'photo' && (
                        <div className="grid gap-3">
                            <TextField
                                label="写真名"
                                value={editModal.draft.title}
                                onChange={(value) =>
                                    setEditModal({
                                        ...editModal,
                                        draft: {
                                            ...editModal.draft,
                                            title: value,
                                        },
                                    })
                                }
                            />
                            <TextField
                                label="状態"
                                value={editModal.draft.status}
                                onChange={(value) =>
                                    setEditModal({
                                        ...editModal,
                                        draft: {
                                            ...editModal.draft,
                                            status: value,
                                        },
                                    })
                                }
                            />
                            <TextField
                                label="備考"
                                value={editModal.draft.memo}
                                onChange={(value) =>
                                    setEditModal({
                                        ...editModal,
                                        draft: {
                                            ...editModal.draft,
                                            memo: value,
                                        },
                                    })
                                }
                                multiline
                            />
                        </div>
                    )}

                    {editModal.type === 'file' && (
                        <div className="grid gap-3">
                            <TextField
                                label="表示名"
                                value={editModal.draft.displayName}
                                onChange={(value) =>
                                    setEditModal({
                                        ...editModal,
                                        draft: {
                                            ...editModal.draft,
                                            displayName: value,
                                        },
                                    })
                                }
                            />
                            <TextField
                                label="ファイル名"
                                value={editModal.draft.fileName}
                                onChange={(value) =>
                                    setEditModal({
                                        ...editModal,
                                        draft: {
                                            ...editModal.draft,
                                            fileName: value,
                                        },
                                    })
                                }
                            />
                            <TextField
                                label="状態"
                                value={editModal.draft.status}
                                onChange={(value) =>
                                    setEditModal({
                                        ...editModal,
                                        draft: {
                                            ...editModal.draft,
                                            status: value,
                                        },
                                    })
                                }
                            />
                            <TextField
                                label="備考"
                                value={editModal.draft.memo}
                                onChange={(value) =>
                                    setEditModal({
                                        ...editModal,
                                        draft: {
                                            ...editModal.draft,
                                            memo: value,
                                        },
                                    })
                                }
                                multiline
                            />
                        </div>
                    )}
                </Modal>
            )}

            {deleteModalOpen && (
                <Modal
                    title="カードを削除しますか"
                    onClose={() => setDeleteModalOpen(false)}
                    onSave={() => onDeleteCard(card.id)}
                    saveLabel="削除"
                    destructive
                >
                    <p className="text-sm leading-7 text-slate-700">
                        {card.title} をカード一覧から削除します。MOCK上の表示だけを変更し、DB保存や本番削除処理は行いません。
                    </p>
                </Modal>
            )}
        </section>
    );
}

function InfoButton({
    label,
    value,
    onClick,
}: {
    label: string;
    value: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="grid gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-sky-300 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
        >
            <span className="text-xs font-semibold text-slate-500">{label}</span>
            <span
                className={[
                    'break-words text-sm font-bold',
                    isNegativeAmount(value) ? 'text-rose-600' : 'text-slate-900',
                ].join(' ')}
            >
                {value}
            </span>
        </button>
    );
}

function DetailValue({ label, value }: { label: string; value: string }) {
    return (
        <span className="grid gap-1">
            <span className="text-xs font-semibold text-slate-500">{label}</span>
            <span
                className={[
                    'break-words text-sm font-bold',
                    isNegativeAmount(value) ? 'text-rose-600' : 'text-slate-900',
                ].join(' ')}
            >
                {value}
            </span>
        </span>
    );
}

function MediaPanel({
    title,
    tone,
    emptyLabel,
    items,
    onOpen,
}: {
    title: string;
    tone: 'blue';
    emptyLabel: string;
    items: PhotoQueueItem[];
    onOpen: (item: PhotoQueueItem) => void;
}) {
    const panelClass =
        tone === 'blue'
            ? 'border-blue-200 bg-blue-50 text-blue-950'
            : 'border-slate-200 bg-slate-50 text-slate-950';

    return (
        <section className={`rounded-lg border p-3 shadow-sm ${panelClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold">{title}</h3>
                <button
                    type="button"
                    className="h-8 rounded-md bg-blue-700 px-2.5 text-xs font-bold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                >
                    撮影
                </button>
            </div>

            <div className="mt-3 grid gap-2">
                {items.map((photo) => (
                    <button
                        key={photo.id}
                        type="button"
                        onClick={() => onOpen(photo)}
                        className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 rounded-lg border border-blue-200 bg-white p-3 text-left transition hover:border-blue-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                    >
                        <span className="grid aspect-square place-items-center rounded-lg border border-blue-200 bg-blue-100 text-xs font-bold text-blue-900">
                            Photo
                        </span>
                        <span className="min-w-0">
                            <span className="block font-bold text-blue-950">
                                {photo.title || emptyLabel}
                            </span>
                            <span className="mt-1 block text-sm leading-6 text-blue-900">
                                {photo.memo}
                            </span>
                            <span className="mt-2 inline-flex rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-bold text-blue-900">
                                {photo.status}
                            </span>
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
}

function FilePanel({
    items,
    onOpen,
}: {
    items: FileImportItem[];
    onOpen: (item: FileImportItem) => void;
}) {
    return (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-950 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold">ファイル</h3>
                <button
                    type="button"
                    className="h-8 rounded-md bg-emerald-700 px-2.5 text-xs font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
                >
                    ファイル選択
                </button>
            </div>

            <div className="mt-3 rounded-lg border-2 border-dashed border-emerald-300 bg-white p-3 text-center text-xs font-bold text-emerald-900">
                ドラッグ＆ドロップ
            </div>

            <div className="mt-3 grid gap-2">
                {items.map((file) => (
                    <button
                        key={file.id}
                        type="button"
                        onClick={() => onOpen(file)}
                        className="rounded-lg border border-emerald-200 bg-white p-3 text-left transition hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
                    >
                        <span className="block break-words font-bold text-emerald-950">
                            {file.displayName}
                        </span>
                        <span className="mt-1 block break-words text-sm text-emerald-900">
                            {file.fileName}
                        </span>
                        <span className="mt-2 block text-sm leading-6 text-emerald-900">
                            {file.memo}
                        </span>
                        <span className="mt-2 inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-900">
                            {file.status}
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
}

function Modal({
    title,
    children,
    onClose,
    onSave,
    saveLabel,
    destructive = false,
}: {
    title: string;
    children: ReactNode;
    onClose: () => void;
    onSave: () => void;
    saveLabel: string;
    destructive?: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-3">
            <div className="max-h-[88dvh] w-full max-w-xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
                    <h4 className="text-base font-bold text-slate-950">{title}</h4>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        閉じる
                    </button>
                </div>
                <div className="max-h-[58dvh] overflow-y-auto px-4 py-3">{children}</div>
                <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        キャンセル
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        className={[
                            'min-h-9 rounded-md px-3 text-xs font-bold text-white transition focus-visible:outline-none focus-visible:ring-4',
                            destructive
                                ? 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-100'
                                : 'bg-sky-700 hover:bg-sky-800 focus-visible:ring-sky-100',
                        ].join(' ')}
                    >
                        {saveLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

function TextField({
    label,
    value,
    onChange,
    multiline = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    multiline?: boolean;
}) {
    return (
        <label className="grid gap-1">
            <span className="text-xs font-bold text-slate-600">{label}</span>
            {multiline ? (
                <textarea
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    rows={4}
                    className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
            ) : (
                <input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
            )}
        </label>
    );
}

function getEditModalTitle(editModal: EditModal) {
    if (editModal.type === 'basic') {
        return 'カード基本情報を編集';
    }

    if (editModal.type === 'detail') {
        return '詳細を編集';
    }

    if (editModal.type === 'memo') {
        return 'メモを編集';
    }

    if (editModal.type === 'photo') {
        return '写真情報を編集';
    }

    return 'ファイル情報を編集';
}

function isNegativeAmount(value: string) {
    return value.trim().startsWith('-');
}
