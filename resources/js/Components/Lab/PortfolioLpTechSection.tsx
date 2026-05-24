type PortfolioLpTechItem = {
    title: string;
    description: string;
};

type PortfolioLpLayerItem = {
    name: string;
    role: string;
};

type PortfolioLpTechSectionProps = {
    eyebrow: string;
    title: string;
    description: string;
    items: PortfolioLpTechItem[];
    layers: PortfolioLpLayerItem[];
};

/*
 * 技術的な工夫とADR / レイヤード責務の説明を並べて見せるセクションです。
 * ここで扱う layers は実装レイヤーの紹介文であり、実際の Action / Service / Repository を
 * 呼び出すものではありません。LPが本体処理に依存しないよう、すべて静的な表示データとして受け取ります。
 */
export default function PortfolioLpTechSection({
    eyebrow,
    title,
    description,
    items,
    layers,
}: PortfolioLpTechSectionProps) {
    return (
        <section className="border-y border-white/12 bg-slate-950/48 py-8">
            <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase text-emerald-100/76">
                        {eyebrow}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                        {title}
                    </h2>
                    <p className="mt-3 max-w-4xl break-all text-sm leading-7 text-slate-200/80">
                        {description}
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {items.map((item) => (
                            <article
                                key={item.title}
                                className="rounded-lg border border-emerald-100/16 bg-emerald-100/10 p-4"
                            >
                                <h3 className="text-base font-semibold leading-6 text-white">
                                    {item.title}
                                </h3>
                                <p className="mt-2 break-all text-sm leading-6 text-slate-200/78">
                                    {item.description}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase text-cyan-100/72">
                        Responsibility
                    </p>
                    <h3 className="mt-3 text-xl font-semibold text-white">
                        ADR / レイヤード構成
                    </h3>
                    <ol className="mt-4 grid gap-2">
                        {layers.map((layer, index) => (
                            <li
                                key={layer.name}
                                className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-lg border border-white/12 bg-white/8 p-3"
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-cyan-100/28 bg-cyan-100/10 text-xs font-semibold text-cyan-50">
                                    {index + 1}
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-sm font-semibold text-white">
                                        {layer.name}
                                    </span>
                                    <span className="mt-1 block break-all text-sm leading-6 text-slate-200/76">
                                        {layer.role}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
