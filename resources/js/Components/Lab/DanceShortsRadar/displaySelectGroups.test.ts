/**
 * DanceShortsRadar の表示条件選択 group utility が loop / disabled option を正しく扱うことを固定します。
 */
import { describe, expect, it } from 'vitest';

import {
    createDanceShortsDisplaySelectGroups,
    isNavigableSelectOption,
    moveSelectGroup,
    selectLoopedOption,
} from './displaySelectGroups';
import type { DanceShortsDisplaySelectField } from './types';

function createDisplaySelectField(): DanceShortsDisplaySelectField {
    return {
        selectedTab: 'ALL',
        comparisonDays: 7,
        sortKey: 'view_count_delta',
        showSortKeyOptions: true,
        regionTabs: [
            {
                code: 'ALL',
                label: 'まとめ',
                description: '全地域',
                href: '/dance-shorts-radar?tab=ALL',
                isActive: true,
            },
            {
                code: 'JP',
                label: '日本',
                description: '日本',
                href: '/dance-shorts-radar?tab=JP',
                isActive: false,
            },
            {
                code: 'US',
                label: 'アメリカ',
                description: 'アメリカ',
                href: '/dance-shorts-radar?tab=US',
                isActive: false,
            },
            {
                code: 'KR',
                label: '韓国',
                description: '韓国',
                href: '/dance-shorts-radar?tab=KR',
                isActive: false,
            },
        ],
        comparisonDayOptions: [1, 3, 7, 14, 30].map((value) => ({
            value,
            label: `${value}日`,
            href: `/dance-shorts-radar?days=${value}`,
            isActive: value === 7,
        })),
        sortKeyOptions: [
            {
                value: 'view_count_delta',
                label: '増加数',
                href: '/dance-shorts-radar?sort=view_count_delta',
                isActive: false,
            },
            {
                value: 'view_growth_rate',
                label: '増加率',
                href: '/dance-shorts-radar?sort=view_growth_rate',
                isActive: true,
            },
            {
                value: 'views_per_hour',
                label: '速度',
                href: '/dance-shorts-radar?sort=views_per_hour',
                isActive: false,
            },
        ],
    };
}

describe('displaySelectGroups', () => {
    it('moves select categories in the region, days, sort order', () => {
        const groups = createDanceShortsDisplaySelectGroups(
            createDisplaySelectField(),
        );

        expect(moveSelectGroup(groups, 'tab', 1)).toBe('comparisonDays');
        expect(moveSelectGroup(groups, 'comparisonDays', 1)).toBe('sort');
        expect(moveSelectGroup(groups, 'sort', 1)).toBe('tab');
        expect(moveSelectGroup(groups, 'tab', -1)).toBe('sort');
    });

    it('keeps comparison day options in the expected 1, 3, 7, 14, 30 order', () => {
        const groups = createDanceShortsDisplaySelectGroups(
            createDisplaySelectField(),
        );
        const days = groups.find((group) => group.key === 'comparisonDays');

        expect(days?.options.map((option) => option.value)).toEqual([
            1, 3, 7, 14, 30,
        ]);
        expect(days?.options.map((option) => option.value)).not.toContain(8);
    });

    it('selects next and previous options from the current group without changing order', () => {
        const groups = createDanceShortsDisplaySelectGroups(
            createDisplaySelectField(),
        );
        const sort = groups.find((group) => group.key === 'sort');

        expect(selectLoopedOption(sort?.options ?? [], 1)?.href).toBe(
            '/dance-shorts-radar?sort=views_per_hour',
        );
        expect(selectLoopedOption(sort?.options ?? [], -1)?.href).toBe(
            '/dance-shorts-radar?sort=view_count_delta',
        );
    });

    it('does not navigate active options or placeholder hrefs', () => {
        expect(
            isNavigableSelectOption({
                value: 'active',
                label: 'active',
                href: '/active',
                isActive: true,
            }),
        ).toBe(false);
        expect(
            isNavigableSelectOption({
                value: 'placeholder',
                label: 'placeholder',
                href: '#',
                isActive: false,
            }),
        ).toBe(false);
    });
});
