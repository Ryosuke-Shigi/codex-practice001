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

/**
 * displaySelectField propsをカード画面の操作groupへ変換します。
 *
 * Responderが決めたhref / active状態をそのまま使い、React側でランキング条件やsort可否を再判定しません。
 */
export function createDanceShortsDisplaySelectGroups(
    displaySelectField: DanceShortsDisplaySelectField,
): DanceShortsDisplaySelectGroup[] {
    /*
     * Responder が作った displaySelectField を、横並び/縦swipe操作で扱いやすいUI groupへ変換します。
     * RISING タブでは sort options を表示しない契約も、ここでは受け取った showSortKeyOptions に従うだけです。
     */
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

/**
 * 現在選択中のselect group indexを返します。
 *
 * active keyが見つからない場合は先頭に戻し、Component側で範囲外indexを扱わなくて済むようにします。
 */
export function activeSelectGroupIndex(
    groups: DanceShortsDisplaySelectGroup[],
    activeGroup: DanceShortsDisplaySelectGroupKey,
) {
    const index = groups.findIndex((group) => group.key === activeGroup);

    return index === -1 ? 0 : index;
}

/**
 * select groupを左右移動するときの次のkeyを返します。
 *
 * group配列を循環させるだけで、実際のURL遷移やoption選択は呼び出し元Componentへ残します。
 */
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

/**
 * クリック・swipeで遷移してよいselect optionかを判定します。
 *
 * hrefなし、または現在activeなoptionは遷移対象外にして、Componentで同じ条件を重複させません。
 */
export function isNavigableSelectOption(
    option: DanceShortsDisplaySelectOption,
) {
    return option.href !== '#' && !option.isActive;
}

/**
 * 現在activeなoptionを基準に、循環する次候補を返します。
 *
 * 空配列では null を返し、呼び出し側がURL遷移を発火しないようにします。
 */
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
