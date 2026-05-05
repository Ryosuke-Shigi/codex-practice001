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

export default function Detail({ apiCatalogItem, returnUrl }: DetailProps) {
    /*
     * 本番DBに domain カラムは追加しません。
     * 詳細表示でも一覧と同じ provider_key 抽出ルールを使い、表示差分を入力データ側で吸収します。
     */
    const domain = extractProviderDomain(apiCatalogItem.providerKey);
    const technicalRows = buildTechnicalRows(apiCatalogItem, domain);

    return (
        <PublicLayout className="px-4 py-5 sm:px-6 lg:px-8">
            <Head title={`${apiCatalogItem.title} Detail`} />

            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 pb-5">
                <ApiCatalogDetailHeader
                    modeLabel="Live"
                    returnUrl={returnUrl}
                    returnComment="returnUrl は Controller 側で本番一覧 URL に限定済みです。"
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
