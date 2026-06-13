/**
 * API Catalog の provider_key から表示・filter 用 domain を取り出す utility です。
 *
 * DB カラムを増やさず UI 表示の補助に限定し、Repository の検索条件そのものは backend 側で扱います。
 */
export function extractProviderDomain(providerKey: string | null | undefined): string {
    /*
     * 本番DBに domain 専用カラムは持たせません。
     * 一覧の domain 絞り込みは provider_key のホスト末尾から表示用に抽出し、
     * モック/本番とも「入力データから条件値を作る」形に揃えます。
     */
    const normalizedProviderKey = (providerKey ?? '').trim().toLowerCase();

    if (normalizedProviderKey === '') {
        return '';
    }

    const host = normalizedProviderKey.split(':')[0] ?? normalizedProviderKey;
    const segments = host.split('.').filter((segment) => segment !== '');

    return segments[segments.length - 1] ?? host;
}

export function createProviderDomainOptions(providerKeys: string[]): string[] {
    /*
     * select に渡す候補は provider_key 配列から作るだけにします。
     * Component 側へ候補生成ロジックを散らさず、重複排除と並び替えもここで揃えます。
     */
    return Array.from(
        new Set(
            providerKeys
                .map((providerKey) => extractProviderDomain(providerKey))
                .filter((domain) => domain !== ''),
        ),
    ).sort((first, second) => first.localeCompare(second));
}
