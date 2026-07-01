import { describe, expect, it } from 'vitest';

import {
    codingModeIds,
    codingSections,
    type CodingSectionMode,
} from './codingIdeaBoardData';
import { eventCardCalendarIdeaTabs } from './ideaBoardData';

function collectCodingModeText(mode: CodingSectionMode): string[] {
    return [
        mode.title,
        mode.lead,
        ...mode.points,
        ...(mode.rows?.flatMap((row) => [
            row.label,
            row.value,
            row.detail ?? '',
        ]) ?? []),
        ...(mode.elements?.flatMap((element) => [
            element.name,
            element.detail,
        ]) ?? []),
        ...(mode.workflows?.flatMap((workflow) => [
            workflow.title,
            workflow.chart,
            ...workflow.notes,
        ]) ?? []),
        ...(mode.examples?.flatMap((example) => [
            example.label,
            example.title,
            example.meta,
            example.amount ?? '',
        ]) ?? []),
        ...(mode.calendarDays?.flatMap((day) => [
            day.date,
            day.overflowLabel ?? '',
            ...day.cards.flatMap((card) => [
                card.type,
                card.title,
                card.amount,
                card.role,
                card.tone,
            ]),
        ]) ?? []),
        ...(mode.codeLines ?? []),
        ...(mode.callout ? [mode.callout.label, mode.callout.detail] : []),
    ];
}

function collectCodingBoardText(): string {
    return codingSections
        .flatMap((section) => [
            section.label,
            section.title,
            section.summary,
            ...codingModeIds.flatMap((modeId) =>
                collectCodingModeText(section.modes[modeId]),
            ),
        ])
        .join('\n');
}

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
            collectCodingBoardText(),
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
            'coding',
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
            coding: 'none',
            フロー: 'none',
            カレンダー: 'none',
            可視化: 'visualization-preview',
        });
    });

    it('keeps coding sections and display modes explicit', () => {
        const codingTab = eventCardCalendarIdeaTabs.find(
            (tab) => tab.id === 'coding',
        );

        expect(codingTab?.topics.map((topic) => topic.label)).toEqual([
            'コア',
            '入金',
            '出金',
            '請求',
            'カレンダー',
        ]);
        expect(codingSections.map((section) => section.label)).toEqual([
            'コア',
            '入金',
            '出金',
            '請求',
            'カレンダー',
        ]);
        expect(
            codingSections.every((section) =>
                codingModeIds.every((modeId) => section.modes[modeId]),
            ),
        ).toBe(true);
    });

    it('documents CoreCard amount, key, and projection boundaries', () => {
        const allText = collectBoardText();

        expect(allText).toContain('CoreCardはDBモデル本体ではなく');
        expect(allText).toContain('amount: string');
        expect(allText).toContain('DB保存はdecimal、DTO / TypeScript / CoreCardではstring。');
        expect(allText).toContain('float / double / JavaScript numberで金額計算しない。');
        expect(allText).toContain('Detail → CoreCard');
        expect(allText).toContain('CoreCardに日本語ラベルを直持ちしません。');
        expect(allText).toContain('dateRoleKey');
        expect(allText).toContain('stateKey');
        expect(allText).toContain('stateTone');
        expect(allText).not.toContain('amount: number');
    });

    it('documents each DetailCard conversion and the calendar example', () => {
        const allText = collectBoardText();

        expect(allText).toContain('IncomeCardDetail');
        expect(allText).toContain('ExpenseCardDetail');
        expect(allText).toContain('BillingCardDetail');
        expect(allText).toContain('cardId = incomeId');
        expect(allText).toContain('cardId = expenseId');
        expect(allText).toContain('cardId = billingId');
        expect(allText).toContain('請求カードと入金カードを混ぜません。');
        expect(allText).toContain('2026年7月5日');
        expect(allText).toContain('請求期限');
        expect(allText).toContain('支払予定');
        expect(allText).toContain('2026年7月10日');
        expect(allText).toContain('2026年7月25日');
        expect(allText).toContain('+2件');
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
