import { describe, expect, it } from 'vitest';

import {
    apiCatalogSyncStatusMessage,
    buildApiCatalogDetailHref,
    buildApiCatalogQueryParams,
    buildOptimisticPagination,
    isApiCatalogPagination,
    shouldShowSyncResult,
    toApiCatalogListItem,
} from './apiCatalogIndexUtils';
import type { ApiCatalogItem, ApiCatalogPagination, ApiCatalogSyncStatus } from './types';

const basePagination: ApiCatalogPagination = {
    currentPage: 1,
    totalPages: 4,
    totalItems: 22,
    perPage: 6,
    from: 1,
    to: 6,
};

const baseSyncStatus: ApiCatalogSyncStatus = {
    id: 10,
    status: 'running',
    isRunning: true,
    isStale: false,
    result: {
        totalCount: 0,
        insertedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        inactiveCount: 0,
        failedCount: 0,
    },
    errorMessage: null,
    startedAt: null,
    finishedAt: null,
    createdAt: null,
    updatedAt: null,
};

describe('apiCatalogIndexUtils', () => {
    it('検索条件を一覧URL用のqueryへ変換する', () => {
        expect(
            buildApiCatalogQueryParams(' github ', 'github.com', 'com', 'name_desc', 2),
        ).toEqual({
            keyword: 'github',
            provider_key: 'github.com',
            domain: 'com',
            sort: 'name_desc',
            page: 2,
        });
    });

    it('既定の並び順と空の検索条件はqueryから省く', () => {
        expect(buildApiCatalogQueryParams('   ', '', '', 'updated_desc', 1)).toEqual({
            page: 1,
        });
    });

    it('詳細リンクではapi_keyと戻り先URLをエンコードする', () => {
        expect(buildApiCatalogDetailHref('googleapis.com:admin', '/api-catalog?keyword=a b')).toBe(
            '/api-catalog/googleapis.com%3Aadmin?return_url=%2Fapi-catalog%3Fkeyword%3Da%20b',
        );
    });

    it('一覧表示用itemへ詳細リンクとnotesを補う', () => {
        const item: ApiCatalogItem = {
            id: 7,
            apiKey: 'stripe.com',
            title: 'Stripe',
            description: 'Payment',
            providerKey: 'stripe.com',
            serviceKey: null,
            preferredVersion: '2024-01-01',
            openapiVersion: '3.0.0',
            isActive: true,
        };

        expect(toApiCatalogListItem(item, '/api-catalog?page=2')).toMatchObject({
            listKey: 7,
            apiKey: 'stripe.com',
            title: 'Stripe',
            notes: [],
            detailHref: '/api-catalog/stripe.com?return_url=%2Fapi-catalog%3Fpage%3D2',
        });
    });

    it('Inertia部分更新からpaginationだけを安全に受け取る', () => {
        expect(isApiCatalogPagination(basePagination)).toBe(true);
        expect(isApiCatalogPagination({ ...basePagination, from: undefined })).toBe(false);
        expect(isApiCatalogPagination(null)).toBe(false);
    });

    it('ページ移動直後の暫定paginationを範囲内に丸める', () => {
        expect(buildOptimisticPagination(basePagination, 3)).toMatchObject({
            currentPage: 3,
            from: 13,
            to: 18,
        });

        expect(buildOptimisticPagination(basePagination, 99)).toMatchObject({
            currentPage: 4,
            from: 19,
            to: 22,
        });
    });

    it('0件時の暫定paginationは表示範囲を空にする', () => {
        expect(
            buildOptimisticPagination(
                {
                    ...basePagination,
                    totalItems: 0,
                    from: null,
                    to: null,
                },
                2,
            ),
        ).toMatchObject({
            currentPage: 1,
            from: null,
            to: null,
        });
    });

    it('同期状態から画面表示文言を決める', () => {
        expect(apiCatalogSyncStatusMessage(null, true, null)).toBe(
            'APIカタログ同期を開始しています',
        );
        expect(apiCatalogSyncStatusMessage(null, false, '取得に失敗しました')).toBe(
            '取得に失敗しました',
        );
        expect(
            apiCatalogSyncStatusMessage(
                {
                    ...baseSyncStatus,
                    isRunning: false,
                    isStale: true,
                },
                false,
                null,
            ),
        ).toBe('同期状態が一定時間更新されませんでした。Queue worker の状態を確認してください。');
        expect(
            apiCatalogSyncStatusMessage(
                {
                    ...baseSyncStatus,
                    status: 'completed',
                    isRunning: false,
                },
                false,
                null,
            ),
        ).toBe('同期が完了しました');
    });

    it('停止済みの同期状態だけ結果表示対象にする', () => {
        expect(shouldShowSyncResult(baseSyncStatus)).toBe(false);
        expect(shouldShowSyncResult({ ...baseSyncStatus, isRunning: false })).toBe(true);
        expect(shouldShowSyncResult(null)).toBe(false);
    });
});
