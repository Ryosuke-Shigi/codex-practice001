import type {
    DanceShortsDisplaySelectField,
    DanceShortsSelectOption,
} from './types';

export type DanceShortsDisplaySelectGroupKey =
    | 'tab'
    | 'comparisonDays'
    | 'sort';
export type DanceShortsDisplaySelectOption = DanceShortsSelectOption<
    string | number
>;

export type DanceShortsDisplaySelectGroup = {
    key: DanceShortsDisplaySelectGroupKey;
    label: string;
    shortLabel: string;
    options: DanceShortsDisplaySelectOption[];
};

function displayTypeOptions(
    displaySelectField: DanceShortsDisplaySelectField,
): DanceShortsDisplaySelectOption[] {
    return displaySelectField.regionTabs.map((tab) => ({
        value: tab.code,
        label: tab.label,
        href: tab.href,
        isActive: tab.isActive,
    }));
}

export function createDanceShortsDisplaySelectGroups(
    displaySelectField: DanceShortsDisplaySelectField,
): DanceShortsDisplaySelectGroup[] {
    const selectableGroups: DanceShortsDisplaySelectGroup[] = [
        {
            key: 'tab',
            label: '地域',
            shortLabel: '地域',
            options: displayTypeOptions(displaySelectField),
        },
        {
            key: 'comparisonDays',
            label: '日数',
            shortLabel: '日数',
            options: displaySelectField.comparisonDayOptions,
        },
    ];

    if (displaySelectField.showSortKeyOptions) {
        selectableGroups.push({
            key: 'sort',
            label: '並び順',
            shortLabel: '並び',
            options: displaySelectField.sortKeyOptions,
        });
    }

    return selectableGroups;
}

export function activeSelectGroupIndex(
    groups: DanceShortsDisplaySelectGroup[],
    activeGroup: DanceShortsDisplaySelectGroupKey,
) {
    const index = groups.findIndex((group) => group.key === activeGroup);

    return index === -1 ? 0 : index;
}

export function moveSelectGroup(
    groups: DanceShortsDisplaySelectGroup[],
    activeGroup: DanceShortsDisplaySelectGroupKey,
    direction: -1 | 1,
) {
    if (groups.length === 0) {
        return activeGroup;
    }

    const currentIndex = activeSelectGroupIndex(groups, activeGroup);
    const nextIndex =
        (currentIndex + direction + groups.length) % groups.length;

    return groups[nextIndex].key;
}

export function isNavigableSelectOption(
    option: DanceShortsDisplaySelectOption,
) {
    return option.href !== '#' && !option.isActive;
}

export function selectLoopedOption(
    options: DanceShortsDisplaySelectOption[],
    direction: -1 | 1,
) {
    if (options.length === 0) {
        return null;
    }

    const activeIndex = options.findIndex((option) => option.isActive);
    const currentIndex = activeIndex === -1 ? 0 : activeIndex;
    const nextIndex =
        (currentIndex + direction + options.length) % options.length;

    return options[nextIndex];
}
