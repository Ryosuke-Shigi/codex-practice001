import { describe, expect, it } from 'vitest';

import {
    getIdeaBoardTabById,
    ideaBoardTabs,
    projectCreateDisplayCandidates,
    projectCreateInputCandidates,
    projectCreateNotInputItems,
    projectListFutureCards,
    projectRouteFlow,
    readMarkdownFiles,
    requiredTabLabels,
} from './ideaBoardData';

describe('LumiLabo 案件システム IDEA BOARD データ', () => {
    it('必須タブだけを指定順で持ち、初期候補はTOPになる', () => {
        expect(ideaBoardTabs.map((tab) => tab.label)).toEqual(requiredTabLabels);
        expect(ideaBoardTabs[0].id).toBe('top');
        expect(requiredTabLabels).not.toContain('カレンダー');
    });

    it('案件システムの導線をLumiLabo配下から後続まで保持する', () => {
        expect(projectRouteFlow).toEqual([
            'LumiLabo Hub',
            '案件システム',
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

    it('案件一覧は後続の概念整理だけに留める', () => {
        expect(projectListFutureCards.map((item) => item.title)).toEqual([
            '会社名',
            '担当者名',
            'ステータス',
            '登録日',
        ]);
        expect(getIdeaBoardTabById('projectList').lead).toContain('後続の確認先');
    });

    it('Codingタブで読んだMDと責務境界を確認できる', () => {
        expect(readMarkdownFiles).toContain('AGENTS.md');
        expect(readMarkdownFiles).toContain('docs/index.md');
        expect(readMarkdownFiles).toContain('docs/lumilabo/ui-design-guideline.md');
        expect(getIdeaBoardTabById('coding').sections.map((section) => section.title)).toContain('責務境界');
    });
});
