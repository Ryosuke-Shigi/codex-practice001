import { describe, expect, it } from 'vitest';

import {
    getIdeaBoardTabById,
    ideaBoardTabs,
    projectCreateDisplayCandidates,
    projectCreateInputCandidates,
    projectCreateNotInputItems,
    projectListFutureCards,
    projectStatusConceptItems,
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

describe('LumiLabo 案件システム IDEA BOARD データ', () => {
    it('上位5タブをTOP / 案件 / 案件作成 / 案件一覧 / Codingで維持する', () => {
        expect(ideaBoardTabs.map((tab) => tab.label)).toEqual(requiredTabLabels);
        expect(requiredTabLabels).toEqual([
            'TOP',
            '案件',
            '案件作成',
            '案件一覧',
            'Coding',
        ]);
        expect(ideaBoardTabs[0].id).toBe('top');
        expect(requiredTabLabels).toContain('案件作成');
        expect(requiredTabLabels).toContain('案件一覧');
        expect(requiredTabLabels).not.toContain('概要');
        expect(requiredTabLabels).not.toContain('カレンダー');
    });

    it('TOPは案件システムへ入った直後の入口と現在位置を示す', () => {
        const topText = collectTabText('top');

        expect(topText).toContain('LumiLabo Hubから案件システムへ入った最初の画面');
        expect(topText).toContain('案件作成へ進む入口');
        expect(topText).toContain('案件一覧を見る入口');
        expect(topText).toContain('現在位置');
        expect(topText).toContain('TOPで作り込まないもの');
        expect(topText).toContain('カレンダータブ、カレンダーMOCK、日付別カードカレンダーは作らない');
    });

    it('案件タブは旧ルート説明ではなく案件システム概要を持つ', () => {
        const projectSections = getIdeaBoardTabById('project').sections.map(
            (section) => section.title,
        );
        const projectText = collectTabText('project');

        expect(projectSections).toContain('案件とは何か');
        expect(projectSections).toContain('案件システムで扱うこと');
        expect(projectSections).toContain('1案件として扱う初期情報');
        expect(projectSections).toContain('案件ステータス');
        expect(projectSections).toContain('後続工程の起点');
        expect(projectSections).not.toContain(['基', '本', '導', '線'].join(''));
        expect(projectText).toContain('何を1案件として扱うか');
        expect(projectText).toContain('LumiLaboは上位プロダクト');
        expect(projectText).toContain('案件システムは最初のサブシステム');
        expect(projectText).toContain('案件詳細は、案件基本情報と工程への入口');
        expect(projectText).not.toContain(['導線', ' 1'].join(''));
        expect(projectText).not.toContain(['導線', ' 2'].join(''));
        expect(projectText).not.toContain(['project', 'Route', 'Flow'].join(''));
    });

    it('案件タブの初期情報とステータス概念を固定する', () => {
        const projectText = collectTabText('project');

        expect(projectText).toContain('会社名');
        expect(projectText).toContain('担当者名');
        expect(projectText).toContain('住所');
        expect(projectText).toContain('メモ');
        expect(projectText).toContain('登録日表示');
        expect(projectText).toContain('ステータス表示');
        expect(projectText).toContain('created_at');
        expect(projectText).toContain('案件名は初期項目へ勝手に追加しない');
        expect(projectText).toContain('郵便番号、都道府県、市区町村へ勝手に分割しない');
        expect(projectStatusConceptItems).toEqual([
            '初期作成時は「進行中」候補として扱う。',
            '完了は、必要な工程を通り切った状態として扱う。',
            '終了は、キャンセル、失注、対象外など途中で閉じる状態として扱う。',
            '今回はステータス変更UIや完了判定を作らない。',
        ]);
    });

    it('案件作成タブは入力対象と表示対象を分ける', () => {
        const createText = collectTabText('projectCreate');

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
        expect(createText).toContain('入力対象');
        expect(createText).toContain('表示対象');
    });

    it('案件作成タブへ混ぜないものを明示する', () => {
        expect(projectCreateNotInputItems).toContain('登録日入力');
        expect(projectCreateNotInputItems).toContain('案件名');
        expect(projectCreateNotInputItems).toContain('郵便番号 / 都道府県 / 市区町村などへ分割した住所');
        expect(projectCreateNotInputItems).toContain('ステータス変更UI');
        expect(projectCreateNotInputItems).toContain('保存処理');
        expect(projectCreateNotInputItems).toContain('工程カード情報');
        expect(projectCreateNotInputItems).toContain('カレンダー情報');
        expect(projectCreateNotInputItems).toContain('完了判定に関わる情報');
    });

    it('案件一覧タブは1案件カードのモバイルファースト構想を持つ', () => {
        const listText = collectTabText('projectList');

        expect(projectListFutureCards.map((item) => item.title)).toEqual([
            '会社名',
            '担当者名',
            'ステータス',
            '登録日',
            '住所の短い表示候補',
            'メモの有無 / 短いメモ表示候補',
        ]);
        expect(listText).toContain('1案件 = 1カード');
        expect(listText).toContain('モバイルでは横長テーブルではなく、カード型リスト');
        expect(listText).toContain('状態は色だけでなく文字で表示');
        expect(listText).toContain('詳細へ進む操作はアイコンだけにしない');
        expect(listText).toContain('固定データ付き一覧MOCKは作らない');
        expect(listText).toContain('DB取得やAPI通信は作らない');
    });

    it('CodingタブでIDEA BOARD段階と将来PRODUCT化の責務境界を確認できる', () => {
        const codingText = collectTabText('coding');

        expect(codingText).toContain('画面は5タブ');
        expect(codingText).toContain('型付きの静的データ');
        expect(codingText).toContain('保存処理、API通信、DB取得、権限判断は持たせない');
        expect(codingText).toContain('Controller');
        expect(codingText).toContain('Request');
        expect(codingText).toContain('Action');
        expect(codingText).toContain('Service');
        expect(codingText).toContain('Repository');
        expect(codingText).toContain('DTO');
        expect(codingText).toContain('Presenter / Responder');
    });
});
