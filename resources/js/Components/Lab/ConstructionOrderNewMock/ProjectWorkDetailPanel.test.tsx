import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import ProjectWorkDetailPanel from './ProjectWorkDetailPanel';
import type { Project } from './mockData';
import { projects } from './mockData';

const noop = () => {};

describe('ProjectWorkDetailPanel', () => {
    const renderPanel = (
        initialScreen: 'top' | 'product' | 'work' | 'adjustment' | 'exception',
        initialWorkAddStep: 'closed' | 'select' | 'input' = 'closed',
        initialProductAddModalOpen = false,
        project: Project = projects[0],
        initialAddOnlyModalKind: 'adjustment' | 'exception' | null = null,
        initialEditCardId: string | null = null,
    ) =>
        renderToStaticMarkup(
            <ProjectWorkDetailPanel
                initialAddOnlyModalKind={initialAddOnlyModalKind}
                initialEditCardId={initialEditCardId}
                initialProductAddModalOpen={initialProductAddModalOpen}
                initialScreen={initialScreen}
                initialWorkAddStep={initialWorkAddStep}
                project={project}
                onAddCard={noop}
                onDeleteCard={noop}
                onSaveCard={noop}
            />,
        );

    it('renders the four-section detail top without legacy main wording', () => {
        const markup = renderPanel('top');

        expect(markup).toContain('商品');
        expect(markup).toContain('作業');
        expect(markup).toContain('調整');
        expect(markup).toContain('例外対応');
        expect(markup).toContain('未追加');
        expect(markup).not.toContain('区分を選択してください');
        expect(markup).not.toContain('あり / なし の状態をここで確認できます');
        expect(markup).not.toContain('案件パターン');
        expect(markup).not.toContain('工程・カード');
        expect(markup).not.toContain('対象外');
        expect(markup).not.toContain('SKIP');
    });

    it('renders product card handling and the product card list screen', () => {
        const markup = renderPanel('product');

        expect(markup).toContain('商品取扱');
        expect(markup).not.toContain('商品カード取扱');
        expect(markup).toContain('あり');
        expect(markup).toContain('なし');
        expect(markup).toContain('なし理由');
        expect(markup).toContain('商品カード一覧');
        expect(markup).toContain('商品カード追加');
        expect(markup).toContain('カード一覧フィールド');
        expect(markup).not.toContain('削除');
        expect(markup).not.toContain('クリックして編集');
        expect(markup).not.toContain('h-6 w-6 shrink-0 rounded border');
    });

    it('renders the product card input modal from the product add action', () => {
        const markup = renderPanel('product', 'closed', true);

        expect(markup).toContain('商品カード入力');
        expect(markup).toContain('項目1');
        expect(markup).toContain('項目2');
        expect(markup).toContain('項目3');
        expect(markup).toContain('備考');
        expect(markup).toContain('保存');
    });

    it('renders work card handling and the work card add button', () => {
        const markup = renderPanel('work');

        expect(markup).toContain('作業取扱');
        expect(markup).not.toContain('作業カード取扱');
        expect(markup).toContain('なし理由');
        expect(markup).toContain('作業カード一覧');
        expect(markup).toContain('カード追加');
        expect(markup).toContain('カード一覧フィールド');
        expect(markup).not.toContain('削除');
    });

    it('renders the work card selection and input modal states', () => {
        const selectMarkup = renderPanel('work', 'select');
        const inputMarkup = renderPanel('work', 'input');

        expect(selectMarkup).toContain('作業カードを選択');
        expect(selectMarkup).toContain('現地確認');
        expect(selectMarkup).toContain('足場確認');
        expect(selectMarkup).toContain('養生確認');
        expect(selectMarkup).toContain('施工日調整');
        expect(selectMarkup).toContain('施工完了');
        expect(selectMarkup).toContain('写真登録');
        expect(selectMarkup).toContain('検収');
        expect(selectMarkup).not.toContain('既設配管撤去');
        expect(selectMarkup).not.toContain('新規配管敷設');
        expect(selectMarkup).not.toContain('給湯器取付');
        expect(selectMarkup).not.toContain('試運転確認');
        expect(selectMarkup).not.toContain('作業カードA');
        expect(selectMarkup).toContain('次へ');

        expect(inputMarkup).toContain('作業カード入力');
        expect(inputMarkup).toContain('項目1');
        expect(inputMarkup).toContain('項目2');
        expect(inputMarkup).toContain('項目3');
        expect(inputMarkup).toContain('備考');
        expect(inputMarkup).toContain('保存');
    });

    it('renders adjustment and exception screens as add-only card lists', () => {
        const adjustmentMarkup = renderPanel('adjustment');
        const exceptionMarkup = renderPanel('exception');

        expect(adjustmentMarkup).toContain('必要時に追加');
        expect(adjustmentMarkup).toContain('調整カード一覧');
        expect(adjustmentMarkup).toContain('調整カード追加');

        expect(exceptionMarkup).toContain('必要時に追加');
        expect(exceptionMarkup).toContain('例外対応カード一覧');
        expect(exceptionMarkup).toContain('例外対応カード追加');
    });

    it('renders input modals for adjustment and exception card additions', () => {
        const adjustmentModalMarkup = renderPanel(
            'adjustment',
            'closed',
            false,
            projects[0],
            'adjustment',
        );
        const exceptionModalMarkup = renderPanel(
            'exception',
            'closed',
            false,
            projects[0],
            'exception',
        );

        expect(adjustmentModalMarkup).toContain('調整カード入力');
        expect(adjustmentModalMarkup).toContain('保存');
        expect(exceptionModalMarkup).toContain('例外対応カード入力');
        expect(exceptionModalMarkup).toContain('保存');
    });

    it('renders a card edit modal with card-linked photo and file actions', () => {
        const markup = renderPanel(
            'work',
            'closed',
            false,
            projects[0],
            null,
            projects[0].cards.find((card) => card.kind === 'work')?.id ?? null,
        );

        expect(markup).toContain('作業カード詳細');
        expect(markup).toContain('カード名');
        expect(markup).toContain('削除');
        expect(markup).toContain('写真連続撮影');
        expect(markup).not.toContain('撮影分類');
        expect(markup).not.toContain('着工前');
        expect(markup).not.toContain('作業中');
        expect(markup).not.toContain('完了後');
        expect(markup).not.toContain('検収用');
        expect(markup).toContain('撮影');
        expect(markup).toContain('ファイルまとめて追加');
        expect(markup).toContain('type="file"');
        expect(markup).toContain('multiple');
        expect(markup).toContain('ドラッグ＆ドロップ');
        expect(markup).toContain('保存');
    });

    it('renders card detail modals with delete actions for every detail section', () => {
        const projectWithEveryCard: Project = {
            ...projects[0],
            cards: [
                ...projects[0].cards,
                {
                    ...projects[0].cards[0],
                    id: 'card-adjustment-test',
                    kind: 'adjustment',
                    phaseId: 'adjustment',
                    title: '調整カード確認用',
                    category: '調整',
                },
                {
                    ...projects[0].cards[0],
                    id: 'card-exception-test',
                    kind: 'exception',
                    phaseId: 'exception',
                    title: '例外対応カード確認用',
                    category: '例外対応',
                },
            ],
        };

        const productCard = projectWithEveryCard.cards.find(
            (card) => card.kind === 'product',
        );
        const workCard = projectWithEveryCard.cards.find(
            (card) => card.kind === 'work',
        );

        const productMarkup = renderPanel(
            'product',
            'closed',
            false,
            projectWithEveryCard,
            null,
            productCard?.id ?? null,
        );
        const workMarkup = renderPanel(
            'work',
            'closed',
            false,
            projectWithEveryCard,
            null,
            workCard?.id ?? null,
        );
        const adjustmentMarkup = renderPanel(
            'adjustment',
            'closed',
            false,
            projectWithEveryCard,
            null,
            'card-adjustment-test',
        );
        const exceptionMarkup = renderPanel(
            'exception',
            'closed',
            false,
            projectWithEveryCard,
            null,
            'card-exception-test',
        );

        expect(productMarkup).toContain('商品カード詳細');
        expect(workMarkup).toContain('作業カード詳細');
        expect(adjustmentMarkup).toContain('調整カード詳細');
        expect(exceptionMarkup).toContain('例外対応カード詳細');
        expect(productMarkup).toContain('削除');
        expect(workMarkup).toContain('削除');
        expect(adjustmentMarkup).toContain('削除');
        expect(exceptionMarkup).toContain('削除');
    });
});
