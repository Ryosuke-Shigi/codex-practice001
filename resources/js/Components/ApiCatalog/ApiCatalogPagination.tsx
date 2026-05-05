export type ApiCatalogPaginationState = {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    from: number | null;
    to: number | null;
};

type ApiCatalogPaginationProps = {
    pagination: ApiCatalogPaginationState;
    onPrevious: () => void;
    onNext: () => void;
};

function normalizePage(value: number) {
    /*
     * 表示 Component は API から受けたページ番号を信用しすぎず、
     * 小数や 0 以下の値が混ざっても UI が崩れない最低限の正規化だけを行います。
     */
    return Math.max(1, Math.floor(value));
}

export default function ApiCatalogPagination({
    pagination,
    onPrevious,
    onNext,
}: ApiCatalogPaginationProps) {
    /*
     * 0件時は「1 / 1」と見せると存在しないページがあるように見えるため、
     * 表示上は 0 / 0 にし、前後移動も必ず無効にします。
     */
    const hasItems = pagination.totalItems > 0;
    const totalPages = hasItems ? normalizePage(pagination.totalPages) : 0;
    const currentPage = hasItems ? Math.min(normalizePage(pagination.currentPage), totalPages) : 0;
    const canMovePrevious = hasItems && currentPage > 1;
    const canMoveNext = hasItems && currentPage < totalPages;
    const from = hasItems ? pagination.from ?? 0 : 0;
    const to = hasItems ? pagination.to ?? 0 : 0;

    return (
        <footer className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/30 bg-slate-950/28 px-4 py-3 text-sm text-cyan-50/82 backdrop-blur-2xl">
            <p>
                {from}-{to} / {pagination.totalItems}
            </p>

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={!canMovePrevious}
                    aria-label="前のページ"
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/35 bg-white/18 text-xl font-bold text-white shadow-[0_10px_22px_rgba(2,24,45,0.18)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35 disabled:cursor-not-allowed disabled:opacity-45"
                >
                    ←
                </button>

                <p className="min-w-[6.5rem] text-center text-sm font-semibold text-white">
                    {currentPage} / {totalPages}
                </p>

                <button
                    type="button"
                    onClick={onNext}
                    disabled={!canMoveNext}
                    aria-label="次のページ"
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/35 bg-white/18 text-xl font-bold text-white shadow-[0_10px_22px_rgba(2,24,45,0.18)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35 disabled:cursor-not-allowed disabled:opacity-45"
                >
                    →
                </button>
            </div>
        </footer>
    );
}
