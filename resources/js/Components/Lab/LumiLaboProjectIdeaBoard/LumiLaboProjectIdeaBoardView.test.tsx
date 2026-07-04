import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import LumiLaboProjectIdeaBoardView from './LumiLaboProjectIdeaBoardView';

describe('LumiLaboProjectIdeaBoardView', () => {
    it('初期表示は概要で、必須4タブと選択状態の見た目を表示する', () => {
        const markup = renderToStaticMarkup(<LumiLaboProjectIdeaBoardView />);

        expect(markup).toContain('LumiLabo 案件システム IDEA BOARD');
        expect(markup).toContain('概要');
        expect(markup).toContain('TOP');
        expect(markup).toContain('案件');
        expect(markup).toContain('Coding');
        expect(markup).not.toContain('案件作成</span>');
        expect(markup).not.toContain('案件一覧</span>');
        expect(markup).not.toContain('表示中');
        expect(markup).toContain('bg-yellow-300');
        expect(markup).toContain('案件作成IDEA BOARD概要');
        expect(markup).toContain('案件作成MOCKへ進む前に、項目と考え方を固める');
    });

    it('非選択タブの本文を同じ画面へ縦並び表示しない', () => {
        const markup = renderToStaticMarkup(<LumiLaboProjectIdeaBoardView />);

        expect(markup).not.toContain('登録へ混ぜないもの');
        expect(markup).not.toContain('入力対象');
        expect(markup).not.toContain('登録日表示');
        expect(markup).not.toContain('Page / Component / data');
        expect(markup).not.toContain('将来PRODUCT化する場合の責務境界');
    });

    it('保存可能フォームや入力欄として描画しない', () => {
        const markup = renderToStaticMarkup(<LumiLaboProjectIdeaBoardView />);

        expect(markup).not.toContain('<form');
        expect(markup).not.toContain('<input');
        expect(markup).not.toContain('<textarea');
    });
});