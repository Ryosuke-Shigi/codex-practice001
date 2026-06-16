import { useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    ClipboardList,
    Link2,
    Plus,
} from 'lucide-react';

import type { CardKind, Project, StageStatus, WorkCard } from './mockData';
import {
    cardKindLabels,
    cardKindStyles,
    formatYen,
    isNegativeAmount,
} from './mockData';

type ProjectWorkDetailPanelProps = {
    project: Project;
    onOpenCard: (card: WorkCard) => void;
    onAddCard: (kind: CardKind) => void;
};

type DetailSection = 'overview' | 'workflowCards' | 'history' | 'relatedCases';

const addableKinds: CardKind[] = [
    'product',
    'work',
    'expense',
    'adjustment',
    'exception',
];

const detailSections: {
    key: DetailSection;
    label: string;
}[] = [
    {
        key: 'overview',
        label: '概要',
    },
    {
        key: 'workflowCards',
        label: '工程・カード',
    },
    {
        key: 'history',
        label: '履歴',
    },
    {
        key: 'relatedCases',
        label: '関連',
    },
];

const statusClassNames: Record<StageStatus, string> = {
    できていない: 'border-slate-300 bg-slate-100 text-slate-700',
    確認中: 'border-sky-300 bg-sky-50 text-sky-900',
    できている: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    対象外: 'border-slate-300 bg-white text-slate-600',
    SKIP: 'border-amber-300 bg-amber-50 text-amber-900',
    差戻し: 'border-rose-300 bg-rose-50 text-rose-900',
};

export default function ProjectWorkDetailPanel({
    project,
    onOpenCard,
    onAddCard,
}: ProjectWorkDetailPanelProps) {
    const [activeSection, setActiveSection] =
        useState<DetailSection>('overview');
    const evidenceCount = project.cards.reduce(
        (total, card) => total + card.photos.length + card.files.length,
        0,
    );

    return (
        <section className="grid gap-3">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-950">
                <ClipboardList aria-hidden="true" className="h-5 w-5" />
                詳細
            </h3>

            <div className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                {detailSections.map((section) => {
                    const isActive = activeSection === section.key;

                    return (
                        <button
                            key={section.key}
                            type="button"
                            onClick={() => setActiveSection(section.key)}
                            className={[
                                'min-h-9 shrink-0 rounded-md px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100',
                                isActive
                                    ? 'bg-slate-950 text-white'
                                    : 'bg-white text-slate-700 hover:bg-slate-100',
                            ].join(' ')}
                            aria-pressed={isActive}
                        >
                            {section.label}
                        </button>
                    );
                })}
            </div>

            {activeSection === 'overview' && (
                <OverviewSection evidenceCount={evidenceCount} project={project} />
            )}

            {activeSection === 'workflowCards' && (
                <WorkflowCardsSection
                    project={project}
                    onOpenCard={onOpenCard}
                    onAddCard={onAddCard}
                />
            )}

            {activeSection === 'history' && <HistoryPanel project={project} />}

            {activeSection === 'relatedCases' && (
                <RelatedProjectsPanel project={project} />
            )}
        </section>
    );
}

function OverviewSection({
    project,
    evidenceCount,
}: {
    project: Project;
    evidenceCount: number;
}) {
    return (
        <div className="grid gap-3">
            <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryTile label="案件パターン" value={project.pattern} />
                    <SummaryTile label="進行状態" value={project.progressStatus} />
                    <SummaryTile
                        label="未完了カード"
                        value={`${project.pendingCardCount}件`}
                    />
                    <SummaryTile
                        label="要確認件数"
                        value={`${project.confirmCount}件`}
                    />
                    <SummaryTile
                        label="金額サマリー"
                        value={formatYen(project.amountSummary)}
                        tone={project.amountSummary < 0 ? 'danger' : 'default'}
                    />
                    <SummaryTile label="最終更新" value={project.lastUpdated} />
                    <SummaryTile
                        label="写真・証跡"
                        value={`${evidenceCount}件`}
                    />
                    <SummaryTile
                        label="調整カード"
                        value={`${project.cards.filter((card) => card.kind === 'adjustment').length}件`}
                    />
                </div>
            </section>

            <section className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <h4 className="flex items-center gap-2 text-base font-bold text-slate-950">
                    <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-emerald-700" />
                    完了確認
                </h4>
                <div className="grid gap-2 sm:grid-cols-3">
                    {project.completionChecks.map((check) => (
                        <article
                            key={check.id}
                            className="rounded-md border border-slate-200 bg-slate-50 p-3"
                        >
                            <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700">
                                {check.status}
                            </span>
                            <h5 className="mt-2 text-sm font-bold text-slate-950">
                                {check.label}
                            </h5>
                            <p className="mt-1 text-xs leading-5 text-slate-600">
                                {check.note}
                            </p>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}

function WorkflowCardsSection({
    project,
    onOpenCard,
    onAddCard,
}: {
    project: Project;
    onOpenCard: (card: WorkCard) => void;
    onAddCard: (kind: CardKind) => void;
}) {
    return (
        <section className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-base font-bold text-slate-950">
                    工程・カード
                </h4>
                <div className="flex flex-wrap gap-1.5">
                    {addableKinds.map((kind) => (
                        <button
                            key={kind}
                            type="button"
                            onClick={() => onAddCard(kind)}
                            className="inline-flex min-h-8 items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                        >
                            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                            {cardKindLabels[kind]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-2">
                {project.workflowStages.map((stage) => {
                    const stageCards = project.cards.filter((card) =>
                        stage.cardIds.includes(card.id),
                    );

                    return (
                        <article
                            key={stage.id}
                            className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <h5 className="break-words text-sm font-bold text-slate-950">
                                        {stage.label}
                                    </h5>
                                    <p className="mt-1 text-xs leading-5 text-slate-600">
                                        {stage.description}
                                    </p>
                                </div>
                                <span
                                    className={`rounded-md border px-2 py-1 text-xs font-bold ${statusClassNames[stage.status]}`}
                                >
                                    {stage.status}
                                </span>
                            </div>

                            <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                                <DetailMini label="状態メモ" value={stage.statusNote} />
                                <DetailMini
                                    label="証跡"
                                    value={stage.evidenceSummary}
                                />
                                <DetailMini
                                    label="完了確認"
                                    value={stage.completionNote}
                                />
                            </div>

                            <div className="grid gap-2">
                                <p className="text-xs font-bold text-slate-500">
                                    工程内カード
                                </p>
                                {stageCards.length === 0 && (
                                    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm font-bold text-slate-500">
                                        この工程に紐づくカードはありません。
                                    </div>
                                )}
                                {stageCards.map((card) => (
                                    <StageCardButton
                                        key={card.id}
                                        card={card}
                                        onOpenCard={onOpenCard}
                                    />
                                ))}
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

function StageCardButton({
    card,
    onOpenCard,
}: {
    card: WorkCard;
    onOpenCard: (card: WorkCard) => void;
}) {
    const styles = cardKindStyles[card.kind];

    return (
        <button
            type="button"
            onClick={() => onOpenCard(card)}
            className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 text-left transition hover:border-sky-300 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 sm:grid-cols-[minmax(0,1fr)_7rem_6rem]"
        >
            <span className="min-w-0">
                <span
                    className={`inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-bold ${styles.badge}`}
                >
                    {cardKindLabels[card.kind]}
                </span>
                <span className="mt-1 block break-words text-sm font-bold text-slate-950">
                    {card.title}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">
                    {card.summary}
                </span>
                {card.requiresRelatedProject && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-md border border-fuchsia-200 bg-fuchsia-50 px-2 py-1 text-[11px] font-bold text-fuchsia-900">
                        <Link2 aria-hidden="true" className="h-3 w-3" />
                        関連案件へ接続
                    </span>
                )}
            </span>
            <span className="flex flex-wrap gap-1 sm:block">
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700">
                    {card.status}
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 sm:mt-1 sm:block">
                    {card.hasPhotos ? '写真あり' : '写真なし'} /{' '}
                    {card.hasFiles ? 'ファイルあり' : 'ファイルなし'}
                </span>
            </span>
            <span className="flex items-center justify-between gap-2 sm:block sm:text-right">
                <span
                    className={[
                        'font-bold',
                        isNegativeAmount(card.amount)
                            ? 'text-rose-600'
                            : 'text-slate-950',
                    ].join(' ')}
                >
                    {formatYen(card.amount)}
                </span>
                <span className="ml-3 text-xs font-bold text-sky-700 sm:ml-0 sm:mt-2 sm:block">
                    詳細 &gt;
                </span>
            </span>
        </button>
    );
}

function DetailMini({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid gap-1 sm:grid-cols-[5rem_minmax(0,1fr)]">
            <span className="text-xs font-bold text-slate-500">{label}</span>
            <span className="break-words text-xs font-semibold leading-5 text-slate-800">
                {value}
            </span>
        </div>
    );
}

function SummaryTile({
    label,
    value,
    tone = 'default',
}: {
    label: string;
    value: string;
    tone?: 'default' | 'danger';
}) {
    return (
        <div className="grid gap-1 rounded-md border border-slate-200 bg-slate-50 p-3">
            <span className="text-xs font-semibold text-slate-500">{label}</span>
            <span
                className={[
                    'break-words text-sm font-bold',
                    tone === 'danger' ? 'text-rose-600' : 'text-slate-950',
                ].join(' ')}
            >
                {value}
            </span>
        </div>
    );
}

function HistoryPanel({ project }: { project: Project }) {
    return (
        <section className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <h4 className="text-base font-bold text-slate-950">履歴</h4>
            {project.histories.map((history) => (
                <article
                    key={history.id}
                    className="rounded-md border border-slate-200 bg-slate-50 p-3"
                >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <h5 className="text-sm font-bold text-slate-950">
                            {history.action}
                        </h5>
                        <span className="text-xs font-semibold text-slate-500">
                            {history.actedAt}
                        </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                        {history.reason}
                    </p>
                    <div className="mt-2 grid gap-1 text-[11px] font-semibold text-slate-600">
                        <span>操作者: {history.operator}</span>
                        <span>関連工程: {history.relatedStage}</span>
                        <span>関連カード: {history.relatedCard}</span>
                        <span>関連案件: {history.relatedProject}</span>
                    </div>
                </article>
            ))}
        </section>
    );
}

function RelatedProjectsPanel({ project }: { project: Project }) {
    return (
        <section className="grid gap-2 rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-3 shadow-sm">
            <h4 className="flex items-center gap-2 text-base font-bold text-fuchsia-950">
                <AlertTriangle aria-hidden="true" className="h-5 w-5" />
                関連案件
            </h4>
            <p className="text-xs leading-5 text-fuchsia-900">
                完了済み案件を無理に再オープンせず、再訪問や保証対応は関連案件として分けます。
            </p>
            {project.relatedProjects.length === 0 && (
                <div className="rounded-md border border-dashed border-fuchsia-300 bg-white p-3 text-sm font-bold text-fuchsia-900">
                    関連案件はありません。
                </div>
            )}
            {project.relatedProjects.map((relatedProject) => (
                <article
                    key={relatedProject.id}
                    className="rounded-md border border-fuchsia-200 bg-white p-3"
                >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <h5 className="break-words text-sm font-bold text-fuchsia-950">
                            {relatedProject.title}
                        </h5>
                        <span className="rounded-md border border-fuchsia-200 bg-fuchsia-50 px-2 py-1 text-[11px] font-bold text-fuchsia-900">
                            {relatedProject.relationType}
                        </span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-fuchsia-800">
                        {relatedProject.status} / {relatedProject.owner}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-fuchsia-900">
                        {relatedProject.reason}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold text-fuchsia-800">
                        元カード: {relatedProject.sourceCardTitle}
                    </p>
                </article>
            ))}
        </section>
    );
}
