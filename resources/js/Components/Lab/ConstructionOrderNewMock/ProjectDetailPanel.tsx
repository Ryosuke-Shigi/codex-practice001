import DocumentPreviewPanel from './DocumentPreviewPanel';
import ProjectProgressPanel from './ProjectProgressPanel';
import SiteAccessPanel from './SiteAccessPanel';
import WorkCardListPanel from './WorkCardListPanel';
import type { DocumentType, Project, ProjectDetailTab, WorkCard } from './mockData';
import { projectDetailTabs } from './mockData';

type ProjectDetailPanelProps = {
    project: Project;
    activeTab: ProjectDetailTab;
    onTabChange: (tab: ProjectDetailTab) => void;
    onBackToProjects: () => void;
    onOpenCard: (card: WorkCard) => void;
};

export default function ProjectDetailPanel({
    project,
    activeTab,
    onTabChange,
    onBackToProjects,
    onOpenCard,
}: ProjectDetailPanelProps) {
    return (
        <section className="grid gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <button
                    type="button"
                    onClick={onBackToProjects}
                    className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                >
                    案件一覧へ戻る
                </button>

                <div className="mt-4 grid gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        PROJECT DETAIL QUERY
                    </p>
                    <h2 className="break-words text-2xl font-bold text-slate-950">
                        {project.name}
                    </h2>
                    <p className="text-sm leading-7 text-slate-600">
                        {project.customerName} / {project.siteAddress}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-900">
                            {project.status}
                        </span>
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
                            {project.cardCount}
                        </span>
                        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900">
                            {project.estimateStatus}
                        </span>
                    </div>
                </div>
            </div>

            <SiteAccessPanel project={project} />

            <nav
                aria-label="案件詳細タブ"
                className="grid grid-cols-2 gap-2 sm:grid-cols-5"
            >
                {projectDetailTabs.map((tab) => {
                    const isActive = tab.key === activeTab;

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => onTabChange(tab.key)}
                            className={[
                                'min-h-14 rounded-lg border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100',
                                isActive
                                    ? 'border-sky-500 bg-sky-700 text-white'
                                    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
                            ].join(' ')}
                        >
                            <span className="block text-sm font-bold">{tab.label}</span>
                            <span
                                className={[
                                    'mt-1 block text-[11px] leading-4',
                                    isActive ? 'text-sky-50' : 'text-slate-500',
                                ].join(' ')}
                            >
                                {tab.boundary}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {activeTab === 'cards' && (
                <WorkCardListPanel project={project} onOpenCard={onOpenCard} />
            )}
            {activeTab === 'progress' && <ProjectProgressPanel project={project} />}
            {(['estimate', 'invoice', 'receipt'] as ProjectDetailTab[]).includes(
                activeTab,
            ) && (
                <DocumentPreviewPanel
                    documentType={activeTab as DocumentType}
                    project={project}
                />
            )}
        </section>
    );
}
