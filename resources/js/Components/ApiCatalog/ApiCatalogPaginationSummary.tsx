export type ApiCatalogPaginationState = {
    /*
     * 本番一覧では Laravel paginator 由来、mock 一覧では固定データの抽出後件数由来です。
     * どちらも React 側へ渡る時点では同じ shape に揃え、表示 Component がデータ元を意識しないようにします。
     */
    currentPage: number;
    totalPages: number;
    totalItems: number;
    from: number | null;
    to: number | null;
};

export type ApiCatalogPaginationDisplayState = {
    hasItems: boolean;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    from: number;
    to: number;
};

type ApiCatalogPaginationSummaryProps = {
    pagination: ApiCatalogPaginationState;
};

function normalizeInteger(value: number) {
    /*
     * 表示 Component は原則として Responder / mock 計算済みの pagination をそのまま表示します。
     * ただし画面崩れの最後の防波堤として、NaN や小数が混ざった場合だけ整数へ丸めます。
     */
    return Math.floor(Number.isFinite(value) ? value : 0);
}

function normalizePositiveInteger(value: number) {
    return Math.max(1, normalizeInteger(value));
}

export function toApiCatalogPaginationDisplayState(
    pagination: ApiCatalogPaginationState,
): ApiCatalogPaginationDisplayState {
    const totalItems = Math.max(0, normalizeInteger(pagination.totalItems));

    if (totalItems === 0) {
        /*
         * Laravel paginator は0件でも lastPage=1 を返します。
         * その値をそのまま見せると「1 / 1 ページ」となり、該当データが存在するように読めてしまいます。
         * 0件時のユーザー向け文言は一覧の empty state に任せ、ページ summary 側は非表示にできる状態へ正規化します。
         */
        return {
            hasItems: false,
            currentPage: 0,
            totalPages: 0,
            totalItems,
            from: 0,
            to: 0,
        };
    }

    const totalPages = normalizePositiveInteger(pagination.totalPages);
    const currentPage = Math.min(normalizePositiveInteger(pagination.currentPage), totalPages);
    const rawFrom = pagination.from ?? 1;
    const rawTo = pagination.to ?? rawFrom;
    /*
     * from / to は「抽出後 total の範囲内」に丸めます。
     * これにより、検索条件変更直後や直URLで不正な page が来た場合でも
     * 「21〜20件目」のような逆転表示を pagination summary の中に閉じ込めて防ぎます。
     */
    const from = Math.min(Math.max(1, normalizeInteger(rawFrom)), totalItems);
    const to = Math.min(Math.max(from, normalizeInteger(rawTo)), totalItems);

    return {
        hasItems: true,
        currentPage,
        totalPages,
        totalItems,
        from,
        to,
    };
}

export default function ApiCatalogPaginationSummary({
    pagination,
}: ApiCatalogPaginationSummaryProps) {
    const display = toApiCatalogPaginationDisplayState(pagination);

    if (!display.hasItems) {
        /*
         * 0件メッセージは ApiCatalogList の責務です。
         * ここで別メッセージを出すと mock / 本番で empty state が二重表示になりやすいため、null を返します。
         */
        return null;
    }

    return (
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            <p className="font-semibold text-white">
                {display.currentPage} / {display.totalPages} ページ
            </p>
            <p>
                {display.from}〜{display.to}件目 / {display.totalItems}件
            </p>
            <p>検索結果 {display.totalItems}件</p>
        </div>
    );
}
