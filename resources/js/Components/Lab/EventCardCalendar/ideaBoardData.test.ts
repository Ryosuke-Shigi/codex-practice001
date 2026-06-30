import { describe, expect, it } from 'vitest';

import { eventCardCalendarIdeaTabs } from './ideaBoardData';

function collectBoardText(): string {
    return eventCardCalendarIdeaTabs
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
}

describe('EventCardCalendar IDEA BOARD data', () => {
    it('keeps the required top-level tabs in order', () => {
        expect(eventCardCalendarIdeaTabs.map((tab) => tab.label)).toEqual([
            '概念',
            'フロー',
            'イベント',
            'カード',
            'カレンダー',
            '可視化',
        ]);
    });

    it('maps only visualization to a persistent visual panel', () => {
        expect(
            Object.fromEntries(
                eventCardCalendarIdeaTabs.map((tab) => [
                    tab.label,
                    tab.visualKind,
                ]),
            ),
        ).toEqual({
            概念: 'none',
            フロー: 'none',
            イベント: 'none',
            カード: 'none',
            カレンダー: 'none',
            可視化: 'visualization-preview',
        });
    });

    it('keeps Event as an optional related incident, not the app owner', () => {
        const allText = collectBoardText();

        expect(allText).toContain(
            'Eventカードは、訪問・施工・納品・契約・作業などの事象を表し、各カードに任意で関連付けられる事象カードです。',
        );
        expect(allText).toContain('Eventカードはお金そのものではありません');
        expect(allText).toContain('請求カード、入金カード、出金カードを分けます');
        expect(allText).toContain('Eventなしで請求・入金・出金カードを直接作成できます');
        expect(allText).not.toContain('Eventを起点にするWebアプリ');
        expect(allText).not.toContain('すべてはEventから始まる');
    });

    it('keeps Event-card links through an intermediate table instead of a fixed parent FK', () => {
        const allText = collectBoardText();

        expect(allText).toContain('中間テーブルで関連付ける構想');
        expect(allText).toContain('各カードへ直接 event_id を持たせない');
        expect(allText).toContain('event_card_links');
        expect(allText).toContain('calendar_card_links');
        expect(allText).toContain('1つのEventに複数カード');
        expect(allText).toContain('1つのカードに複数Event');
        expect(allText).toContain(
            'Eventは固定親ではなく背景・根拠・出来事として扱う',
        );
    });

    it('keeps calendar and visualization responsibilities separate from cards', () => {
        const allText = collectBoardText();

        expect(allText).toContain('カレンダーはカードを日付軸で見る場所です');
        expect(allText).toContain('可視化はカード本体の責務ではなく集計表示側の責務です');
        expect(allText).toContain('入金カードに施工日や実施日を直接持たせません');
    });

    it('keeps the four flow topics available', () => {
        const flowTab = eventCardCalendarIdeaTabs.find(
            (tab) => tab.label === 'フロー',
        );

        expect(flowTab?.topics.map((topic) => topic.label)).toEqual([
            '直接作成',
            'Event関連付け',
            'Event起点作成',
            '表示・分析',
        ]);
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
