import { describe, expect, it } from 'vitest';

import { eventCardCalendarIdeaTabs } from './ideaBoardData';

describe('EventCardCalendar IDEA BOARD data', () => {
    it('keeps the required top-level tabs in order', () => {
        expect(eventCardCalendarIdeaTabs.map((tab) => tab.label)).toEqual([
            '概念',
            'イベント',
            'カード',
            'カレンダー',
            '可視化',
        ]);
    });

    it('maps each tab to the expected visual panel kind', () => {
        expect(
            Object.fromEntries(
                eventCardCalendarIdeaTabs.map((tab) => [
                    tab.label,
                    tab.visualKind,
                ]),
            ),
        ).toEqual({
            概念: 'concept-flow',
            イベント: 'none',
            カード: 'none',
            カレンダー: 'none',
            可視化: 'visualization-preview',
        });
    });

    it('keeps Event cards separate from finance cards', () => {
        const allText = eventCardCalendarIdeaTabs
            .flatMap((tab) =>
                tab.topics.flatMap((topic) => [
                    topic.title,
                    topic.lead,
                    ...topic.points,
                    ...(topic.blocks?.flatMap((block) => [
                        block.title,
                        ...block.items,
                    ]) ?? []),
                ]),
            )
            .concat(
                eventCardCalendarIdeaTabs.map((tab) => tab.summary),
                eventCardCalendarIdeaTabs.flatMap((tab) =>
                    tab.topics.flatMap((topic) =>
                        topic.callout
                            ? [topic.callout.label, topic.callout.detail]
                            : [],
                    ),
                ),
            )
            .join('\n');

        expect(allText).toContain('Eventカードはお金そのものではありません');
        expect(allText).toContain('請求カード、入金カード、出金カードを分けます');
        expect(allText).toContain('Eventなしで収支カードとして単独作成できます');
        expect(allText).toContain('可視化はカード本体の責務ではなく');
        expect(allText).toContain('カードはEvent起因だけではありません');
    });

    it('keeps summary and callout content available for the board UI', () => {
        expect(
            eventCardCalendarIdeaTabs.every((tab) => tab.summary.length > 0),
        ).toBe(true);
        expect(
            eventCardCalendarIdeaTabs.some((tab) =>
                tab.topics.some((topic) => topic.callout),
            ),
        ).toBe(true);
    });
});
