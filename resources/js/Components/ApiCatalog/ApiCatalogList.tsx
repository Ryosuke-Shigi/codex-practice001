import ApiCatalogCard, { type ApiCatalogCardItem } from './ApiCatalogCard';

export type ApiCatalogListItem = ApiCatalogCardItem & {
    listKey: string | number;
};

type ApiCatalogListProps = {
    items: ApiCatalogListItem[];
    isLoading?: boolean;
    loadingMessage?: string;
    emptyMessage?: string;
};

export default function ApiCatalogList({
    items,
    isLoading = false,
    loadingMessage = 'APIを読み込んでいます',
    emptyMessage = '条件に一致するAPIはありません',
}: ApiCatalogListProps) {
    return (
        <section className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {/* 取得・検索・ページング済みの表示用データだけを受け取り、一覧の描画に集中します。 */}
            {isLoading && (
                <div className="col-span-full flex min-h-[220px] items-center justify-center rounded-2xl border border-white/30 bg-slate-950/32 p-8 text-center text-sm font-semibold text-cyan-50/82 backdrop-blur-2xl">
                    {loadingMessage}
                </div>
            )}

            {!isLoading &&
                items.map((item, index) => (
                    <ApiCatalogCard key={item.listKey} item={item} index={index} />
                ))}

            {!isLoading && items.length === 0 && (
                <div className="col-span-full flex min-h-[220px] items-center justify-center rounded-2xl border border-white/30 bg-slate-950/32 p-8 text-center text-sm font-semibold text-cyan-50/82 backdrop-blur-2xl">
                    {emptyMessage}
                </div>
            )}
        </section>
    );
}
