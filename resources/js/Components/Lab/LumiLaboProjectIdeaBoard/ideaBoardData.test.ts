import { describe, expect, it } from 'vitest';

import {
    getIdeaBoardTabById,
    ideaBoardTabs,
    projectCreateDisplayCandidates,
    projectCreateInputCandidates,
    projectCreateNotInputItems,
    projectListFutureCards,
    projectRouteFlow,
    requiredTabLabels,
    topEntryCards,
} from './ideaBoardData';

describe('LumiLabo 案件システム IDEA BOARD データ', () => {
    it('必須タブだけを指定順で持ち、初期候補はTOPになる', () => {
        expect(ideaBoardTabs.map((tab) => tab.label)).toEqual(requiredTabLabels);
        expect(ideaBoardTabs[0].id).toBe('top');
        expect(requiredTabLabels).not.toContain('カレンダー');
    });

    it('TOPはTOP画面の入口構想を持つ', () => {
        expect(topEntryCards.map((item) => item.title)).toEqual([
            '案件作成へ進む入口',
            '案件一覧を見る入口',
            '現在位置',
            '後続の余白',
        ]);
        expect(getIdeaBoardTabById('top').lead).toContain('TOP画面');
    });

    it('案件システムの導線をLumiLabo配下から後続まで保持する', () => {
        expect(projectRouteFlow).toEqual([
            'LumiLabo Hub',
            '案件システムTOP',
            '案件作成',
            '案件一覧',
            '案件詳細',
            '工程デッキ / 工程カード',
        ]);
    });

    it('案件作成の入力候補と表示候補を勝手に増やさない', () => {
        expect(projectCreateInputCandidates.map((item) => item.title)).toEqual([
            '会社名',
            '担当者名',
            '住所',
            'メモ',
        ]);
        expect(projectCreateInputCandidates.map((item) => item.title)).not.toContain('案件名');
        expect(projectCreateDisplayCandidates.map((item) => item.title)).toEqual([
            '登録日表示',
            'ステータス表示',
        ]);
        expect(projectCreateDisplayCandidates[0].body).toContain('created_at');
        expect(projectCreateDisplayCandidates[1].body).toContain('進行中');
    });

    it('案件作成で入力させないものを明示する', () => {
        expect(projectCreateNotInputItems).toContain('登録日');
        expect(projectCreateNotInputItems).toContain('案件名');
        expect(projectCreateNotInputItems).toContain('郵便番号 / 都道府県 / 市区町村などへ分割した住所');
        expect(projectCreateNotInputItems).toContain('工程カード情報');
        expect(projectCreateNotInputItems).toContain('カレンダー情報');
        expect(projectCreateNotInputItems).toContain('完了判定に関わる情報');
    });

    it('案件一覧は作成後の確認先と詳細入口の構想に留める', () => {
        expect(projectListFutureCards.map((item) => item.title)).toEqual([
            '会社名',
            '担当者名',
            'ステータス',
            '登録日',
        ]);
        expect(getIdeaBoardTabById('projectList').lead).toContain('作成した案件をどう確認するか');
        expect(getIdeaBoardTabById('projectList').lead).toContain('固定データMOCK');
    });

    it('Codingタブでタブ構造と将来PRODUCT化の責務境界を確認できる', () => {
        const codingSections = getIdeaBoardTabById('coding').sections.map((section) => section.title);

        expect(codingSections).toContain('タブ切り替えの構造');
        expect(codingSections).toContain('表示データの持ち方');
        expect(codingSections).toContain('将来PRODUCT化する場合の責務');
        expect(codingSections).toContain('Reactへ置かない判断');
    });
});
