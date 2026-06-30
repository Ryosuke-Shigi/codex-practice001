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
            .join('\n');

        expect(allText).toContain('Eventカードはお金そのものではありません');
        expect(allText).toContain('請求カード、入金カード、出金カードを分けます');
        expect(allText).toContain('Eventなしで収支カードとして単独作成できます');
        expect(allText).toContain('可視化はカード本体の責務ではなく');
    });
});
