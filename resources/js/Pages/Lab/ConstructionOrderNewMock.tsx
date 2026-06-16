/**
 * 工事発注管理・請求システム MOCK の Page Component です。
 *
 * 画面導線、カード構造、帳票構造、現場アクセス導線、ADR / レイヤード分解の材料を
 * 固定データだけで確認します。DB保存、CSV実取込、ファイル保存、帳票生成は行いません。
 */
import { Head } from '@inertiajs/react';
import { useState } from 'react';

import ConstructionOrderNewMockHeader from '@/Components/Lab/ConstructionOrderNewMock/ConstructionOrderNewMockHeader';
import EntryFormPanel from '@/Components/Lab/ConstructionOrderNewMock/EntryFormPanel';
import ProjectDetailPanel from '@/Components/Lab/ConstructionOrderNewMock/ProjectDetailPanel';
import ProjectListPanel from '@/Components/Lab/ConstructionOrderNewMock/ProjectListPanel';
import WorkCardDetailPanel from '@/Components/Lab/ConstructionOrderNewMock/WorkCardDetailPanel';
import {
    initialEntryDraft,
    projects,
} from '@/Components/Lab/ConstructionOrderNewMock/mockData';
import type {
    CardKind,
    EntryDraft,
    EntryDraftField,
    EntryProductDraft,
    EntryProductDraftField,
    MockScreen,
    Project,
    ProjectDetailView,
    DocumentType,
    WorkCard,
} from '@/Components/Lab/ConstructionOrderNewMock/mockData';
import { formatYen } from '@/Components/Lab/ConstructionOrderNewMock/mockData';
import PublicLayout from '@/Layouts/PublicLayout';

export default function ConstructionOrderNewMock() {
    const [activeScreen, setActiveScreen] = useState<MockScreen>('entry');
    const [entryPreviewed, setEntryPreviewed] = useState(false);
    const [entryDraft, setEntryDraft] = useState<EntryDraft>(initialEntryDraft);
    const [mockProjects, setMockProjects] = useState<Project[]>(projects);
    const [selectedProjectId, setSelectedProjectId] = useState(projects[0].id);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(
        projects[0].cards[0]?.id ?? null,
    );
    const [activeProjectView, setActiveProjectView] =
        useState<ProjectDetailView>('hub');
    const [activeDocumentType, setActiveDocumentType] =
        useState<DocumentType>('estimate');

    const selectedProject =
        mockProjects.find((project) => project.id === selectedProjectId) ??
        mockProjects[0];
    const selectedCard =
        selectedProject.cards.find((card) => card.id === selectedCardId) ??
        selectedProject.cards[0] ??
        null;

    const updateEntryDraft = (field: EntryDraftField, value: string) => {
        setEntryDraft((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const updateEntryProduct = (
        productId: string,
        field: EntryProductDraftField,
        value: string,
    ) => {
        setEntryDraft((current) => ({
            ...current,
            products: current.products.map((product) =>
                product.id === productId
                    ? {
                          ...product,
                          [field]: value,
                      }
                    : product,
            ),
        }));
    };

    const addEntryProduct = (
        productDraft: Omit<EntryProductDraft, 'id'>,
    ) => {
        setEntryDraft((current) => ({
            ...current,
            products: [
                ...current.products,
                {
                    id: `entry-product-${Date.now()}`,
                    ...productDraft,
                },
            ],
        }));
    };

    const duplicateEntryProduct = (product: EntryProductDraft) => {
        setEntryDraft((current) => ({
            ...current,
            products: [
                ...current.products,
                {
                    ...product,
                    id: `entry-product-${Date.now()}`,
                    productLabel: `${product.productLabel} コピー`,
                },
            ],
        }));
    };

    const removeEntryProduct = (productId: string) => {
        setEntryDraft((current) => ({
            ...current,
            products: current.products.filter((product) => product.id !== productId),
        }));
    };

    // UI MOCK flow: 案件登録FORM内でFORM / CSV取込を切り替え、案件一覧へ進む。
    const openProject = (project: Project) => {
        setSelectedProjectId(project.id);
        setSelectedCardId(project.cards[0]?.id ?? null);
        setActiveProjectView('hub');
        setActiveDocumentType('estimate');
        setActiveScreen('project-detail');
    };

    // Card detail stays behind card selection so the route shape matches the real workflow.
    const openCard = (card: WorkCard) => {
        setSelectedCardId(card.id);
        setActiveProjectView('work-detail');
        setActiveScreen('card-detail');
    };

    const addWorkCard = (kind: CardKind) => {
        const newCard = createMockWorkCard(kind);

        setMockProjects((current) =>
            current.map((project) => {
                if (project.id !== selectedProject.id) {
                    return project;
                }

                const cards = [...project.cards, newCard];

                return {
                    ...project,
                    cards,
                    workflowStages: project.workflowStages.map((stage) =>
                        stage.id === newCard.phaseId
                            ? {
                                  ...stage,
                                  cardIds: [...stage.cardIds, newCard.id],
                              }
                            : stage,
                    ),
                    cardCount: `${cards.length}枚`,
                    pendingCardCount: project.pendingCardCount + 1,
                    confirmCount:
                        kind === 'exception'
                            ? project.confirmCount + 1
                            : project.confirmCount,
                    hasRelatedProjects:
                        project.hasRelatedProjects || kind === 'exception',
                };
            }),
        );
        setSelectedCardId(newCard.id);
        setActiveScreen('card-detail');
    };

    const saveWorkCard = (updatedCard: WorkCard) => {
        setMockProjects((current) =>
            current.map((project) => {
                if (project.id !== selectedProject.id) {
                    return project;
                }

                return {
                    ...project,
                    cards: project.cards.map((card) =>
                        card.id === updatedCard.id ? updatedCard : card,
                    ),
                };
            }),
        );
        setSelectedCardId(updatedCard.id);
    };

    const deleteWorkCard = (cardId: string) => {
        const remainingCards = selectedProject.cards.filter(
            (card) => card.id !== cardId,
        );

        setMockProjects((current) =>
            current.map((project) => {
                if (project.id !== selectedProject.id) {
                    return project;
                }

                return {
                    ...project,
                    cards: remainingCards,
                    cardCount: `${remainingCards.length}枚`,
                    pendingCardCount: remainingCards.filter(
                        (card) => card.status !== 'できている',
                    ).length,
                    confirmCount: remainingCards.filter(
                        (card) =>
                            card.requiresRelatedProject || card.status === '差戻し',
                    ).length,
                    hasRelatedProjects: remainingCards.some(
                        (card) => card.requiresRelatedProject,
                    ),
                };
            }),
        );
        setSelectedCardId(remainingCards[0]?.id ?? null);
        setActiveProjectView('work-detail');
        setActiveScreen('project-detail');
    };

    const isEntryFlow =
        activeScreen === 'entry' ||
        activeScreen === 'projects';

    return (
        <PublicLayout className="h-dvh overflow-hidden bg-[#f4f8fb] text-slate-900">
            <Head title="工事発注管理・請求システム MOCK" />

            <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-2 overflow-hidden p-3 sm:p-4">
                <header className="grid shrink-0 gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500">
                            MOCK
                        </p>
                        <h1 className="truncate text-sm font-black text-slate-900 sm:text-base">
                            工事発注管理・請求システム
                        </h1>
                    </div>
                </header>

                {isEntryFlow && (
                    <ConstructionOrderNewMockHeader
                        activeScreen={activeScreen}
                        onScreenChange={setActiveScreen}
                    />
                )}

                <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
                    {activeScreen === 'entry' && (
                        <EntryFormPanel
                            draft={entryDraft}
                            previewed={entryPreviewed}
                            onDraftChange={updateEntryDraft}
                            onProductChange={updateEntryProduct}
                            onProductAdd={addEntryProduct}
                            onProductDuplicate={duplicateEntryProduct}
                            onProductRemove={removeEntryProduct}
                            onPreview={() => setEntryPreviewed(true)}
                            onNext={() => setActiveScreen('projects')}
                        />
                    )}

                    {activeScreen === 'projects' && (
                        <ProjectListPanel
                            projects={mockProjects}
                            onSelectProject={openProject}
                        />
                    )}

                    {activeScreen === 'project-detail' && (
                        <ProjectDetailPanel
                            project={selectedProject}
                            activeView={activeProjectView}
                            activeDocumentType={activeDocumentType}
                            onViewChange={setActiveProjectView}
                            onDocumentTypeChange={setActiveDocumentType}
                            onBackToProjects={() => setActiveScreen('projects')}
                            onOpenCard={openCard}
                            onAddCard={addWorkCard}
                        />
                    )}

                    {activeScreen === 'card-detail' && selectedCard && (
                        <WorkCardDetailPanel
                            card={selectedCard}
                            onBackToProject={() => setActiveScreen('project-detail')}
                            onSaveCard={saveWorkCard}
                            onDeleteCard={deleteWorkCard}
                        />
                    )}
                </main>
            </div>
        </PublicLayout>
    );
}

function createMockWorkCard(kind: CardKind): WorkCard {
    const id = `card-${kind}-${Date.now()}`;
    const defaultAmount = kind === 'adjustment' ? -3000 : 0;

    return {
        id,
        kind,
        phaseId: getDefaultCardPhase(kind),
        title: getDefaultCardTitle(kind),
        status: '下書き',
        amount: defaultAmount,
        category: getDefaultCardCategory(kind),
        hasMemo: true,
        hasPhotos: false,
        hasFiles: false,
        billingTarget: kind === 'exception' ? '非対象' : '請求対象',
        receiptTarget: kind === 'exception' ? '領収対象外' : '領収対象',
        requiresRelatedProject: kind === 'exception',
        summary: '追加したカードの内容をMOCK上で確認します。',
        detailRows: [
            {
                id: `row-${id}`,
                content: getDefaultCardTitle(kind),
                displayLabel: '数量',
                quantity: 1,
                unit: '式',
                unitPrice: defaultAmount,
                amount: defaultAmount,
                memo: '追加カード登録時の初期明細',
            },
        ],
        photos: [],
        files: [],
        memo: '追加カードのメモをここで編集します。',
        exceptionType: kind === 'exception' ? '再訪問' : undefined,
        relatedStageLabel: kind === 'exception' ? '作業対応' : undefined,
        relatedProjectLabel:
            kind === 'exception' ? '工事後対応案件へ接続する候補' : undefined,
        documentReflection:
            kind === 'exception'
                ? '帳票対象外'
                : `${formatYen(defaultAmount)}を帳票明細へ反映`,
    };
}

function getDefaultCardTitle(kind: CardKind) {
    const titles: Record<CardKind, string> = {
        product: '追加商品',
        work: '追加作業',
        expense: '追加諸経費',
        adjustment: '追加調整',
        exception: '追加例外対応',
    };

    return titles[kind];
}

function getDefaultCardCategory(kind: CardKind): WorkCard['category'] {
    if (kind === 'product') {
        return '商品';
    }

    if (kind === 'expense') {
        return '諸経費';
    }

    if (kind === 'adjustment') {
        return '調整';
    }

    if (kind === 'exception') {
        return '例外対応';
    }

    return '作業';
}

function getDefaultCardPhase(kind: CardKind) {
    if (kind === 'product') {
        return 'product-check';
    }

    if (kind === 'adjustment') {
        return 'billing-check';
    }

    if (kind === 'exception') {
        return 'exception-support';
    }

    if (kind === 'expense') {
        return 'work-support';
    }

    return 'site-check';
}
