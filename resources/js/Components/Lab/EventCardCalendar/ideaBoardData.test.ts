import { describe, expect, it } from 'vitest';

import { eventCardCalendarIdeaTabs } from './ideaBoardData';

function collectBoardText(): string {
    return eventCardCalendarIdeaTabs
        .flatMap((tab) =>
            tab.topics.flatMap((topic) => [
                topic.label,
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
            'イベント',
            'カード',
            'フロー',
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
            イベント: 'none',
            カード: 'none',
            フロー: 'none',
            カレンダー: 'none',
            可視化: 'visualization-preview',
        });
    });

    it('keeps event and card responsibilities separate', () => {
        const allText = collectBoardText();

        expect(allText).toContain('画面表示上は基本的に「イベント」と呼びます。');
        expect(allText).toContain('EventDeck / イベントデッキは、コード上で「カードを生む元」として扱う概念です。');
        expect(allText).toContain('カードは、入金カード、出金カード、請求カードに分けます。');
        expect(allText).toContain('イベントはお金そのものではなく');
        expect(allText).toContain('EventDeckはお金そのものではありません。');
        expect(allText).not.toContain('Eventカードは');
        expect(allText).not.toContain('イベントカード');
    });

    it('keeps the three event types and card types explicit', () => {
        const allText = collectBoardText();

        expect(allText).toContain('収入イベント');
        expect(allText).toContain('支出イベント');
        expect(allText).toContain('請求イベント');
        expect(allText).toContain('入金カードは、入金予定日、入金日、入金元、金額、状態を持つ候補です。');
        expect(allText).toContain('出金カードは、支払予定日、支払日、支払先、金額、状態を持つ候補です。');
        expect(allText).toContain('請求カードは、請求日、請求期限日、請求先、請求金額、状態を持つ候補です。');
    });

    it('keeps EventDeck out of the same category as real data cards', () => {
        const allText = collectBoardText();

        expect(allText).toContain('EventDeckとは同列に置きません。');
        expect(allText).toContain('入金カード・出金カード・請求カードと同列のカード種別には置きません。');
        expect(allText).toContain('カード生成の元になるが、カードそのものではない');
    });

    it('keeps link-table relationships instead of a fixed parent FK', () => {
        const allText = collectBoardText();

        expect(allText).toContain('link table候補は event_card_links または calendar_card_links です。');
        expect(allText).toContain('関連付けは、カード側へ直接 event_id を持たせる前提にしません。');
        expect(allText).toContain('1つのイベントに複数カード');
        expect(allText).toContain('1つのカードに複数イベント');
        expect(allText).toContain('多対多の余地を残す');
    });

    it('keeps card-first calendar and visualization responsibilities', () => {
        const allText = collectBoardText();

        expect(allText).toContain('カレンダーに表示する主役はカードです。');
        expect(allText).toContain('カレンダー表示はカードの日付軸を使います。');
        expect(allText).toContain('グラフ・集計の主役はカードです。');
        expect(allText).toContain('イベント別収支は、関連付いたカードを絞り込んで集計します。');
        expect(allText).toContain('イベントを金額データとして直接集計しません。');
    });

    it('keeps direct card creation and non-implemented boundaries visible', () => {
        const allText = collectBoardText();

        expect(allText).toContain('イベントなしでカードを直接作るルートも残す');
        expect(allText).toContain('EventDeckがないとカードを作れない、という説明にはしません。');
        expect(allText).toContain('DnDは今回実装せず');
        expect(allText).toContain('今回はDB保存やMigrationを作らず');
        expect(allText).toContain('実データ集計やグラフライブラリ追加は今回行いません。');
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
