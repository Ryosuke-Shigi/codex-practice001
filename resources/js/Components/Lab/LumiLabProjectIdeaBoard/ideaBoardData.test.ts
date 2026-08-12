import { describe, expect, it } from 'vitest';

import {
    getIdeaBoardTabById,
    ideaBoardTabs,
    initialActiveTagIds,
    projectInitialFieldLabels,
    projectStatusConceptItems,
    processCardStatusItems,
    requiredTabLabels,
    screenCandidateLabels,
    type IdeaBoardBlock,
} from './ideaBoardData';

function collectBlockText(block: IdeaBoardBlock): string[] {
    const base = [block.title, block.lead, block.note ?? ''];

    if (block.type === 'cards') {
        return [
            ...base,
            ...block.cards.flatMap((card) => [card.title, card.badge ?? '', card.body]),
        ];
    }

    if (block.type === 'list') {
        return [...base, ...block.items];
    }

    if (block.type === 'flow') {
        return [
            ...base,
            ...block.steps.flatMap((step) => [
                step.label,
                step.badge ?? '',
                step.description,
                step.state ?? '',
            ]),
        ];
    }

    if (block.type === 'diagram') {
        return [
            ...base,
            ...block.groups.flatMap((group) => [
                group.title,
                group.description,
                ...group.nodes.flatMap((node) => [node.title, node.badge ?? '', node.body]),
            ]),
        ];
    }

    if (block.type === 'graph') {
        return [
            ...base,
            block.caption,
            ...block.bars.flatMap((bar) => [
                bar.label,
                String(bar.value),
                bar.description,
            ]),
        ];
    }

    if (block.type === 'screens') {
        return [
            ...base,
            ...block.screens.flatMap((screen) => [
                screen.title,
                screen.role,
                ...screen.mockFocus,
                screen.boundary,
            ]),
        ];
    }

    return [
        ...base,
        ...block.notes.flatMap((note) => [
            note.title,
            note.description,
            ...note.items,
        ]),
    ];
}

function collectTabText(tabId: Parameters<typeof getIdeaBoardTabById>[0]): string {
    const tab = getIdeaBoardTabById(tabId);

    return [
        tab.label,
        tab.kicker,
        tab.title,
        tab.lead,
        ...tab.tags.flatMap((tag) => [
            tag.label,
            tag.title,
            tag.lead,
            ...tag.blocks.flatMap(collectBlockText),
        ]),
    ].join('\n');
}

describe('LumiLab 案件システム IDEA BOARD データ', () => {
    it('新しいIDEA BOARD仕様の上位7タブと初期タグを持つ', () => {
        expect(ideaBoardTabs.map((tab) => tab.label)).toEqual(requiredTabLabels);
        expect(requiredTabLabels).toEqual([
            '概要',
            'フロー',
            '機能説明',
            '画面候補',
            '図解',
            'グラフ',
            'code',
        ]);
        expect(ideaBoardTabs[0].id).toBe('overview');
        expect(initialActiveTagIds.overview).toBe('positioning');
        expect(initialActiveTagIds.flow).toBe('main-flow');
        expect(requiredTabLabels).not.toContain('Coding');
        expect(requiredTabLabels).not.toContain('カレンダー');
    });

    it('概要タブはLumiLabを上位プロダクトとして説明する', () => {
        const overviewText = collectTabText('overview');

        expect(overviewText).toContain('LumiLab は上位プロダクト');
        expect(overviewText).toContain('最初のサブシステムは案件システム');
        expect(overviewText).toContain('確定PRODUCT仕様とは断定しません');
        expect(overviewText).toContain('MOCK、PRODUCT、Backend実装へ進まない');
        expect(overviewText).toContain('案件名、住所分割、キャンセル / 失注ステータスの初期固定追加');
    });

    it('フロータブは案件システムから将来候補までを分けて示す', () => {
        const flowText = collectTabText('flow');

        expect(flowText).toContain('LumiLab');
        expect(flowText).toContain('案件システム');
        expect(flowText).toContain('案件登録');
        expect(flowText).toContain('案件一覧');
        expect(flowText).toContain('案件詳細');
        expect(flowText).toContain('工程デッキ');
        expect(flowText).toContain('工程カード');
        expect(flowText).toContain('拡張候補');
        expect(flowText).toContain('確定しません');
    });

    it('案件項目とステータスを未確認仕様として増やさない', () => {
        const featureText = collectTabText('feature');

        expect(projectInitialFieldLabels).toEqual([
            '会社名',
            '担当者名',
            '登録日表示',
            '住所',
            'メモ',
            'ステータス表示',
        ]);
        expect(projectInitialFieldLabels).not.toContain('案件名');
        expect(featureText).toContain('created_at');
        expect(featureText).toContain('郵便番号、都道府県、市区町村へ分割しません');
        expect(projectStatusConceptItems).toEqual([
            '進行中: 初期作成後に動いている案件として扱う。',
            '完了: 必要な業務フローを通り切った状態として扱う。',
            '終了: キャンセル、失注、対象外など途中で閉じた状態を含み得る。',
        ]);
        expect(projectStatusConceptItems.some((item) => item.startsWith('キャンセル'))).toBe(false);
        expect(projectStatusConceptItems.some((item) => item.startsWith('失注'))).toBe(false);
    });

    it('工程デッキと工程カード状態を説明し、Service側責務に留める', () => {
        const featureText = collectTabText('feature');

        expect(featureText).toContain('案件と工程カードの間に工程デッキを挟む');
        expect(featureText).toContain('直接ぶら下げるだけの説明にせず');
        expect(processCardStatusItems).toEqual([
            '未実行: まだ対応していない工程カード。',
            'スルー: この案件では不要だと明示した工程カード。',
            '実行済: 実際に対応した工程カード。',
        ]);
        expect(featureText).toContain('将来PRODUCT段階ではService側');
    });

    it('画面候補タブはMOCK予定の説明カードに留める', () => {
        const screensText = collectTabText('screens');

        expect(screenCandidateLabels).toEqual(['TOP', '案件登録', '案件一覧', '案件詳細']);
        expect(screensText).toContain('説明カードとして並べ');
        expect(screensText).toContain('フォームUIや一覧UIを実画面レベルでは作りません');
        expect(screensText).toContain('保存可能フォーム、DB保存、ステータス変更UIは作りません');
        expect(screensText).toContain('固定データ付き一覧MOCK、検索、絞り込み、ソート実装は作りません');
        expect(screensText).toContain('IDEA BOARDからMOCK画面への通常リンクは作りません');
    });

    it('図解とグラフは概念図として実績値に見せない', () => {
        const diagramText = collectTabText('diagram');
        const graphText = collectTabText('graph');

        expect(diagramText).toContain('プロダクト構造図');
        expect(diagramText).toContain('案件構造図');
        expect(diagramText).toContain('共通カレンダー');
        expect(diagramText).toContain('初期PRODUCT仕様ではなく');
        expect(graphText).toContain('概念図 / イメージ');
        expect(graphText).toContain('売上、件数、割合などの実績値ではありません');
        expect(graphText).toContain('実案件の割合ではありません');
    });

    it('codeタブは補助メモに留まりBackend層を追加しない境界を持つ', () => {
        const codeText = collectTabText('code');

        expect(codeText).toContain('codeタブは補助');
        expect(codeText).toContain('/lab/lumilab-project-idea-board');
        expect(codeText).toContain(
            'Project SelectのLumiLab開発段階からIDEA BOARDへ入るdirect routeを維持する',
        );
        expect(codeText).toContain('業務判断、完了判定、保存処理は持たせない');
        expect(codeText).toContain('Controller / Request / Action / Service / Repository / DTO / Responderは今回追加しない');
        expect(codeText).toContain('LumiLab以外の機能変更');
    });
});
