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
        <header className="shrink-0 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {/* Entry tabs are the only global tabs; detail screens hide this header. */}
            <nav aria-label="MOCK画面タブ" className="grid grid-cols-2 gap-1">
                {screenSteps.map((step, index) => {
                    const isActive = step.key === activeScreen;

                    return (
                        <button
                            key={step.key}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => onScreenChange(step.key)}
                            className={[
                                'inline-flex min-h-9 min-w-0 items-center justify-center rounded-md border px-2 text-center text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 sm:text-sm',
                                isActive
                                    ? 'border-sky-600 bg-sky-700 text-white'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                            ].join(' ')}
                        >
                            <span className="sr-only">{index + 1}. </span>
                            <span className="whitespace-nowrap">{step.label}</span>
                        </button>
                    );
                })}
            </nav>
        </header>
    );
}
