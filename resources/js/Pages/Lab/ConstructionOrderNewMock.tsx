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
import {
    syncEntryDraftToProjects,
    updateProjectCardSummary,
} from '@/Components/Lab/ConstructionOrderNewMock/projectCardSync';
import {
    initialEntryDraft,
    projects,
} from '@/Components/Lab/ConstructionOrderNewMock/mockData';
import type {
    CardInputDraft,
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

const initialMockProjects = syncEntryDraftToProjects(
    projects,
    initialEntryDraft,
    projects[0].id,
);

export default function ConstructionOrderNewMock() {
    const [activeScreen, setActiveScreen] = useState<MockScreen>('entry');
    const [entryPreviewed, setEntryPreviewed] = useState(false);
    const [entryDraft, setEntryDraft] = useState<EntryDraft>(initialEntryDraft);
    const [mockProjects, setMockProjects] =
        useState<Project[]>(initialMockProjects);
    const [selectedProjectId, setSelectedProjectId] = useState(projects[0].id);
    const [activeProjectView, setActiveProjectView] =
        useState<ProjectDetailView>('hub');
    const [activeDocumentType, setActiveDocumentType] =
        useState<DocumentType>('estimate');

    const selectedProject =
        mockProjects.find((project) => project.id === selectedProjectId) ??
        mockProjects[0];

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

    const syncEntryDraftProductCards = () => {
        setMockProjects((current) =>
            syncEntryDraftToProjects(current, entryDraft, selectedProjectId),
        );
    };

    const registerEntryDraft = () => {
        setEntryPreviewed(true);
        syncEntryDraftProductCards();
    };

    const changeEntryScreen = (screen: MockScreen) => {
        if (screen === 'projects') {
            syncEntryDraftProductCards();
        }

        setActiveScreen(screen);
    };

    const openProjectList = () => {
        syncEntryDraftProductCards();
        setActiveScreen('projects');
    };

    // UI MOCK flow: 案件登録FORM内でFORM / CSV取込を切り替え、案件一覧へ進む。
    const openProject = (project: Project) => {
        setSelectedProjectId(project.id);
        setActiveProjectView('hub');
        setActiveDocumentType('estimate');
        setActiveScreen('project-detail');
    };

    const addWorkCard = (kind: CardKind, draft?: CardInputDraft) => {
        const newCard = createMockWorkCard(kind, draft);

        setMockProjects((current) =>
            current.map((project) => {
                if (project.id !== selectedProject.id) {
                    return project;
                }

                const cards = [...project.cards, newCard];

                return updateProjectCardSummary(project, cards);
            }),
        );
        setActiveProjectView('work-detail');
        setActiveScreen('project-detail');
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

                return updateProjectCardSummary(project, remainingCards);
            }),
        );
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
                        onScreenChange={changeEntryScreen}
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
                            onPreview={registerEntryDraft}
                            onNext={openProjectList}
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
                            onAddCard={addWorkCard}
                            onDeleteCard={deleteWorkCard}
                            onSaveCard={saveWorkCard}
                        />
                    )}

                </main>
            </div>
        </PublicLayout>
    );
}

function createMockWorkCard(kind: CardKind, draft: CardInputDraft = {}): WorkCard {
    const id = `card-${kind}-${Date.now()}`;
    const defaultAmount = kind === 'adjustment' ? -3000 : 0;
    const title =
        draft.title?.trim() ||
        draft.item1?.trim() ||
        getDefaultCardTitle(kind);
    const content = draft.item1?.trim() || title;
    const detailMemo = draft.item2?.trim() || draft.memo?.trim() || '';
    const summary = draft.item3?.trim() || content;
    const memo = draft.memo?.trim() || '';

    return {
        id,
        kind,
        phaseId: getDefaultCardPhase(kind),
        title,
        status: '下書き',
        amount: defaultAmount,
        category: getDefaultCardCategory(kind),
        hasMemo: memo.length > 0,
        hasPhotos: false,
        hasFiles: false,
        billingTarget: kind === 'exception' ? '非対象' : '請求対象',
        receiptTarget: kind === 'exception' ? '非対象' : '領収対象',
        requiresRelatedProject: kind === 'exception',
        summary,
        detailRows: [
            {
                id: `row-${id}`,
                content,
                displayLabel: '数量',
                quantity: 1,
                unit: '式',
                unitPrice: defaultAmount,
                amount: defaultAmount,
                memo: detailMemo,
            },
        ],
        photos: [],
        files: [],
        memo,
        exceptionType: kind === 'exception' ? '再訪問' : undefined,
        relatedStageLabel: kind === 'exception' ? '作業対応' : undefined,
        relatedProjectLabel:
            kind === 'exception' ? '工事後対応案件へ接続する候補' : undefined,
        documentReflection:
            kind === 'exception'
                ? '書類側で別扱い'
                : `${formatYen(defaultAmount)}を書類明細へ反映`,
    };
}

function getDefaultCardTitle(kind: CardKind) {
    const titles: Record<CardKind, string> = {
        product: '追加商品',
        work: '追加作業',
        adjustment: '追加調整',
        exception: '追加例外対応',
    };

    return titles[kind];
}

function getDefaultCardCategory(kind: CardKind): WorkCard['category'] {
    if (kind === 'product') {
        return '商品';
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
        return 'product';
    }

    if (kind === 'adjustment') {
        return 'adjustment';
    }

    if (kind === 'exception') {
        return 'exception';
    }

    return 'work';
}
