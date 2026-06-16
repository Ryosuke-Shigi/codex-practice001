import {
    useState,
    type ChangeEvent,
    type DragEvent,
    type ReactNode,
} from 'react';
import {
    AlertTriangle,
    ArrowLeft,
    Box,
    ChevronRight,
    Menu,
    Plus,
    SlidersHorizontal,
    Trash2,
    Wrench,
} from 'lucide-react';

import type { CardInputDraft, CardKind, Project, WorkCard } from './mockData';
import { cardKindLabels } from './mockData';
import type { FileImportItem, PhotoQueueItem } from './mockData';

type DetailSection = 'product' | 'work' | 'adjustment' | 'exception';
type DetailScreen = 'top' | DetailSection;
type CardHandling = 'あり' | 'なし';
type SectionTone = 'green' | 'blue' | 'orange' | 'purple';
type WorkAddStep = 'closed' | 'select' | 'input';
type AddOnlyCardKind = 'adjustment' | 'exception';

type WorkCardInputDraft = {
    item1: string;
    item2: string;
    item3: string;
    memo: string;
};

type CardEditDraft = WorkCardInputDraft & {
    title: string;
    photos: PhotoQueueItem[];
    files: FileImportItem[];
};

type ProjectWorkDetailPanelProps = {
    project: Project;
    onAddCard: (kind: CardKind, draft?: CardInputDraft) => void;
    onDeleteCard: (cardId: string) => void;
    onSaveCard: (card: WorkCard) => void;
    initialScreen?: DetailScreen;
    initialProductAddModalOpen?: boolean;
    initialWorkAddStep?: WorkAddStep;
    initialAddOnlyModalKind?: AddOnlyCardKind | null;
    initialEditCardId?: string | null;
};

const sectionConfigs: {
    key: DetailSection;
    label: string;
    cardLabel: string;
    icon: typeof Box;
    tone: SectionTone;
}[] = [
    {
        key: 'product',
        label: '商品',
        cardLabel: '商品カード',
        icon: Box,
        tone: 'green',
    },
    {
        key: 'work',
        label: '作業',
        cardLabel: '作業カード',
        icon: Wrench,
        tone: 'blue',
    },
    {
        key: 'adjustment',
        label: '調整',
        cardLabel: '調整カード',
        icon: SlidersHorizontal,
        tone: 'orange',
    },
    {
        key: 'exception',
        label: '例外対応',
        cardLabel: '例外対応カード',
        icon: AlertTriangle,
        tone: 'purple',
    },
];

const sectionToneClasses: Record<
    SectionTone,
    {
        text: string;
        border: string;
        soft: string;
        button: string;
        ring: string;
    }
> = {
    green: {
        text: 'text-emerald-700',
        border: 'border-emerald-300',
        soft: 'bg-emerald-50',
        button: 'border-emerald-300 text-emerald-800 hover:bg-emerald-50',
        ring: 'focus-visible:ring-emerald-100',
    },
    blue: {
        text: 'text-blue-700',
        border: 'border-blue-300',
        soft: 'bg-blue-50',
        button: 'border-blue-300 text-blue-800 hover:bg-blue-50',
        ring: 'focus-visible:ring-blue-100',
    },
    orange: {
        text: 'text-orange-700',
        border: 'border-orange-300',
        soft: 'bg-orange-50',
        button: 'border-orange-300 text-orange-800 hover:bg-orange-50',
        ring: 'focus-visible:ring-orange-100',
    },
    purple: {
        text: 'text-purple-700',
        border: 'border-purple-300',
        soft: 'bg-purple-50',
        button: 'border-purple-300 text-purple-800 hover:bg-purple-50',
        ring: 'focus-visible:ring-purple-100',
    },
};

const workCardCandidates = [
    '現地確認',
    '足場確認',
    '養生確認',
    '施工日調整',
    '施工完了',
    '写真登録',
    '検収',
];

const initialWorkCardDraft: WorkCardInputDraft = {
    item1: '',
    item2: '',
    item3: '',
    memo: '',
};

const emptyCardEditDraft: CardEditDraft = {
    title: '',
    item1: '',
    item2: '',
    item3: '',
    memo: '',
    photos: [],
    files: [],
};

function createCardEditDraft(card: WorkCard): CardEditDraft {
    return {
        title: card.title,
        item1: card.detailRows[0]?.content ?? '',
        item2: card.detailRows[0]?.memo ?? '',
        item3: card.summary,
        memo: card.memo,
        photos: card.photos,
        files: card.files,
    };
}

export default function ProjectWorkDetailPanel({
    project,
    onAddCard,
    onDeleteCard,
    onSaveCard,
    initialScreen = 'top',
    initialProductAddModalOpen = false,
    initialWorkAddStep = 'closed',
    initialAddOnlyModalKind = null,
    initialEditCardId = null,
}: ProjectWorkDetailPanelProps) {
    const initialEditCard =
        initialEditCardId
            ? project.cards.find((card) => card.id === initialEditCardId) ?? null
            : null;
    const [activeScreen, setActiveScreen] = useState<DetailScreen>(initialScreen);
    const [productHandling, setProductHandling] = useState<CardHandling>('あり');
    const [workHandling, setWorkHandling] = useState<CardHandling>('あり');
    const [productNoneReason, setProductNoneReason] = useState('');
    const [workNoneReason, setWorkNoneReason] = useState('');
    const [productAddModalOpen, setProductAddModalOpen] = useState(
        initialProductAddModalOpen,
    );
    const [productCardDraft, setProductCardDraft] =
        useState<WorkCardInputDraft>(initialWorkCardDraft);
    const [workAddStep, setWorkAddStep] =
        useState<WorkAddStep>(initialWorkAddStep);
    const [selectedWorkCandidate, setSelectedWorkCandidate] = useState(
        workCardCandidates[0],
    );
    const [workCardDraft, setWorkCardDraft] =
        useState<WorkCardInputDraft>(initialWorkCardDraft);
    const [addOnlyModalKind, setAddOnlyModalKind] =
        useState<AddOnlyCardKind | null>(initialAddOnlyModalKind);
    const [addOnlyCardDraft, setAddOnlyCardDraft] =
        useState<WorkCardInputDraft>(initialWorkCardDraft);
    const [editingCard, setEditingCard] = useState<WorkCard | null>(
        initialEditCard,
    );
    const [cardEditDraft, setCardEditDraft] = useState<CardEditDraft>(
        initialEditCard ? createCardEditDraft(initialEditCard) : emptyCardEditDraft,
    );

    const productCards = project.cards.filter((card) => card.kind === 'product');
    const workCards = project.cards.filter((card) => card.kind === 'work');
    const adjustmentCards = project.cards.filter(
        (card) => card.kind === 'adjustment',
    );
    const exceptionCards = project.cards.filter(
        (card) => card.kind === 'exception',
    );

    const cardGroups: Record<DetailSection, WorkCard[]> = {
        product: productCards,
        work: workCards,
        adjustment: adjustmentCards,
        exception: exceptionCards,
    };

    const openWorkCardInput = (candidate: string) => {
        setSelectedWorkCandidate(candidate);
        setWorkCardDraft(initialWorkCardDraft);
        setWorkAddStep('input');
    };

    const saveProductCardInput = () => {
        onAddCard('product', {
            title: productCardDraft.item1,
            ...productCardDraft,
        });
        setProductAddModalOpen(false);
        setProductCardDraft(initialWorkCardDraft);
        setActiveScreen('product');
    };

    const saveWorkCardInput = () => {
        onAddCard('work', {
            title: selectedWorkCandidate,
            ...workCardDraft,
        });
        setWorkAddStep('closed');
        setWorkCardDraft(initialWorkCardDraft);
        setActiveScreen('work');
    };

    const saveAddOnlyCardInput = () => {
        if (!addOnlyModalKind) {
            return;
        }

        onAddCard(addOnlyModalKind, {
            title: addOnlyCardDraft.item1,
            ...addOnlyCardDraft,
        });
        setActiveScreen(addOnlyModalKind);
        setAddOnlyModalKind(null);
        setAddOnlyCardDraft(initialWorkCardDraft);
    };

    const openCardEdit = (card: WorkCard) => {
        setEditingCard(card);
        setCardEditDraft(createCardEditDraft(card));
    };

    const addMockPhotoToEditingCard = () => {
        setCardEditDraft((current) => {
            const nextIndex = current.photos.length + 1;

            return {
                ...current,
                photos: [
                    ...current.photos,
                    {
                        id: `mock-photo-${Date.now()}`,
                        title: `写真 ${nextIndex}`,
                        memo: '連続撮影で追加',
                        status: '保存待ち',
                        classification: 'カード写真',
                        capturedAt: '撮影待ち',
                    },
                ],
            };
        });
    };

    const addFilesToEditingCard = (files: File[]) => {
        if (files.length === 0) {
            return;
        }

        setCardEditDraft((current) => {
            const nextIndex = current.files.length + 1;
            const addedFiles: FileImportItem[] = files.map((file, offset) => ({
                id: `mock-file-${Date.now()}-${offset}`,
                fileName: file.name,
                displayName: file.name,
                memo: `${nextIndex + offset}件目`,
                status: '受付待ち',
                classification: 'カード添付',
            }));

            return {
                ...current,
                files: [...current.files, ...addedFiles],
            };
        });
    };

    const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
        addFilesToEditingCard(Array.from(event.target.files ?? []));
        event.target.value = '';
    };

    const handleFileDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        addFilesToEditingCard(Array.from(event.dataTransfer.files));
    };

    const saveCardEdit = () => {
        if (!editingCard) {
            return;
        }

        const detailRows =
            editingCard.detailRows.length > 0
                ? editingCard.detailRows.map((row, index) =>
                      index === 0
                          ? {
                                ...row,
                                content:
                                    cardEditDraft.item1.trim() || row.content,
                                memo: cardEditDraft.item2.trim() || row.memo,
                            }
                          : row,
                  )
                : editingCard.detailRows;

        onSaveCard({
            ...editingCard,
            title: cardEditDraft.title.trim() || editingCard.title,
            summary: cardEditDraft.item3.trim() || editingCard.summary,
            memo: cardEditDraft.memo,
            detailRows,
            photos: cardEditDraft.photos,
            files: cardEditDraft.files,
            hasPhotos: cardEditDraft.photos.length > 0,
            hasFiles: cardEditDraft.files.length > 0,
        });
        setEditingCard(null);
        setCardEditDraft(emptyCardEditDraft);
    };

    return (
        <section className="mx-auto grid w-full max-w-3xl gap-3">
            {activeScreen === 'top' && (
                <TopScreen
                    project={project}
                    sectionStatuses={{
                        product: productHandling,
                        work: workHandling,
                        adjustment:
                            adjustmentCards.length > 0 ? 'あり' : '未追加',
                        exception: exceptionCards.length > 0 ? 'あり' : '未追加',
                    }}
                    onSelectSection={setActiveScreen}
                />
            )}

            {activeScreen === 'product' && (
                <CardHandlingScreen
                    cards={productCards}
                    config={sectionConfigs[0]}
                    handling={productHandling}
                    noneReason={productNoneReason}
                    onAddCard={() => setProductAddModalOpen(true)}
                    onBack={() => setActiveScreen('top')}
                    onEditCard={openCardEdit}
                    onHandlingChange={setProductHandling}
                    onNoneReasonChange={setProductNoneReason}
                />
            )}

            {activeScreen === 'work' && (
                <CardHandlingScreen
                    cards={workCards}
                    config={sectionConfigs[1]}
                    handling={workHandling}
                    noneReason={workNoneReason}
                    onAddCard={() => setWorkAddStep('select')}
                    onBack={() => setActiveScreen('top')}
                    onEditCard={openCardEdit}
                    onHandlingChange={setWorkHandling}
                    onNoneReasonChange={setWorkNoneReason}
                    workMode
                />
            )}

            {activeScreen === 'adjustment' && (
                <AddOnlyScreen
                    cards={cardGroups.adjustment}
                    config={sectionConfigs[2]}
                    emptyLabel="調整カードはありません"
                    notice="必要時に追加"
                    onAddCard={() => setAddOnlyModalKind('adjustment')}
                    onBack={() => setActiveScreen('top')}
                    onEditCard={openCardEdit}
                />
            )}

            {activeScreen === 'exception' && (
                <AddOnlyScreen
                    cards={cardGroups.exception}
                    config={sectionConfigs[3]}
                    emptyLabel="例外対応カードはありません"
                    notice="必要時に追加"
                    onAddCard={() => setAddOnlyModalKind('exception')}
                    onBack={() => setActiveScreen('top')}
                    onEditCard={openCardEdit}
                />
            )}

            {workAddStep === 'select' && (
                <Modal
                    footer={
                        <>
                            <button
                                type="button"
                                onClick={() => setWorkAddStep('closed')}
                                className="min-h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                            >
                                キャンセル
                            </button>
                            <button
                                type="button"
                                onClick={() => openWorkCardInput(selectedWorkCandidate)}
                                className="min-h-9 rounded-md bg-blue-700 px-3 text-xs font-bold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                            >
                                次へ
                            </button>
                        </>
                    }
                    title="作業カードを選択"
                    onClose={() => setWorkAddStep('closed')}
                >
                    <div className="grid gap-2">
                        {workCardCandidates.map((candidate) => (
                            <label
                                key={candidate}
                                className={[
                                    'grid min-h-14 grid-cols-[1.2rem_minmax(0,1fr)] items-start gap-3 rounded-md border bg-white p-3 text-sm transition',
                                    selectedWorkCandidate === candidate
                                        ? 'border-blue-300 bg-blue-50'
                                        : 'border-slate-200',
                                ].join(' ')}
                            >
                                <input
                                    type="radio"
                                    checked={selectedWorkCandidate === candidate}
                                    onChange={() => setSelectedWorkCandidate(candidate)}
                                    className="mt-1 h-4 w-4"
                                />
                                <span className="block min-w-0 font-bold text-slate-950">
                                    {candidate}
                                </span>
                            </label>
                        ))}
                    </div>
                </Modal>
            )}

            {productAddModalOpen && (
                <Modal
                    footer={
                        <>
                            <button
                                type="button"
                                onClick={() => setProductAddModalOpen(false)}
                                className="min-h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                            >
                                キャンセル
                            </button>
                            <button
                                type="button"
                                onClick={saveProductCardInput}
                                className="min-h-9 rounded-md bg-emerald-700 px-3 text-xs font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
                            >
                                保存
                            </button>
                        </>
                    }
                    title="商品カード入力"
                    onClose={() => setProductAddModalOpen(false)}
                >
                    <div className="grid gap-3">
                        <TextField
                            label="項目1"
                            value={productCardDraft.item1}
                            onChange={(value) =>
                                setProductCardDraft((current) => ({
                                    ...current,
                                    item1: value,
                                }))
                            }
                        />
                        <TextField
                            label="項目2"
                            value={productCardDraft.item2}
                            onChange={(value) =>
                                setProductCardDraft((current) => ({
                                    ...current,
                                    item2: value,
                                }))
                            }
                        />
                        <TextField
                            label="項目3"
                            value={productCardDraft.item3}
                            onChange={(value) =>
                                setProductCardDraft((current) => ({
                                    ...current,
                                    item3: value,
                                }))
                            }
                        />
                        <TextField
                            label="備考"
                            value={productCardDraft.memo}
                            onChange={(value) =>
                                setProductCardDraft((current) => ({
                                    ...current,
                                    memo: value,
                                }))
                            }
                            multiline
                        />
                    </div>
                </Modal>
            )}

            {workAddStep === 'input' && (
                <Modal
                    footer={
                        <>
                            <button
                                type="button"
                                onClick={() => setWorkAddStep('select')}
                                className="min-h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                            >
                                キャンセル
                            </button>
                            <button
                                type="button"
                                onClick={saveWorkCardInput}
                                className="min-h-9 rounded-md bg-blue-700 px-3 text-xs font-bold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                            >
                                保存
                            </button>
                        </>
                    }
                    title="作業カード入力"
                    onClose={() => setWorkAddStep('closed')}
                >
                    <div className="grid gap-3">
                        <TextField
                            label="項目1"
                            value={workCardDraft.item1}
                            onChange={(value) =>
                                setWorkCardDraft((current) => ({
                                    ...current,
                                    item1: value,
                                }))
                            }
                        />
                        <TextField
                            label="項目2"
                            value={workCardDraft.item2}
                            onChange={(value) =>
                                setWorkCardDraft((current) => ({
                                    ...current,
                                    item2: value,
                                }))
                            }
                        />
                        <TextField
                            label="項目3"
                            value={workCardDraft.item3}
                            onChange={(value) =>
                                setWorkCardDraft((current) => ({
                                    ...current,
                                    item3: value,
                                }))
                            }
                        />
                        <TextField
                            label="備考"
                            value={workCardDraft.memo}
                            onChange={(value) =>
                                setWorkCardDraft((current) => ({
                                    ...current,
                                    memo: value,
                                }))
                            }
                            multiline
                        />
                    </div>
                </Modal>
            )}

            {addOnlyModalKind && (
                <Modal
                    footer={
                        <>
                            <button
                                type="button"
                                onClick={() => setAddOnlyModalKind(null)}
                                className="min-h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                            >
                                キャンセル
                            </button>
                            <button
                                type="button"
                                onClick={saveAddOnlyCardInput}
                                className="min-h-9 rounded-md bg-slate-900 px-3 text-xs font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
                            >
                                保存
                            </button>
                        </>
                    }
                    title={`${cardKindLabels[addOnlyModalKind]}入力`}
                    onClose={() => setAddOnlyModalKind(null)}
                >
                    <div className="grid gap-3">
                        <TextField
                            label="項目1"
                            value={addOnlyCardDraft.item1}
                            onChange={(value) =>
                                setAddOnlyCardDraft((current) => ({
                                    ...current,
                                    item1: value,
                                }))
                            }
                        />
                        <TextField
                            label="項目2"
                            value={addOnlyCardDraft.item2}
                            onChange={(value) =>
                                setAddOnlyCardDraft((current) => ({
                                    ...current,
                                    item2: value,
                                }))
                            }
                        />
                        <TextField
                            label="項目3"
                            value={addOnlyCardDraft.item3}
                            onChange={(value) =>
                                setAddOnlyCardDraft((current) => ({
                                    ...current,
                                    item3: value,
                                }))
                            }
                        />
                        <TextField
                            label="備考"
                            value={addOnlyCardDraft.memo}
                            onChange={(value) =>
                                setAddOnlyCardDraft((current) => ({
                                    ...current,
                                    memo: value,
                                }))
                            }
                            multiline
                        />
                    </div>
                </Modal>
            )}

            {editingCard && (
                <Modal
                    footer={
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    onDeleteCard(editingCard.id);
                                    setEditingCard(null);
                                    setCardEditDraft(emptyCardEditDraft);
                                }}
                                className="mr-auto inline-flex min-h-9 items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
                            >
                                <Trash2 aria-hidden="true" className="h-4 w-4" />
                                削除
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingCard(null)}
                                className="min-h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                            >
                                キャンセル
                            </button>
                            <button
                                type="button"
                                onClick={saveCardEdit}
                                className="min-h-9 rounded-md bg-sky-700 px-3 text-xs font-bold text-white transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                            >
                                保存
                            </button>
                        </>
                    }
                    title={`${cardKindLabels[editingCard.kind]}詳細`}
                    onClose={() => setEditingCard(null)}
                >
                    <div className="grid gap-4">
                        <TextField
                            label="カード名"
                            value={cardEditDraft.title}
                            onChange={(value) =>
                                setCardEditDraft((current) => ({
                                    ...current,
                                    title: value,
                                }))
                            }
                        />
                        <TextField
                            label="項目1"
                            value={cardEditDraft.item1}
                            onChange={(value) =>
                                setCardEditDraft((current) => ({
                                    ...current,
                                    item1: value,
                                }))
                            }
                        />
                        <TextField
                            label="項目2"
                            value={cardEditDraft.item2}
                            onChange={(value) =>
                                setCardEditDraft((current) => ({
                                    ...current,
                                    item2: value,
                                }))
                            }
                        />
                        <TextField
                            label="項目3"
                            value={cardEditDraft.item3}
                            onChange={(value) =>
                                setCardEditDraft((current) => ({
                                    ...current,
                                    item3: value,
                                }))
                            }
                        />
                        <TextField
                            label="備考"
                            value={cardEditDraft.memo}
                            onChange={(value) =>
                                setCardEditDraft((current) => ({
                                    ...current,
                                    memo: value,
                                }))
                            }
                            multiline
                        />

                        <div className="grid gap-3 lg:grid-cols-2">
                            <section className="grid gap-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-950">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h5 className="text-sm font-black">
                                        写真連続撮影
                                    </h5>
                                    <button
                                        type="button"
                                        onClick={addMockPhotoToEditingCard}
                                        className="min-h-9 rounded-md bg-blue-700 px-3 text-xs font-black text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                                    >
                                        撮影
                                    </button>
                                </div>
                                <div className="grid gap-2">
                                    {cardEditDraft.photos.length === 0 && (
                                        <div className="rounded-md border border-dashed border-blue-300 bg-white p-3 text-sm font-bold text-blue-900">
                                            写真なし
                                        </div>
                                    )}
                                    {cardEditDraft.photos.map((photo) => (
                                        <article
                                            key={photo.id}
                                            className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-2 rounded-md border border-blue-200 bg-white p-2"
                                        >
                                            <span className="grid aspect-square place-items-center rounded-md border border-blue-200 bg-blue-100 text-[0.68rem] font-black text-blue-900">
                                                Photo
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block break-words text-sm font-black text-blue-950">
                                                    {photo.title}
                                                </span>
                                                <span className="mt-1 block break-words text-xs font-semibold text-blue-900">
                                                    {photo.memo}
                                                </span>
                                                <span className="mt-1 inline-flex rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[0.68rem] font-black text-blue-900">
                                                    {photo.status}
                                                </span>
                                            </span>
                                        </article>
                                    ))}
                                </div>
                            </section>

                            <section className="grid gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-950">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h5 className="text-sm font-black">ファイル</h5>
                                    <label className="grid min-h-9 cursor-pointer place-items-center rounded-md bg-emerald-700 px-3 text-xs font-black text-white transition hover:bg-emerald-800 focus-within:ring-4 focus-within:ring-emerald-100">
                                        ファイルまとめて追加
                                        <input
                                            type="file"
                                            multiple
                                            className="sr-only"
                                            onChange={handleFileSelect}
                                        />
                                    </label>
                                </div>
                                <div
                                    className="rounded-md border-2 border-dashed border-emerald-300 bg-white p-3 text-center text-xs font-black text-emerald-900"
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={handleFileDrop}
                                >
                                    ドラッグ＆ドロップ
                                </div>
                                <div className="grid gap-2">
                                    {cardEditDraft.files.length === 0 && (
                                        <div className="rounded-md border border-dashed border-emerald-300 bg-white p-3 text-sm font-bold text-emerald-900">
                                            ファイルなし
                                        </div>
                                    )}
                                    {cardEditDraft.files.map((file) => (
                                        <article
                                            key={file.id}
                                            className="rounded-md border border-emerald-200 bg-white p-2"
                                        >
                                            <span className="block break-words text-sm font-black text-emerald-950">
                                                {file.displayName}
                                            </span>
                                            <span className="mt-1 block break-words text-xs font-semibold text-emerald-900">
                                                {file.fileName}
                                            </span>
                                            <span className="mt-1 block break-words text-xs text-emerald-900">
                                                {file.memo}
                                            </span>
                                            <span className="mt-1 inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.68rem] font-black text-emerald-900">
                                                {file.status}
                                            </span>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </Modal>
            )}
        </section>
    );
}

function TopScreen({
    project,
    sectionStatuses,
    onSelectSection,
}: {
    project: Project;
    sectionStatuses: Record<DetailSection, string>;
    onSelectSection: (section: DetailSection) => void;
}) {
    return (
        <section className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
            <MockScreenHeader title="案件詳細" icon={<Menu className="h-5 w-5" />} />
            <div className="grid gap-4 p-4">
                <div className="grid gap-1 rounded-md border border-slate-200 bg-white p-3 text-sm font-bold text-slate-900">
                    <span>案件名: {project.name}</span>
                    <span>案件ID: {project.id}</span>
                </div>

                <div className="grid gap-3">
                    {sectionConfigs.map((config) => (
                        <SectionSelectButton
                            key={config.key}
                            config={config}
                            status={sectionStatuses[config.key]}
                            onSelect={() => onSelectSection(config.key)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

function SectionSelectButton({
    config,
    status,
    onSelect,
}: {
    config: (typeof sectionConfigs)[number];
    status: string;
    onSelect: () => void;
}) {
    const tone = sectionToneClasses[config.tone];
    const Icon = config.icon;

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`grid min-h-14 grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-md border bg-white px-3 text-left transition focus-visible:outline-none focus-visible:ring-4 ${tone.border} ${tone.ring}`}
        >
            <Icon aria-hidden="true" className={`h-6 w-6 ${tone.text}`} />
            <span className={`break-words text-lg font-black ${tone.text}`}>
                {config.label}
            </span>
            <span className={`text-xs font-black ${tone.text}`}>{status}</span>
            <ChevronRight aria-hidden="true" className={`h-5 w-5 ${tone.text}`} />
        </button>
    );
}

function CardHandlingScreen({
    config,
    cards,
    handling,
    noneReason,
    onHandlingChange,
    onNoneReasonChange,
    onAddCard,
    onBack,
    onEditCard,
    workMode = false,
}: {
    config: (typeof sectionConfigs)[number];
    cards: WorkCard[];
    handling: CardHandling;
    noneReason: string;
    onHandlingChange: (value: CardHandling) => void;
    onNoneReasonChange: (value: string) => void;
    onAddCard: () => void;
    onBack: () => void;
    onEditCard: (card: WorkCard) => void;
    workMode?: boolean;
}) {
    return (
        <SectionScreen config={config} onBack={onBack}>
            <HandlingControl
                label={`${config.label}取扱`}
                noneReason={noneReason}
                value={handling}
                onNoneReasonChange={onNoneReasonChange}
                onValueChange={onHandlingChange}
            />

            <CardListHeader
                buttonLabel={workMode ? 'カード追加' : `${config.cardLabel}追加`}
                config={config}
                title={`${config.cardLabel}一覧`}
                onAddCard={onAddCard}
            />

            <CardList
                cards={cards}
                emptyLabel={`${config.cardLabel}はありません`}
                onEditCard={onEditCard}
            />

            <BackButton onBack={onBack} />
        </SectionScreen>
    );
}

function AddOnlyScreen({
    config,
    notice,
    cards,
    emptyLabel,
    onAddCard,
    onBack,
    onEditCard,
}: {
    config: (typeof sectionConfigs)[number];
    notice: string;
    cards: WorkCard[];
    emptyLabel: string;
    onAddCard: () => void;
    onBack: () => void;
    onEditCard: (card: WorkCard) => void;
}) {
    const tone = sectionToneClasses[config.tone];

    return (
        <SectionScreen config={config} onBack={onBack}>
            <div
                className={`rounded-md border border-dashed p-4 text-center text-sm font-bold ${tone.border} ${tone.soft} ${tone.text}`}
            >
                {notice}
            </div>

            <CardListHeader
                buttonLabel={`${config.cardLabel}追加`}
                config={config}
                title={`${config.cardLabel}一覧`}
                onAddCard={onAddCard}
            />

            <CardList
                cards={cards}
                emptyLabel={emptyLabel}
                largeEmpty
                onEditCard={onEditCard}
            />

            <BackButton onBack={onBack} />
        </SectionScreen>
    );
}

function SectionScreen({
    config,
    children,
    onBack,
}: {
    config: (typeof sectionConfigs)[number];
    children: ReactNode;
    onBack: () => void;
}) {
    const tone = sectionToneClasses[config.tone];
    const Icon = config.icon;

    return (
        <section className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
            <MockScreenHeader
                title={config.label}
                icon={
                    <button
                        type="button"
                        onClick={onBack}
                        className="grid h-8 w-8 place-items-center rounded-md text-slate-800 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        <ArrowLeft aria-hidden="true" className="h-5 w-5" />
                    </button>
                }
                titleIcon={<Icon aria-hidden="true" className={`h-5 w-5 ${tone.text}`} />}
                titleClassName={tone.text}
            />
            <div className="grid gap-4 p-4">{children}</div>
        </section>
    );
}

function MockScreenHeader({
    title,
    icon,
    titleIcon,
    titleClassName = 'text-slate-950',
}: {
    title: string;
    icon: ReactNode;
    titleIcon?: ReactNode;
    titleClassName?: string;
}) {
    return (
        <header className="grid min-h-12 grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center border-b border-slate-200 px-3">
            <div>{icon}</div>
            <h3
                className={`flex min-w-0 items-center justify-center gap-2 text-base font-black ${titleClassName}`}
            >
                {titleIcon}
                <span className="truncate">{title}</span>
            </h3>
            <div />
        </header>
    );
}

function HandlingControl({
    label,
    value,
    onValueChange,
    noneReason,
    onNoneReasonChange,
}: {
    label: string;
    value: CardHandling;
    onValueChange: (value: CardHandling) => void;
    noneReason: string;
    onNoneReasonChange: (value: string) => void;
}) {
    return (
        <fieldset className="grid gap-3 rounded-md border border-slate-200 bg-white p-3">
            <legend className="text-sm font-black text-slate-950">{label}</legend>
            <div className="flex flex-wrap gap-6">
                {(['あり', 'なし'] as CardHandling[]).map((option) => (
                    <label
                        key={option}
                        className="inline-flex min-h-9 items-center gap-2 text-sm font-bold text-slate-900"
                    >
                        <input
                            type="radio"
                            checked={value === option}
                            onChange={() => onValueChange(option)}
                            className="h-4 w-4"
                        />
                        {option}
                    </label>
                ))}
            </div>
            <label className="grid gap-1">
                <span className="text-xs font-black text-slate-900">なし理由</span>
                <input
                    value={noneReason}
                    onChange={(event) => onNoneReasonChange(event.target.value)}
                    placeholder="理由を入力"
                    className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
            </label>
        </fieldset>
    );
}

function CardListHeader({
    title,
    buttonLabel,
    config,
    onAddCard,
}: {
    title: string;
    buttonLabel: string;
    config: (typeof sectionConfigs)[number];
    onAddCard: () => void;
}) {
    const tone = sectionToneClasses[config.tone];

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <h4 className="text-sm font-black text-slate-950">{title}</h4>
            <button
                type="button"
                onClick={onAddCard}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-md border bg-white px-3 text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 ${tone.button} ${tone.ring}`}
            >
                <Plus aria-hidden="true" className="h-4 w-4" />
                {buttonLabel}
            </button>
        </div>
    );
}

function CardList({
    cards,
    emptyLabel,
    onEditCard,
    largeEmpty = false,
}: {
    cards: WorkCard[];
    emptyLabel: string;
    onEditCard: (card: WorkCard) => void;
    largeEmpty?: boolean;
}) {
    if (cards.length === 0) {
        return (
            <div
                className={[
                    'grid place-items-center rounded-md border border-slate-200 bg-slate-50 text-center text-sm font-bold text-slate-500',
                    largeEmpty ? 'min-h-56' : 'min-h-24',
                ].join(' ')}
            >
                {emptyLabel}
            </div>
        );
    }

    return (
        <div
            aria-label="カード一覧フィールド"
            className="overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-2"
        >
            <div className="flex min-w-max gap-2">
                {cards.map((card) => (
                    <button
                        key={card.id}
                        type="button"
                        onClick={() => onEditCard(card)}
                        className="grid min-h-28 w-48 shrink-0 gap-2 rounded-md border border-slate-200 bg-white p-3 text-left transition hover:border-sky-300 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        <span className="min-w-0">
                            <span className="line-clamp-2 break-words text-sm font-black leading-5 text-slate-950">
                                {card.title}
                            </span>
                            <span className="mt-1 block text-xs font-semibold text-slate-500">
                                {cardKindLabels[card.kind]}
                            </span>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function BackButton({ onBack }: { onBack: () => void }) {
    return (
        <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-9 w-fit items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
        >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            戻る
        </button>
    );
}

function Modal({
    title,
    children,
    onClose,
    footer,
}: {
    title: string;
    children: ReactNode;
    onClose: () => void;
    footer?: ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-3">
            <section className="max-h-[88dvh] w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
                    <h4 className="text-base font-black text-slate-950">{title}</h4>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        閉じる
                    </button>
                </div>
                <div className="max-h-[58dvh] overflow-y-auto px-4 py-3">{children}</div>
                {footer && (
                    <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
                        {footer}
                    </div>
                )}
            </section>
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
        <label className="grid gap-1 sm:grid-cols-[4rem_minmax(0,1fr)] sm:items-start">
            <span className="pt-2 text-xs font-black text-slate-900">{label}</span>
            {multiline ? (
                <textarea
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    rows={4}
                    placeholder="入力"
                    className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
            ) : (
                <input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="入力"
                    className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
            )}
        </label>
    );
}
