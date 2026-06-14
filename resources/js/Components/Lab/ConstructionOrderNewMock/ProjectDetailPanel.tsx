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

            {/* Detail tabs are kept visible on mobile so the workflow choices do not disappear. */}
            <nav aria-label="案件詳細タブ" className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {projectDetailTabs.map((tab) => {
                    const isActive = tab.key === activeTab;

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => onTabChange(tab.key)}
                            className={[
                                'inline-flex min-h-11 min-w-0 items-center justify-center rounded-lg border px-2 text-center text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 sm:px-3 sm:text-sm',
                                isActive
                                    ? 'border-sky-500 bg-sky-700 text-white'
                                    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
                            ].join(' ')}
                        >
                            <span className="whitespace-nowrap">{tab.label}</span>
                        </button>
                    );
                })}
            </nav>

            {activeTab === 'access' && <SiteAccessPanel project={project} />}
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
