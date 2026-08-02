/**
 * API Discovery Hub 本番詳細の Inertia Page Component です。
 *
 * Responder から受け取った詳細 DTO と保存メモ props を表示し、API取得や所有判定は backend 側へ分けます。
 */
import { Head } from '@inertiajs/react';

import ApiCatalogDetailBody, {
    type ApiCatalogDetailTechnicalRow,
} from '@/Components/ApiCatalog/ApiCatalogDetailBody';
import ApiCatalogDetailHeader from '@/Components/ApiCatalog/ApiCatalogDetailHeader';
import ApiCatalogDetailHero from '@/Components/ApiCatalog/ApiCatalogDetailHero';
import ApiCatalogNotesPanel, {
    type ApiCatalogNoteItem,
} from '@/Components/ApiCatalog/ApiCatalogNotesPanel';
import { extractProviderDomain } from '@/Components/ApiCatalog/apiCatalogDomain';
import PublicLayout from '@/Layouts/PublicLayout';

/*
 * 本番詳細の戻るボタンで許可する唯一のルート境界です。
 * query は一覧状態の復元に使いますが、path は必ず本番一覧に閉じます。
 */
const API_CATALOG_LIST_URL = '/api-catalog';

type ApiCatalogDetailItem = {
    id: number;
    apiKey: string;
    title: string;
    description: string;
    providerKey: string;
    serviceKey: string | null;
    preferredVersion: string | null;
    openapiVersion: string | null;
    openapiJsonUrl: string | null;
    openapiYamlUrl: string | null;
    sourceLatestUpdatedAt: string | null;
    isActive: boolean;
    notes: ApiCatalogNoteItem[];
};

type DetailProps = {
    apiCatalogItem: ApiCatalogDetailItem;
    returnUrl: string;
};

function buildTechnicalRows(
    item: ApiCatalogDetailItem,
    domain: string,
): ApiCatalogDetailTechnicalRow[] {
    /*
     * 詳細画面では同期キャッシュのメタ情報だけを確認できるようにします。
     * OpenAPI 定義本文や paths / schemas の取得は別導線の責務なので、ここでは表示しません。
     */
    return [
        ['apiKey', item.apiKey],
        ['providerKey', item.providerKey],
        ['serviceKey', item.serviceKey],
        ['domain', domain],
        ['preferredVersion', item.preferredVersion],
        ['openapiVersion', item.openapiVersion],
        ['openapiJsonUrl', item.openapiJsonUrl],
        ['openapiYamlUrl', item.openapiYamlUrl],
        ['sourceLatestUpdatedAt', item.sourceLatestUpdatedAt],
    ];
}

function buildNoteStoreUrl(apiKey: string) {
    return `/api-catalog/${encodeURIComponent(apiKey)}/notes`;
}

function buildNoteUrl(apiKey: string, noteId: number) {
    return `${buildNoteStoreUrl(apiKey)}/${noteId}`;
}

function normalizeCatalogListReturnUrl(value: string) {
    /*
     * Controller 側でも同じ制限をしていますが、画面の戻るボタンは最後にここでも絞ります。
     * 本番詳細では履歴や別画面由来のURLではなく、本番一覧だけを戻り先にします。
     * 共通ヘッダーには正規化済みURLだけを渡し、Preview/Mock のURLを混ぜません。
     */
    if (value === API_CATALOG_LIST_URL || value.startsWith(`${API_CATALOG_LIST_URL}?`)) {
        return value;
    }

    return API_CATALOG_LIST_URL;
}

export default function Detail({ apiCatalogItem, returnUrl }: DetailProps) {
    /*
     * 本番DBに domain カラムは追加しません。
     * 詳細表示でも一覧と同じ provider_key 抽出ルールを使い、表示差分を入力データ側で吸収します。
     */
    const domain = extractProviderDomain(apiCatalogItem.providerKey);
    const technicalRows = buildTechnicalRows(apiCatalogItem, domain);
    const catalogReturnUrl = normalizeCatalogListReturnUrl(returnUrl);

    return (
        <PublicLayout className="px-4 py-5 sm:px-6 lg:px-8">
            <Head title={`${apiCatalogItem.title} Detail`} />

            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 pb-5">
                <ApiCatalogDetailHeader
                    modeLabel="Live"
                    returnUrl={catalogReturnUrl}
                    returnAccessibleLabel="API一覧へ戻る"
                    searchTarget={apiCatalogItem}
                />

                <ApiCatalogDetailHero
                    title={apiCatalogItem.title}
                    providerKey={apiCatalogItem.providerKey}
                    serviceKey={apiCatalogItem.serviceKey}
                    domain={domain}
                    preferredVersion={apiCatalogItem.preferredVersion}
                />

                <ApiCatalogDetailBody
                    title={apiCatalogItem.title}
                    description={apiCatalogItem.description}
                    technicalRows={technicalRows}
                    notesPanel={
                        <ApiCatalogNotesPanel
                            notes={apiCatalogItem.notes}
                            isPersistable={true}
                            storeUrl={buildNoteStoreUrl(apiCatalogItem.apiKey)}
                            updateUrl={(note) => buildNoteUrl(apiCatalogItem.apiKey, note.id)}
                            deleteUrl={(note) => buildNoteUrl(apiCatalogItem.apiKey, note.id)}
                        />
                    }
                />
            </div>
        </PublicLayout>
    );
}
