/** 一覧ではMarkdownリンクの表示名を残し、長いURLや装飾による抜粋の読みにくさを抑えます。原文は詳細に残します。 */
export function apiCatalogDescriptionExcerpt(value: string | null) {
    return (value ?? '')
        .replace(/!?\[([^\]]+)\]\([^\s)]+\)/g, '$1')
        .replace(/<[^>]*>/g, ' ')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/[#*_>|]/g, '')
        .replace(/\x60/g, '')
        .replace(/\s+/g, ' ').trim() || '説明は登録されていません。';
}
