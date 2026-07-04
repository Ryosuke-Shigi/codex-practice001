import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import LumiLaboProjectIdeaBoardView from './LumiLaboProjectIdeaBoardView';

describe('LumiLaboProjectIdeaBoardView', () => {
    it('初期表示はTOPで、必須タブと表示中状態を表示する', () => {
        const markup = renderToStaticMarkup(<LumiLaboProjectIdeaBoardView />);

        expect(markup).toContain('LumiLabo 案件システム IDEA BOARD');
        expect(markup).toContain('TOP');
        expect(markup).toContain('案件');
        expect(markup).toContain('案件作成');
        expect(markup).toContain('案件一覧');
        expect(markup).toContain('Coding');
        expect(markup).toContain('表示中');
        expect(markup).toContain('bg-yellow-300');
        expect(markup).toContain('案件システムTOP構想');
        expect(markup).toContain('TOPで見せる入口');
        expect(markup).toContain('案件作成へ進む入口');
        expect(markup).toContain('案件一覧を見る入口');
    });

    it('非選択タブの本文を同じ画面へ縦並び表示しない', () => {
        const markup = renderToStaticMarkup(<LumiLaboProjectIdeaBoardView />);

        expect(markup).not.toContain('入力させる候補');
        expect(markup).not.toContain('登録日表示');
        expect(markup).not.toContain('表示データの持ち方');
        expect(markup).not.toContain('将来PRODUCT化する場合の責務');
    });

    it('保存可能フォームや入力欄として描画しない', () => {
        const markup = renderToStaticMarkup(<LumiLaboProjectIdeaBoardView />);

        expect(markup).not.toContain('<form');
        expect(markup).not.toContain('<input');
        expect(markup).not.toContain('<textarea');
    });
});
