/**
 * 工事発注管理・請求システム MOCK の工程表示 Component です。
 *
 * 工程ON/OFFの画面内 state を表示するだけにし、実際の工程進捗保存や通知処理は行いません。
 */
import type { WorkflowStep } from './mockData';

type WorkflowStepsPanelProps = {
    workflowEnabled: boolean;
    workflowStepState: Record<string, boolean>;
    workflowSteps: WorkflowStep[];
    onToggleWorkflowEnabled: () => void;
    onToggleStep: (stepId: string) => void;
};

function stepClassName(isActive: boolean) {
    return isActive
        ? 'border-emerald-200/70 bg-emerald-300/18 text-emerald-50'
        : 'border-white/15 bg-slate-950/45 text-slate-300';
}

export default function WorkflowStepsPanel({
    workflowEnabled,
    workflowStepState,
    workflowSteps,
    onToggleWorkflowEnabled,
    onToggleStep,
}: WorkflowStepsPanelProps) {
    return (
        <section className="rounded-lg border border-white/15 bg-slate-950/70 p-4 backdrop-blur-xl sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">工程ワークフロー</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-200/78">
                        各工程のON/OFFだけでヘッダーの現在ステータスが変わる、画面内完結の確認用です。
                    </p>
                </div>
                <button
                    type="button"
                    aria-pressed={workflowEnabled}
                    className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 ${
                        workflowEnabled
                            ? 'border-emerald-200/60 bg-emerald-300/18 text-emerald-50'
                            : 'border-white/15 bg-white/8 text-slate-200'
                    }`}
                    onClick={onToggleWorkflowEnabled}
                >
                    ワークフロー {workflowEnabled ? 'ON' : 'OFF'}
                </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                {workflowSteps.map((step, index) => {
                    const isActive = workflowEnabled && workflowStepState[step.id];

                    return (
                        <button
                            key={step.id}
                            type="button"
                            aria-pressed={isActive}
                            className={`flex min-h-[92px] items-start gap-3 rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 ${stepClassName(isActive)}`}
                            onClick={() => onToggleStep(step.id)}
                        >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current text-sm font-bold">
                                {index + 1}
                            </span>
                            <span>
                                <span className="block font-semibold">{step.label}</span>
                                <span className="mt-1 block text-xs opacity-80">
                                    {isActive ? '完了扱い' : '未完了扱い'}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
