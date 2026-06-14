import type { MockScreen } from './mockData';
import { screenSteps } from './mockData';

type ConstructionOrderNewMockHeaderProps = {
    activeScreen: MockScreen;
    onScreenChange: (screen: MockScreen) => void;
};

export default function ConstructionOrderNewMockHeader({
    activeScreen,
    onScreenChange,
}: ConstructionOrderNewMockHeaderProps) {
    return (
        <header className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-3">
                <div className="flex flex-wrap gap-2">
                    <span className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-900">
                        UI MOCK
                    </span>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        保存・取込・生成なし
                    </span>
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900">
                        ADR / レイヤード分解の材料
                    </span>
                </div>

                <div className="grid gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Construction Order / Billing
                    </p>
                    <h1 className="text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">
                        工事発注管理・請求システム 新MOCK
                    </h1>
                    <p className="text-sm leading-7 text-slate-600">
                        案件登録、CSV投入、案件中心のカード管理、見積書・請求書・領収書の提出書類風プレビューを、固定データだけで確認します。
                    </p>
                </div>
            </div>

            <nav aria-label="新MOCK画面導線" className="grid gap-2">
                {screenSteps.map((step, index) => {
                    const isActive = step.key === activeScreen;

                    return (
                        <button
                            key={step.key}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => onScreenChange(step.key)}
                            className={[
                                'grid min-h-16 grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100',
                                isActive
                                    ? 'border-sky-500 bg-sky-50 text-sky-950'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-slate-50',
                            ].join(' ')}
                        >
                            <span
                                className={[
                                    'grid h-8 w-8 place-items-center rounded-md border text-sm font-bold',
                                    isActive
                                        ? 'border-sky-500 bg-sky-600 text-white'
                                        : 'border-slate-200 bg-slate-50 text-slate-500',
                                ].join(' ')}
                            >
                                {index + 1}
                            </span>
                            <span className="min-w-0">
                                <span className="block text-sm font-bold">
                                    {step.label}
                                </span>
                                <span className="mt-1 block text-xs leading-5 text-slate-500">
                                    {step.description}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </nav>
        </header>
    );
}
