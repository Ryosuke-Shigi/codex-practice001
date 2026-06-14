/**
 * 工事発注管理・請求システム 新MOCK の Page Component です。
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
    EntryDraft,
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
    const [selectedProject, setSelectedProject] = useState<Project>(projects[0]);
    const [selectedCard, setSelectedCard] = useState<WorkCard>(
        projects[0].cards[0],
    );
    const [activeProjectTab, setActiveProjectTab] =
        useState<ProjectDetailTab>('access');

    const updateEntryDraft = (field: keyof EntryDraft, value: string) => {
        setEntryDraft((current) => ({
            ...current,
            [field]: value,
        }));
    };

    // UI MOCK flow: FORM / CSV / 案件一覧 -> 案件詳細 -> カード詳細。
    const openProject = (project: Project) => {
        setSelectedProject(project);
        setSelectedCard(project.cards[0] ?? selectedCard);
        setActiveProjectTab('access');
        setActiveScreen('project-detail');
    };

    // Card detail stays behind card selection so the route shape matches the real workflow.
    const openCard = (card: WorkCard) => {
        setSelectedCard(card);
        setActiveScreen('card-detail');
    };

    return (
        <PublicLayout className="bg-[#f4f8fb] px-4 py-4 sm:px-6 lg:px-8">
            <Head title="工事発注管理・請求システム 新MOCK" />

            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-3 pb-8">
                <ConstructionOrderNewMockHeader
                    activeScreen={activeScreen}
                    onScreenChange={setActiveScreen}
                />

                <main className="min-h-0 min-w-0">
                    {activeScreen === 'entry' && (
                        <EntryFormPanel
                            draft={entryDraft}
                            previewed={entryPreviewed}
                            onDraftChange={updateEntryDraft}
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
                            projects={projects}
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
                        />
                    )}

                    {activeScreen === 'card-detail' && (
                        <WorkCardDetailPanel
                            card={selectedCard}
                            onBackToProject={() => setActiveScreen('project-detail')}
                        />
                    )}
                </main>
            </div>
        </PublicLayout>
    );
}
