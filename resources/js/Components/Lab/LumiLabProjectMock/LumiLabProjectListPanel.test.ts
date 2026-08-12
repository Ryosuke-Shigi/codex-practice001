import { describe, expect, it } from 'vitest';

import {
    filterAndSortLumiLabProjects,
    paginateLumiLabProjects,
} from './LumiLabProjectListPanel';
import type { LumiLabMockProjectListItem } from './types';

const items = [
    {
        id: 'one',
        companyName: '会社A',
        contactName: '田中',
        address: '大阪',
        memo: '初回',
        registeredDate: '2026/07/12',
    },
    {
        id: 'two',
        companyName: '会社B',
        contactName: '佐藤',
        address: '岸和田',
        memo: '確認',
        registeredDate: '2026/07/12',
    },
    {
        id: 'three',
        companyName: '会社C',
        contactName: '山田',
        address: '大阪',
        memo: '初回',
        registeredDate: '2026/07/01',
    },
] satisfies readonly LumiLabMockProjectListItem[];

function projectIds(projects: readonly LumiLabMockProjectListItem[]) {
    return projects.map((project) => project.id);
}

describe('LumiLabProjectListPanel client list', () => {
    it.each([
        ['会社A', 'one'],
        ['佐藤', 'two'],
        ['岸和田', 'two'],
        ['確認', 'two'],
    ])('searches the four fields with %s', (keyword, expectedId) => {
        const projects = filterAndSortLumiLabProjects(
            items,
            {},
            [],
            keyword,
            'registered_desc',
        );

        expect(projectIds(projects)).toEqual([expectedId]);
    });

    it('uses AND matching for terms split by half-width or full-width spaces', () => {
        const search = (keyword: string) =>
            projectIds(
                filterAndSortLumiLabProjects(
                    items,
                    {},
                    [],
                    keyword,
                    'registered_desc',
                ),
            );

        expect(search('大阪 初回')).toEqual(['one', 'three']);
        expect(search('大阪　初回')).toEqual(['one', 'three']);
    });

    it('sorts by date in both directions and keeps definition order for equal dates', () => {
        const sort = (direction: 'registered_desc' | 'registered_asc') =>
            projectIds(
                filterAndSortLumiLabProjects(
                    items,
                    {},
                    [],
                    '',
                    direction,
                ),
            );

        expect(sort('registered_desc')).toEqual(['one', 'two', 'three']);
        expect(sort('registered_asc')).toEqual(['three', 'one', 'two']);
    });

    it('applies saved overrides before searching and excludes deleted projects', () => {
        const projects = filterAndSortLumiLabProjects(
            items,
            {
                two: {
                    companyName: '保存後会社',
                    contactName: '新担当者',
                    address: '新住所',
                    memo: '新メモ',
                },
            },
            ['one'],
            '保存後会社 新担当者',
            'registered_asc',
        );

        expect(projectIds(projects)).toEqual(['two']);
        expect(projects[0]?.companyName).toBe('保存後会社');
    });

    it('moves between client pages and clamps an out-of-range page', () => {
        const firstPage = paginateLumiLabProjects(items, 1, 2);
        const nextPage = paginateLumiLabProjects(items, 2, 2);
        const clampedPage = paginateLumiLabProjects(items.slice(0, 2), 2, 2);

        expect(projectIds(firstPage.items)).toEqual(['one', 'two']);
        expect(firstPage).toMatchObject({ currentPage: 1, totalPages: 2 });
        expect(projectIds(nextPage.items)).toEqual(['three']);
        expect(nextPage).toMatchObject({ currentPage: 2, totalPages: 2 });
        expect(projectIds(clampedPage.items)).toEqual(['one', 'two']);
        expect(clampedPage).toMatchObject({ currentPage: 1, totalPages: 1 });
    });

    it('returns an empty first page after every project is deleted', () => {
        const remaining = filterAndSortLumiLabProjects(
            items,
            {},
            items.map((project) => project.id),
            '',
            'registered_desc',
        );

        expect(paginateLumiLabProjects(remaining, 4, 2)).toEqual({
            currentPage: 1,
            totalPages: 1,
            items: [],
        });
    });
});
