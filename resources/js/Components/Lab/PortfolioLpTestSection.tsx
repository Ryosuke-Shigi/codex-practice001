/**
 * portfolio LP のテスト観点 section Component です。
 *
 * テストで守る観点の説明表示だけを扱い、実行可能な仕様固定は tests 側に置きます。
 */
type PortfolioLpTestItem = {
    title: string;
    description: string;
};

type PortfolioLpTestSectionProps = {
    eyebrow: string;
    title: string;
    description: string;
    tests: PortfolioLpTestItem[];
    note?: string;
};

/*
 * テスト観点をポートフォリオ向けに説明するセクションです。
 * 実際のテスト実行結果をここで取得するのではなく、どの仕様をテストで守っているかを静的に示します。
 * 防災用途の注意書きなど、ページ固有の補足は note に閉じ込め、共通コンポーネント側に
 * 機能固有の分岐を増やさないようにします。
 */
export default function PortfolioLpTestSection({
    eyebrow,
    title,
    description,
    tests,
    note,
}: PortfolioLpTestSectionProps) {
    return (
        <section className="py-8">
            <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase text-rose-100/76">
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
                {tests.map((test) => (
                    <article
                        key={test.title}
                        className="rounded-lg border border-rose-100/16 bg-rose-100/10 p-4"
                    >
                        <h3 className="text-base font-semibold leading-6 text-white">
                            {test.title}
                        </h3>
                        <p className="mt-2 break-all text-sm leading-6 text-slate-200/78">
                            {test.description}
                        </p>
                    </article>
                ))}
            </div>

            {note && (
                <p className="mt-5 break-all rounded-lg border border-amber-100/22 bg-amber-100/10 p-4 text-sm font-semibold leading-7 text-amber-50">
                    {note}
                </p>
            )}
        </section>
    );
}
