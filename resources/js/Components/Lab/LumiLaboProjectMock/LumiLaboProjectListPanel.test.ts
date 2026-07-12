import { describe, expect, it } from "vitest";

import {
    calculateLumiLaboProjectListPerPage,
    createLumiLaboProjectListRequestData,
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
            ),
        ).toEqual({
            keyword: undefined,
            sort: "registered_desc",
            page: 2,
            per_page: 7,
            deleted_ids: ["mock-project-001", "mock-project-004"],
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
});
