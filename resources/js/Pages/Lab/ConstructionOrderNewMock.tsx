/**
 * 工事発注管理・請求システム MOCK の Page Component です。
 *
 * 画面導線、カード構造、帳票構造、現場アクセス導線、ADR / レイヤード分解の材料を
 * 固定データだけで確認します。DB保存、CSV実取込、ファイル保存、帳票生成は行いません。
 */
import { Head } from '@inertiajs/react';
import { useState } from 'react';

import ConstructionOrderNewMockHeader from '@/Components/Lab/ConstructionOrderNewMock/ConstructionOrderNewMockHeader';
import CsvImportPanel from '@/Components/Lab/ConstructionOrderNewMock/CsvImportPanel';
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
    ProjectDetailTab,
    WorkCard,
} from '@/Components/Lab/ConstructionOrderNewMock/mockData';
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
    const [activeProjectTab, setActiveProjectTab] =
        useState<ProjectDetailTab>('access');

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

    // UI MOCK flow: 案件登録 / CSV取込 / 案件一覧 -> 案件詳細 -> カード詳細。
    const openProject = (project: Project) => {
        setSelectedProjectId(project.id);
        setSelectedCardId(project.cards[0]?.id ?? null);
        setActiveProjectTab('access');
        setActiveScreen('project-detail');
    };

    // Card detail stays behind card selection so the route shape matches the real workflow.
    const openCard = (card: WorkCard) => {
        setSelectedCardId(card.id);
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
                    cardCount: `${cards.length}枚`,
                    hasFollowUp: project.hasFollowUp || kind === 'followUp',
                    hasIssue: project.hasIssue || kind === 'issue',
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
                    hasFollowUp: remainingCards.some((card) => card.followUp),
                    hasIssue: remainingCards.some((card) => card.issue),
                };
            }),
        );
        setSelectedCardId(remainingCards[0]?.id ?? null);
        setActiveProjectTab('cards');
        setActiveScreen('project-detail');
    };

    const isEntryFlow =
        activeScreen === 'entry' ||
        activeScreen === 'projects';

    return (
        <PublicLayout className="h-dvh overflow-hidden bg-[#f4f8fb] text-slate-900">
            <Head title="工事発注管理・請求システム MOCK" />

            <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-2 overflow-hidden p-3 sm:p-4">
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
                            onNext={() => setActiveScreen('csv')}
                        />
                    )}

                    {activeScreen === 'csv' && (
                        <CsvImportPanel
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
                            activeTab={activeProjectTab}
                            onTabChange={setActiveProjectTab}
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
    const defaultAmount = kind === 'adjustment' ? '-4,000円' : '0円';

    return {
        id,
        kind,
        title: getDefaultCardTitle(kind),
        status: '下書き',
        amount: defaultAmount,
        category: getDefaultCardCategory(kind),
        hasMemo: true,
        hasPhotos: false,
        hasFiles: false,
        billingTarget: kind === 'issue' || kind === 'followUp' ? '非対象' : '請求対象',
        receiptTarget:
            kind === 'issue' || kind === 'followUp' ? '領収対象外' : '領収対象',
        followUp: kind === 'followUp',
        issue: kind === 'issue',
        summary: '追加したカードの内容をMOCK上で確認します。',
        detailRows: [
            {
                id: `row-${id}`,
                content: getDefaultCardTitle(kind),
                displayLabel: '数量',
                measuredValue: '1',
                unit: '式',
                fixedAmount: defaultAmount,
                memo: '追加時の仮明細',
            },
        ],
        photos: [],
        files: [],
        memo: '追加カードのメモをここで編集します。',
    };
}

function getDefaultCardTitle(kind: CardKind) {
    const titles: Record<CardKind, string> = {
        work: '追加作業',
        product: '追加商品',
        expense: '追加諸経費',
        adjustment: '追加調整',
        issue: '追加問題対応',
        followUp: '追加後日対応',
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

    return '工事費';
}
