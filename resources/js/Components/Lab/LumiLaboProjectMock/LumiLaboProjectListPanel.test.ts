import { router } from '@inertiajs/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({
    router: {
        get: vi.fn(),
    },
}));

import {
    calculateLumiLaboProjectListPerPage,
    createLumiLaboProjectListRequestCallbacks,
    createLumiLaboProjectListRequestData,
    getNextLumiLaboProjectListRefreshRevision,
    shouldReloadLumiLaboProjectList,
    visitLumiLaboProjectListRefresh,
    LUMILABO_PROJECT_LIST_MAX_PER_PAGE,
    LUMILABO_PROJECT_LIST_PARTIAL_PROPS,
} from "./LumiLaboProjectListPanel";

describe("LumiLaboProjectListPanel measurement and partial reload contract", () => {
    beforeEach(() => {
        vi.mocked(router.get).mockReset();
    });

    it("keeps deleted project IDs in a list reload request", () => {
        expect(
            createLumiLaboProjectListRequestData(
                {
                    keyword: "",
                    sort: "registered_desc",
                    page: 2,
                    perPage: 7,
                },
                ["mock-project-001", "mock-project-004"],
                {
                    "mock-project-002": {
                        companyName: "保存後の会社名",
                        contactName: "保存後の担当者名",
                        address: "保存後の住所",
                        memo: "保存後のメモ",
                    },
                },
            ),
        ).toEqual({
            keyword: undefined,
            sort: "registered_desc",
            page: 2,
            per_page: 7,
            deleted_ids: ["mock-project-001", "mock-project-004"],
            overrides: [
                {
                    id: "mock-project-002",
                    company_name: "保存後の会社名",
                    contact_name: "保存後の担当者名",
                    address: "保存後の住所",
                    memo: "保存後のメモ",
                },
            ],
        });
    });
    it("calculates a whole-row page size from the list region and row height", () => {
        expect(calculateLumiLaboProjectListPerPage(701, 100)).toBe(7);
        expect(calculateLumiLaboProjectListPerPage(99, 100)).toBe(1);
        expect(calculateLumiLaboProjectListPerPage(2100, 100)).toBe(
            LUMILABO_PROJECT_LIST_MAX_PER_PAGE,
        );
    });

    it("waits for measurable list and row dimensions", () => {
        expect(calculateLumiLaboProjectListPerPage(0, 100)).toBeNull();
        expect(calculateLumiLaboProjectListPerPage(701, 0)).toBeNull();
    });

    it("reloads only when the measured page size changes", () => {
        expect(shouldReloadLumiLaboProjectList(null, 3)).toBe(true);
        expect(shouldReloadLumiLaboProjectList(3, 3)).toBe(false);
        expect(shouldReloadLumiLaboProjectList(3, 4)).toBe(true);
    });

    it("reloads only the server-owned project list props", () => {
        expect(LUMILABO_PROJECT_LIST_PARTIAL_PROPS).toEqual(["projectList"]);
    });

    it("treats only a successful refresh as complete and preserves the failed request for retry", () => {
        const requestData = createLumiLaboProjectListRequestData(
            {
                keyword: "岸和田",
                sort: "registered_asc",
                page: 2,
                perPage: 5,
            },
            ["mock-project-001"],
        );
        const completed: string[] = [];
        const failedRequests: unknown[] = [];
        const callbacks = createLumiLaboProjectListRequestCallbacks(
            requestData,
            {
                onSuccess: () => completed.push("success"),
                onFailure: (failedRequest) =>
                    failedRequests.push(failedRequest),
            },
        );

        callbacks.onError();
        callbacks.onCancel();

        expect(completed).toEqual([]);
        expect(failedRequests).toEqual([requestData, requestData]);

        callbacks.onSuccess();

        expect(completed).toEqual(["success"]);
    });

    it('sends a revision refresh with the supplied retry data and only parent lifecycle callbacks', () => {
        const requestData = createLumiLaboProjectListRequestData(
            {
                keyword: '失敗時の検索条件',
                sort: 'registered_asc',
                page: 2,
                perPage: 5,
            },
            ['mock-project-001'],
        );
        const onSuccess = vi.fn();
        const onFailure = vi.fn();

        visitLumiLaboProjectListRefresh(
            '/lab/lumilabo-project-mock',
            requestData,
            { onSuccess, onFailure },
        );

        expect(router.get).toHaveBeenCalledTimes(1);
        expect(router.get).toHaveBeenCalledWith(
            '/lab/lumilabo-project-mock',
            requestData,
            expect.objectContaining({
                only: ['projectList'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }),
        );

        const requestOptions = vi.mocked(router.get).mock.calls[0]?.[2];

        expect(requestOptions).toBeDefined();
        expect(requestOptions).not.toHaveProperty('onStart');
        expect(requestOptions).not.toHaveProperty('onFinish');

        requestOptions?.onSuccess?.(undefined as never);
        requestOptions?.onError?.(undefined as never);
        requestOptions?.onCancel?.();

        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).toHaveBeenNthCalledWith(1, requestData);
        expect(onFailure).toHaveBeenNthCalledWith(2, requestData);
    });

    it("keeps a newer refresh revision pending until the active revision succeeds", () => {
        expect(
            getNextLumiLaboProjectListRefreshRevision(1, 0, null, null, null),
        ).toBe(1);
        expect(
            getNextLumiLaboProjectListRefreshRevision(2, 0, 1, null, null),
        ).toBeNull();
        expect(
            getNextLumiLaboProjectListRefreshRevision(2, 1, null, null, null),
        ).toBe(2);
    });

    it("does not complete a pending refresh from an older successful revision", () => {
        expect(
            getNextLumiLaboProjectListRefreshRevision(2, 1, null, null, null),
        ).toBe(2);
        expect(
            getNextLumiLaboProjectListRefreshRevision(2, 1, null, null, 1),
        ).toBeNull();
        expect(
            getNextLumiLaboProjectListRefreshRevision(2, 2, null, null, null),
        ).toBeNull();
    });

    it("builds a later revision with the latest save and deletion state", () => {
        expect(
            createLumiLaboProjectListRequestData(
                {
                    keyword: "",
                    sort: "registered_desc",
                    page: 1,
                    perPage: 5,
                },
                ["mock-project-004"],
                {
                    "mock-project-002": {
                        companyName: "案件Bの保存後会社名",
                        contactName: "",
                        address: "大阪府堺市",
                        memo: "",
                    },
                },
            ),
        ).toMatchObject({
            deleted_ids: ["mock-project-004"],
            overrides: [
                {
                    id: "mock-project-002",
                    company_name: "案件Bの保存後会社名",
                    contact_name: "",
                    address: "大阪府堺市",
                    memo: "",
                },
            ],
        });
    });
});
