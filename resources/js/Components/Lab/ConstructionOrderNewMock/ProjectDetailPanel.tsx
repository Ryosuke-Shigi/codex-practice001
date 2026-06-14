import DocumentPreviewPanel from './DocumentPreviewPanel';
import ProjectProgressPanel from './ProjectProgressPanel';
import SiteAccessPanel from './SiteAccessPanel';
import WorkCardListPanel from './WorkCardListPanel';
import type {
    CardKind,
    DocumentType,
    Project,
    ProjectDetailTab,
    WorkCard,
} from './mockData';
import { projectDetailTabs } from './mockData';

type ProjectDetailPanelProps = {
    project: Project;
    activeTab: ProjectDetailTab;
    onTabChange: (tab: ProjectDetailTab) => void;
    onBackToProjects: () => void;
    onOpenCard: (card: WorkCard) => void;
    onAddCard: (kind: CardKind) => void;
};

export default function ProjectDetailPanel({
    project,
    activeTab,
    onTabChange,
    onBackToProjects,
    onOpenCard,
    onAddCard,
}: ProjectDetailPanelProps) {
    return (
        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                    <div className="grid min-w-0 gap-1">
                        <h2 className="break-words text-base font-bold text-slate-950 sm:text-lg">
                            {project.name}
                        </h2>
                        <p className="break-words text-xs text-slate-600">
                            {project.customerName} / {project.siteAddress}
                        </p>
                        <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-900">
                            {project.status}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onBackToProjects}
                        className="min-h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        案件一覧へ
                    </button>
                </div>
            </div>

            {/* Detail tabs are kept visible on mobile so the workflow choices do not disappear. */}
            <nav
                aria-label="案件詳細タブ"
                className="grid shrink-0 grid-cols-3 gap-1 border-b border-slate-200 bg-slate-50 p-1 sm:grid-cols-6"
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
                                'inline-flex h-8 min-w-0 items-center justify-center rounded-md border px-1.5 text-center text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 sm:px-2 sm:text-xs',
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

            {/* Project detail owns the only vertical scroll area for its tab content. */}
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {activeTab === 'access' && <SiteAccessPanel project={project} />}
                {activeTab === 'cards' && (
                    <WorkCardListPanel
                        project={project}
                        onOpenCard={onOpenCard}
                        onAddCard={onAddCard}
                    />
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
            </div>
        </section>
    );
}
