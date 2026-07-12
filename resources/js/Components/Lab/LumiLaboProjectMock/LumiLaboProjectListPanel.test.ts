import { describe, expect, it } from "vitest";

import {
    calculateLumiLaboProjectListPerPage,
    createLumiLaboProjectListRequestCallbacks,
    createLumiLaboProjectListRequestData,
    getNextLumiLaboProjectListRefreshRevision,
    shouldReloadLumiLaboProjectList,
    LUMILABO_PROJECT_LIST_MAX_PER_PAGE,
    LUMILABO_PROJECT_LIST_PARTIAL_PROPS,
} from "./LumiLaboProjectListPanel";

describe("LumiLaboProjectListPanel measurement and partial reload contract", () => {
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

    it("keeps a newer refresh revision pending until the active revision succeeds", () => {
        expect(
            getNextLumiLaboProjectListRefreshRevision(1, 0, null, null),
        ).toBe(1);
        expect(
            getNextLumiLaboProjectListRefreshRevision(2, 0, 1, null),
        ).toBeNull();
        expect(
            getNextLumiLaboProjectListRefreshRevision(2, 1, null, null),
        ).toBe(2);
    });

    it("does not complete a pending refresh from an older successful revision", () => {
        expect(
            getNextLumiLaboProjectListRefreshRevision(2, 1, null, null),
        ).toBe(2);
        expect(
            getNextLumiLaboProjectListRefreshRevision(2, 1, null, 1),
        ).toBeNull();
        expect(
            getNextLumiLaboProjectListRefreshRevision(2, 2, null, null),
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
