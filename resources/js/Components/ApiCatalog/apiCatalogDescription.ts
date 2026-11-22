/** 一覧ではMarkdownリンクを表示名にします。識別子・言語名の記号や原文のURLは保持します。 */
export function apiCatalogDescriptionExcerpt(value: string | null) {
    const original = (value ?? '').trim();
    return original
        .replace(/!?\[([^\]]+)\]\([^\s)]+\)/g, '$1')
        .replace(/\s+/g, ' ').trim() || original || '説明は登録されていません。';
}
