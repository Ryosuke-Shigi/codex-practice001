import type { Project } from './mockData';

type ProjectListPanelProps = {
    projects: Project[];
    onSelectProject: (project: Project) => void;
};

export default function ProjectListPanel({
    projects,
    onSelectProject,
}: ProjectListPanelProps) {
    return (
        <section className="grid gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    PROJECT QUERY
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">
                    案件一覧
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                    案件カードから案件詳細へ進む入口です。固定データのQuery表示として扱い、DB取得は行いません。
                </p>
            </div>

            <div className="grid gap-3">
                {projects.map((project) => (
                    <button
                        key={project.id}
                        type="button"
                        onClick={() => onSelectProject(project)}
                        className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-sky-300 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        <div className="grid gap-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h3 className="break-words text-lg font-bold text-slate-950">
                                        {project.name}
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {project.customerName}
                                    </p>
                                </div>
                                <span className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-900">
                                    {project.status}
                                </span>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <ProjectMeta label="カード数" value={project.cardCount} />
                                <ProjectMeta
                                    label="見積状態"
                                    value={project.estimateStatus}
                                />
                                <ProjectMeta
                                    label="請求状態"
                                    value={project.invoiceStatus}
                                />
                                <ProjectMeta
                                    label="後日対応"
                                    value={project.hasFollowUp ? 'あり' : 'なし'}
                                />
                                <ProjectMeta
                                    label="問題対応"
                                    value={project.hasIssue ? 'あり' : 'なし'}
                                />
                                <ProjectMeta
                                    label="担当者"
                                    value={project.owner}
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
        <span className="grid gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-xs font-semibold text-slate-500">{label}</span>
            <span className="text-sm font-bold text-slate-900">{value}</span>
        </span>
    );
}
