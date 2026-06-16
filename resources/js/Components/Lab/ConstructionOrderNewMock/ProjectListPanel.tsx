import type { Project } from './mockData';
import { formatYen } from './mockData';

type ProjectListPanelProps = {
    projects: Project[];
    onSelectProject: (project: Project) => void;
};

export default function ProjectListPanel({
    projects,
    onSelectProject,
}: ProjectListPanelProps) {
    return (
        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2">
                <h2 className="text-base font-bold text-slate-950">
                    案件一覧
                </h2>
            </div>

            {/* This is the only vertical scroll area in the project list screen. */}
            <div className="grid min-h-0 flex-1 content-start gap-2 overflow-y-auto p-3">
                {projects.map((project) => (
                    <button
                        key={project.id}
                        type="button"
                        onClick={() => onSelectProject(project)}
                        className="rounded-md border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-sky-300 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        <div className="grid gap-2">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <h3 className="break-words text-sm font-bold text-slate-950">
                                        {project.name}
                                    </h3>
                                    <p className="mt-0.5 text-xs text-slate-600">
                                        {project.customerName}
                                    </p>
                                </div>
                                <span className="shrink-0 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-900">
                                    {project.status}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                <ProjectMeta label="カード数" value={project.cardCount} />
                                <ProjectMeta
                                    label="詳細状態"
                                    value={project.progressStatus}
                                />
                                <ProjectMeta
                                    label="未完了"
                                    value={`${project.pendingCardCount}件`}
                                />
                                <ProjectMeta
                                    label="要確認"
                                    value={`${project.confirmCount}件`}
                                />
                                <ProjectMeta
                                    label="見積状態"
                                    value={project.estimateStatus}
                                />
                                <ProjectMeta
                                    label="請求状態"
                                    value={project.invoiceStatus}
                                />
                                <ProjectMeta
                                    label="領収状態"
                                    value={project.receiptStatus}
                                />
                                <ProjectMeta
                                    label="関連案件"
                                    value={project.hasRelatedProjects ? 'あり' : 'なし'}
                                />
                                <ProjectMeta
                                    label="担当者"
                                    value={project.owner}
                                />
                                <ProjectMeta
                                    label="金額"
                                    value={formatYen(project.amountSummary)}
                                />
                                <ProjectMeta
                                    label="最終更新"
                                    value={project.lastUpdated}
                                />
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
}

function ProjectMeta({ label, value }: { label: string; value: string }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
            <span className="text-[11px] font-semibold text-slate-500">{label}</span>
            <span className="text-xs font-bold text-slate-900">{value}</span>
        </span>
    );
}
