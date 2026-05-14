import { useState } from 'react';

export type MapRefreshAction = {
    buttonLabel: string;
    disabledLabel: string;
    statusLabel: string;
    description: string;
    isRefreshing: boolean;
    errorMessage: string | null;
    onRefresh: () => void;
};

type MapRefreshPanelProps = {
    action: MapRefreshAction;
    defaultOpen?: boolean;
};

export default function MapRefreshPanel({
    action,
    defaultOpen = false,
}: MapRefreshPanelProps) {
    const [isRefreshPanelOpen, setIsRefreshPanelOpen] = useState(defaultOpen);

    return (
        <section className="w-full min-w-0 rounded-lg border border-white/25 bg-slate-950/28 p-4 text-cyan-50 shadow-[0_18px_42px_rgba(2,24,45,0.16)] backdrop-blur-md">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="text-base font-semibold text-white">
                        地図データ更新
                    </h2>
                    <p role="status" aria-live="polite" className="mt-2 text-sm font-semibold leading-6 text-white">
                        {action.statusLabel}
                    </p>
                </div>
                <button
                    type="button"
                    aria-expanded={isRefreshPanelOpen}
                    onClick={() => setIsRefreshPanelOpen((current) => !current)}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-cyan-100/45 bg-cyan-100/18 px-4 text-sm font-bold text-cyan-50 transition hover:bg-cyan-100/28 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/55 disabled:cursor-wait disabled:opacity-60"
                >
                    {isRefreshPanelOpen ? '閉じる' : '開く'}
                </button>
            </div>

            {isRefreshPanelOpen && (
                <div className="mt-4 border-t border-white/15 pt-4">
                    <p className="text-sm font-semibold leading-6 text-white">
                        {action.statusLabel}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-cyan-50/75">
                        {action.description}
                    </p>
                    {action.errorMessage && (
                        <p className="mt-3 rounded-md border border-rose-200/35 bg-rose-200/10 px-3 py-2 text-sm leading-6 text-rose-50">
                            {action.errorMessage}
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={action.onRefresh}
                        disabled={action.isRefreshing}
                        className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-cyan-100/45 bg-cyan-100/18 px-4 text-sm font-bold text-cyan-50 transition hover:bg-cyan-100/28 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/55 disabled:cursor-wait disabled:opacity-60"
                    >
                        {action.isRefreshing ? action.disabledLabel : action.buttonLabel}
                    </button>
                </div>
            )}
        </section>
    );
}
