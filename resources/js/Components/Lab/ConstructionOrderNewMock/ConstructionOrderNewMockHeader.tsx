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
    const activeTab =
        activeScreen === 'project-detail' || activeScreen === 'card-detail'
            ? 'projects'
            : activeScreen;

    return (
        <header className="sticky top-0 z-20 grid gap-3 border-b border-slate-200 bg-[#f4f8fb]/95 pb-3 pt-2 backdrop-blur">
            <h1 className="text-xl font-bold leading-tight text-slate-950 sm:text-2xl">
                工事発注管理・請求システム 新MOCK
            </h1>

            {/* Mobile-first tabs: three primary entry routes remain visible without horizontal hiding. */}
            <nav aria-label="新MOCK画面タブ" className="grid grid-cols-3 gap-2">
                {screenSteps.map((step, index) => {
                    const isActive = step.key === activeTab;

                    return (
                        <button
                            key={step.key}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => onScreenChange(step.key)}
                            className={[
                                'inline-flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-lg border px-2 text-center text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 sm:gap-2 sm:px-4 sm:text-sm',
                                isActive
                                    ? 'border-sky-600 bg-sky-700 text-white'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                            ].join(' ')}
                        >
                            <span
                                className={[
                                    'grid h-6 w-6 place-items-center rounded-md border text-xs font-bold',
                                    isActive
                                        ? 'border-white/50 bg-white/15 text-white'
                                        : 'border-slate-200 bg-slate-50 text-slate-500',
                                ].join(' ')}
                            >
                                {index + 1}
                            </span>
                            <span className="whitespace-nowrap">{step.label}</span>
                        </button>
                    );
                })}
            </nav>
        </header>
    );
}
