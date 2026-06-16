import {
    ArrowLeft,
    ClipboardList,
    FileText,
    FolderOpen,
    MapPin,
} from 'lucide-react';

import DocumentWorkspacePanel from './DocumentWorkspacePanel';
import ProjectWorkDetailPanel from './ProjectWorkDetailPanel';
import SiteAccessPanel from './SiteAccessPanel';
import type {
    CardKind,
    DocumentType,
    Project,
    ProjectDetailView,
    WorkCard,
} from './mockData';
import { projectHubEntries } from './mockData';

type ProjectDetailPanelProps = {
    project: Project;
    activeView: ProjectDetailView;
    activeDocumentType: DocumentType;
    onViewChange: (view: ProjectDetailView) => void;
    onDocumentTypeChange: (documentType: DocumentType) => void;
    onBackToProjects: () => void;
    onOpenCard: (card: WorkCard) => void;
    onAddCard: (kind: CardKind) => void;
};

export default function ProjectDetailPanel({
    project,
    activeView,
    activeDocumentType,
    onViewChange,
    onDocumentTypeChange,
    onBackToProjects,
    onOpenCard,
    onAddCard,
}: ProjectDetailPanelProps) {
    const activeViewLabel = {
        hub: '案件詳細',
        'site-access': '現場アクセス',
        'work-detail': '詳細',
        documents: '書類',
    }[activeView];

    return (
        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                    <div className="grid min-w-0 gap-1">
                        <span className="w-fit rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-900">
                            {activeViewLabel}
                        </span>
                        <h2 className="break-words text-base font-bold text-slate-950 sm:text-lg">
                            {project.name}
                        </h2>
                        <p className="break-words text-xs text-slate-600">
                            現場住所: {project.siteAddress}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                        {activeView !== 'hub' && (
                            <button
                                type="button"
                                onClick={() => onViewChange('hub')}
                                className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                            >
                                <FolderOpen aria-hidden="true" className="h-4 w-4" />
                                案件詳細
                            </button>
                        )}
                        {activeView === 'hub' && (
                            <button
                                type="button"
                                onClick={onBackToProjects}
                                className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                            >
                                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                                案件一覧
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {activeView === 'hub' && (
                    <ProjectDetailHub
                        project={project}
                        onViewChange={onViewChange}
                    />
                )}

                {activeView === 'site-access' && (
                    <SiteAccessPanel project={project} />
                )}

                {activeView === 'work-detail' && (
                    <ProjectWorkDetailPanel
                        project={project}
                        onOpenCard={onOpenCard}
                        onAddCard={onAddCard}
                    />
                )}

                {activeView === 'documents' && (
                    <DocumentWorkspacePanel
                        activeDocumentType={activeDocumentType}
                        project={project}
                        onDocumentTypeChange={onDocumentTypeChange}
                    />
                )}
            </div>
        </section>
    );
}

function ProjectDetailHub({
    project,
    onViewChange,
}: {
    project: Project;
    onViewChange: (view: ProjectDetailView) => void;
}) {
    return (
        <div className="grid gap-3">
            <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                    <HubMeta label="担当者" value={project.owner} />
                    <HubMeta label="現在状態" value={project.status} />
                </div>
            </section>

            <section className="grid content-start gap-2 lg:grid-cols-3">
                {projectHubEntries.map((entry) => (
                    <button
                        key={entry.key}
                        type="button"
                        onClick={() => onViewChange(entry.key)}
                        className="flex min-h-20 items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-sky-300 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        <span className="flex items-center gap-2 text-base font-bold text-slate-950">
                            <HubEntryIcon view={entry.key} />
                            {entry.label}
                        </span>
                    </button>
                ))}
            </section>
        </div>
    );
}

function HubEntryIcon({ view }: { view: ProjectDetailView }) {
    if (view === 'site-access') {
        return <MapPin aria-hidden="true" className="h-5 w-5 text-sky-700" />;
    }

    if (view === 'work-detail') {
        return (
            <ClipboardList
                aria-hidden="true"
                className="h-5 w-5 text-emerald-700"
            />
        );
    }

    return <FileText aria-hidden="true" className="h-5 w-5 text-amber-700" />;
}

function HubMeta({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid gap-1 rounded-md border border-slate-200 bg-white p-2">
            <span className="text-xs font-semibold text-slate-500">{label}</span>
            <span className="break-words text-sm font-bold text-slate-950">
                {value}
            </span>
        </div>
    );
}
