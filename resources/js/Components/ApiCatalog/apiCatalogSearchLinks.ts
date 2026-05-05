export type ApiCatalogSearchTarget = {
    title: string | null;
    providerKey: string | null;
    description?: string | null;
    apiKey?: string | null;
};

export type ApiCatalogSearchLinkKey = 'google' | 'github' | 'docs' | 'sample';

export type ApiCatalogSearchLink = {
    key: ApiCatalogSearchLinkKey;
    label: string;
    helperLabel?: string;
    ariaLabel: string;
    href: string;
};

const GOOGLE_SEARCH_URL = 'https://www.google.com/search';

function normalizedPart(value: string | null | undefined) {
    /*
     * API名やprovider名には日本語、英語、複数スペースが混ざります。
     * 検索意図を変えずにURLを安定させるため、前後空白と連続空白だけを整えます。
     */
    return value?.trim().replace(/\s+/g, ' ') ?? '';
}

function buildBaseSearchQuery(target: ApiCatalogSearchTarget) {
    /*
     * 検索URLはDBやRepositoryではなく、Reactの表示境界で生成します。
     * 仕様どおり API名 + provider名 を基本にし、どちらも空の場合だけ description/apiKey を保険にします。
     */
    const baseParts = [normalizedPart(target.title), normalizedPart(target.providerKey)].filter(Boolean);

    if (baseParts.length > 0) {
        return baseParts.join(' ');
    }

    const fallbackParts = [normalizedPart(target.description), normalizedPart(target.apiKey)].filter(Boolean);

    return fallbackParts.join(' ') || 'API';
}

export function buildApiCatalogSearchUrl(target: ApiCatalogSearchTarget, suffix = '') {
    const baseQuery = buildBaseSearchQuery(target);
    const query = [baseQuery, normalizedPart(suffix)].filter(Boolean).join(' ');

    /*
     * 日本語・英語・空白を含むAPI名でも壊れないよう、query全体を必ずURLエンコードします。
     */
    return `${GOOGLE_SEARCH_URL}?q=${encodeURIComponent(query)}`;
}

export function buildApiCatalogSearchLinks(target: ApiCatalogSearchTarget): ApiCatalogSearchLink[] {
    /*
     * 4種類すべて Google 検索URLとして生成します。
     * Docs / Sample も外部ページそのものではなく検索補助なので、公式/正解とは断定しない文言にします。
     */
    return [
        {
            key: 'google',
            label: 'Google',
            ariaLabel: 'Googleで関連情報を検索する',
            href: buildApiCatalogSearchUrl(target),
        },
        {
            key: 'github',
            label: 'GitHub',
            ariaLabel: 'GitHub上の関連情報をGoogleで検索する',
            href: buildApiCatalogSearchUrl(target, 'site:github.com'),
        },
        {
            key: 'docs',
            label: 'Docs',
            helperLabel: '候補',
            ariaLabel: '公式とは断定せず、関連ドキュメント候補をGoogleで検索する',
            href: buildApiCatalogSearchUrl(target, 'official docs'),
        },
        {
            key: 'sample',
            label: 'Sample',
            helperLabel: '候補',
            ariaLabel: '正しいサンプルとは断定せず、実装例候補をGoogleで検索する',
            href: buildApiCatalogSearchUrl(target, 'example sample'),
        },
    ];
}
