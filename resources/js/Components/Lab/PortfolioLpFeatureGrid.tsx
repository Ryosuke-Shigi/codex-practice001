/**
 * portfolio LP の feature card grid Component です。
 *
 * 説明用配列をカード表示するだけにし、機能本体の状態やDBデータとは接続しません。
 */
type PortfolioLpFeature = {
    title: string;
    description: string;
    label?: string;
};

type PortfolioLpFeatureGridProps = {
    eyebrow: string;
    title: string;
    description: string;
    features: PortfolioLpFeature[];
};

/*
 * 機能一覧・価値一覧のような「短い説明カード群」だけを担当する共通コンポーネントです。
 * 2つのLPで同じ見た目を共有しますが、表示データ自体は各ページに閉じ込めます。
 * これにより、共通部品は表示責務だけを持ち、API Discovery Hubや地震マップ固有の仕様判断を持ちません。
 */
export default function PortfolioLpFeatureGrid({
    eyebrow,
    title,
    description,
    features,
}: PortfolioLpFeatureGridProps) {
    return (
        <section className="py-8">
            <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase text-cyan-100/72">
                    {eyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                    {title}
                </h2>
                <p className="mt-3 break-all text-sm leading-7 text-slate-200/80">
                    {description}
                </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {features.map((feature) => (
                    <article
                        key={feature.title}
                        className="min-w-0 rounded-lg border border-white/14 bg-white/10 p-4 text-white backdrop-blur-xl"
                    >
                        {feature.label && (
                            <p className="text-xs font-semibold uppercase text-amber-100/78">
                                {feature.label}
                            </p>
                        )}
                        <h3 className="mt-1 break-all text-base font-semibold leading-6">
                            {feature.title}
                        </h3>
                        <p className="mt-2 break-all text-sm leading-6 text-slate-200/78">
                            {feature.description}
                        </p>
                    </article>
                ))}
            </div>
        </section>
    );
}
