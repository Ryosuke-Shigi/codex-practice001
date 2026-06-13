/**
 * API Catalog 一覧のカード配列表示 Component です。
 *
 * 表示対象 items を受け取り、検索や pagination の条件生成は Page / Responder の境界に残します。
 */
import ApiCatalogCard, { type ApiCatalogCardItem } from './ApiCatalogCard';

export type ApiCatalogListItem = ApiCatalogCardItem & {
    listKey: string | number;
};

type ApiCatalogListProps = {
    items: ApiCatalogListItem[];
    isLoading?: boolean;
    loadingMessage?: string;
    emptyMessage?: string;
    emptyHelpMessage?: string;
};

export default function ApiCatalogList({
    items,
    isLoading = false,
    loadingMessage = 'APIを読み込んでいます',
    emptyMessage = '該当するAPIはありません',
    emptyHelpMessage = '条件を変更して再検索してください',
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
                <div className="col-span-full flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-white/30 bg-slate-950/32 p-8 text-center text-sm font-semibold text-cyan-50/82 backdrop-blur-2xl">
                    {/*
                        0件時は pagination footer を表示しないため、ここが唯一の空状態表示になります。
                        主文と補助文を分けて、検索・抽出の結果が空であることと次の操作を同時に伝えます。
                    */}
                    <p className="text-base font-bold text-white">{emptyMessage}</p>
                    <p className="mt-2">{emptyHelpMessage}</p>
                </div>
            )}
        </section>
    );
}
