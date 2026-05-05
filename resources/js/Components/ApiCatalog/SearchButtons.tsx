import {
    buildApiCatalogSearchLinks,
    type ApiCatalogSearchTarget,
} from './apiCatalogSearchLinks';

type SearchButtonsProps = ApiCatalogSearchTarget & {
    size?: 'compact' | 'comfortable';
    className?: string;
};

const sizeClassNames = {
    /*
     * カード内と詳細ヘッダーで同じComponentを使うため、余白だけをsizeで切り替えます。
     * 検索リンク生成やボタン種別はここで分岐させず、見た目の差だけに留めます。
     */
    compact: 'min-h-8 px-2.5 text-[0.72rem]',
    comfortable: 'min-h-10 px-4 text-sm',
};

export default function SearchButtons({
    title,
    providerKey,
    description = null,
    apiKey = null,
    size = 'comfortable',
    className = '',
}: SearchButtonsProps) {
    /*
     * SearchButtons は外部検索結果の正しさを判定しません。
     * API名やprovider名などの表示用元データを受け取り、別タブで開く検索導線だけを描画します。
     */
    const links = buildApiCatalogSearchLinks({
        title,
        providerKey,
        description,
        apiKey,
    });

    return (
        /*
         * ApiCatalogCard ではカード全体に詳細リンクのoverlayがあります。
         * relative z-20 をここで持つことで、検索ボタンだけは詳細遷移ではなく外部検索を優先できます。
         */
        <div className={`relative z-20 flex flex-wrap items-center gap-2 ${className}`}>
            {links.map((link) => (
                <a
                    key={link.key}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.ariaLabel}
                    title={link.ariaLabel}
                    className={`inline-flex items-center justify-center gap-1 rounded-lg border border-cyan-100/35 bg-cyan-50/15 font-bold text-cyan-50 transition hover:bg-cyan-50/24 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/30 ${sizeClassNames[size]}`}
                >
                    <span>{link.label}</span>
                    {/* Docs / Sample は検索補助の候補であり、公式性や正しさを保証しないことをUI上でも示します。 */}
                    {link.helperLabel && (
                        <span className="text-[0.62rem] font-semibold text-cyan-100/68">
                            {link.helperLabel}
                        </span>
                    )}
                </a>
            ))}
        </div>
    );
}
