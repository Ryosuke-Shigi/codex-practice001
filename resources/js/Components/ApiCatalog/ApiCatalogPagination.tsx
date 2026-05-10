import ApiCatalogPaginationSummary, {
    toApiCatalogPaginationDisplayState,
    type ApiCatalogPaginationState,
} from './ApiCatalogPaginationSummary';

export type { ApiCatalogPaginationState };

type ApiCatalogPaginationProps = {
    pagination: ApiCatalogPaginationState;
    onPrevious: () => void;
    onNext: () => void;
};

export default function ApiCatalogPagination({
    pagination,
    onPrevious,
    onNext,
}: ApiCatalogPaginationProps) {
    /*
     * 0件時の案内は一覧の empty state へ任せます。
     * ページ footer 自体を出さないことで「1 / 0 ページ」「1〜0件目」のような壊れた表記を避けます。
     * 前後移動ボタンも同時に消えるため、空結果から存在しないページへ進む操作も発生しません。
     */
    const display = toApiCatalogPaginationDisplayState(pagination);

    if (!display.hasItems) {
        return null;
    }

    const canMovePrevious = display.currentPage > 1;
    const canMoveNext = display.currentPage < display.totalPages;

    return (
        <footer className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/30 bg-slate-950/28 px-4 py-3 text-sm text-cyan-50/82 backdrop-blur-2xl">
            {/*
                件数 summary は mock / 本番で完全共通にします。
                ページ送りボタン側では同じ display state だけを参照し、別々の page 計算を増やさないようにします。
            */}
            <ApiCatalogPaginationSummary pagination={pagination} />

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
                    {display.currentPage} / {display.totalPages}
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
