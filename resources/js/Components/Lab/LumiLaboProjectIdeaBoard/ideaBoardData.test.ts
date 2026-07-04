import { describe, expect, it } from 'vitest';

import {
    getIdeaBoardTabById,
    ideaBoardTabs,
    projectCreateDisplayCandidates,
    projectCreateInputCandidates,
    projectCreateNotInputItems,
    projectListFutureCards,
    requiredTabLabels,
} from './ideaBoardData';

function collectTabText(tabId: Parameters<typeof getIdeaBoardTabById>[0]): string {
    const tab = getIdeaBoardTabById(tabId);

    return [
        tab.label,
        tab.kicker,
        tab.title,
        tab.lead,
        ...tab.sections.flatMap((section) => [
            section.title,
            section.lead,
            section.note ?? '',
            ...(section.items ?? []),
            ...(section.cards?.flatMap((card) => [
                card.title,
                card.badge ?? '',
                card.body,
            ]) ?? []),
        ]),
    ].join('\n');
}

describe('LumiLabo 案件作成 IDEA BOARD データ', () => {
    it('上位タブを概要 / TOP / 案件 / Codingに戻し、案件作成と案件一覧を上位タブにしない', () => {
        expect(ideaBoardTabs.map((tab) => tab.label)).toEqual(requiredTabLabels);
        expect(requiredTabLabels).toEqual(['概要', 'TOP', '案件', 'Coding']);
        expect(ideaBoardTabs[0].id).toBe('overview');
        expect(requiredTabLabels).not.toContain('案件作成');
        expect(requiredTabLabels).not.toContain('案件一覧');
        expect(requiredTabLabels).not.toContain('カレンダー');
    });

    it('概要は案件作成MOCKへ進む前の整理であることを示す', () => {
        const overviewText = collectTabText('overview');

        expect(overviewText).toContain('案件作成MOCKへ進む前');
        expect(overviewText).toContain('LumiLaboは上位プロダクト');
        expect(overviewText).toContain('案件システム');
        expect(overviewText).toContain('MOCK、PRODUCT、保存可能フォーム、DB、Backend、API通信、カレンダーへ進まない');
        expect(overviewText).toContain('各カードが日付を持った後に検討する');
    });

    it('TOPは親導線を最低限に留め、案件作成入口を主にする', () => {
        const topText = collectTabText('top');

        expect(topText).toContain('LumiLabo Hubから案件システムへ入る');
        expect(topText).toContain('案件作成へ進む入口');
        expect(topText).toContain('完成画面MOCKにはしない');
        expect(topText).toContain('案件一覧、案件詳細、工程は後続');
        expect(topText).not.toContain('導線 1');
        expect(topText).not.toContain('導線 2');
    });

    it('案件タブは登録 / 一覧 / 詳細セクションを持ち、基本導線を持たない', () => {
        const projectSections = getIdeaBoardTabById('project').sections.map(
            (section) => section.title,
        );
        const projectText = collectTabText('project');

        expect(projectSections).toContain('登録');
        expect(projectSections).toContain('一覧');
        expect(projectSections).toContain('詳細');
        expect(projectSections).not.toContain('基本導線');
        expect(projectText).toContain('今回の主対象');
        expect(projectText).not.toContain('導線 1');
        expect(projectText).not.toContain('導線 2');
        expect(projectText).not.toContain('projectRouteFlow');
    });

    it('登録セクションは入力対象と表示対象を固定範囲で整理する', () => {
        expect(projectCreateInputCandidates.map((item) => item.title)).toEqual([
            '会社名',
            '担当者名',
            '住所',
            'メモ',
        ]);
        expect(projectCreateInputCandidates.map((item) => item.title)).not.toContain('案件名');
        expect(projectCreateDisplayCandidates.map((item) => item.title)).toEqual([
            '登録日表示',
            'ステータス初期表示',
        ]);
        expect(projectCreateDisplayCandidates[0].body).toContain('created_at');
        expect(projectCreateDisplayCandidates[0].body).toContain('入力欄にしない');
        expect(projectCreateDisplayCandidates[1].body).toContain('進行中');
        expect(projectCreateDisplayCandidates[1].body).toContain('ステータス変更UIも作らない');
    });

    it('登録セクションへ混ぜないものを明示する', () => {
        expect(projectCreateNotInputItems).toContain('登録日');
        expect(projectCreateNotInputItems).toContain('案件名');
        expect(projectCreateNotInputItems).toContain('郵便番号 / 都道府県 / 市区町村などへ分割した住所');
        expect(projectCreateNotInputItems).toContain('ステータス変更UI');
        expect(projectCreateNotInputItems).toContain('保存処理');
        expect(projectCreateNotInputItems).toContain('工程カード情報');
        expect(projectCreateNotInputItems).toContain('カレンダー情報');
        expect(projectCreateNotInputItems).toContain('完了判定に関わる情報');
    });

    it('一覧セクションは後続概念だけで、固定データ付き一覧MOCKにしない', () => {
        expect(projectListFutureCards.map((item) => item.title)).toEqual([
            '会社名',
            '担当者名',
            'ステータス',
            '登録日',
            '住所の短い表示候補',
            'メモの有無 / 短いメモ表示候補',
        ]);

        const projectText = collectTabText('project');

        expect(projectText).toContain('一覧は後続セクション');
        expect(projectText).toContain('固定データMOCKも作りません');
        expect(projectText).toContain('1案件 = 1カード');
        expect(projectText).toContain('詳細へ進む操作はアイコンだけにしない');
    });

    it('詳細セクションは後続として見せるだけで、工程や判定を作り込まない', () => {
        const projectText = collectTabText('project');

        expect(projectText).toContain('詳細は後続セクション');
        expect(projectText).toContain('案件詳細画面や工程デッキ / 工程カードは作りません');
        expect(projectText).toContain('工程カードの状態変更、完了判定、スルー判定は今回扱わない');
    });

    it('CodingタブでIDEA BOARD段階の責務境界を確認できる', () => {
        const codingText = collectTabText('coding');

        expect(codingText).toContain('Page / Component / data');
        expect(codingText).toContain('型付き静的データ');
        expect(codingText).toContain('DB、Backend、API通信、保存処理、完了判定を持たせない');
        expect(codingText).toContain('Controller');
        expect(codingText).toContain('Request');
        expect(codingText).toContain('Action');
        expect(codingText).toContain('Service');
        expect(codingText).toContain('Repository');
        expect(codingText).toContain('DTO');
        expect(codingText).toContain('Presenter / Responder');
    });
});