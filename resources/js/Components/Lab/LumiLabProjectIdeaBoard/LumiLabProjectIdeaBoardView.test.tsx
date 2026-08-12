import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import LumiLabProjectIdeaBoardView from './LumiLabProjectIdeaBoardView';

describe('LumiLabProjectIdeaBoardView', () => {
    it('初期表示は概要で、上位7タブと薄いファイルタグを表示する', () => {
        const markup = renderToStaticMarkup(<LumiLabProjectIdeaBoardView />);

        expect(markup).toContain('LumiLab 案件システム IDEA BOARD');
        expect(markup).toContain('概要');
        expect(markup).toContain('フロー');
        expect(markup).toContain('機能説明');
        expect(markup).toContain('画面候補');
        expect(markup).toContain('図解');
        expect(markup).toContain('グラフ');
        expect(markup).toContain('code');
        expect(markup).toContain('位置づけ');
        expect(markup).toContain('価値');
        expect(markup).toContain('範囲');
        expect(markup).toContain('rounded-t-md');
        expect(markup).toContain('border-b-0');
        expect(markup).toContain('bg-yellow-300');
        expect(markup).toContain('LumiLabと案件システムの親子関係');
        expect(markup).not.toContain('Coding');
    });

    it('非選択タブの本文を同じ画面へ縦並び表示しない', () => {
        const markup = renderToStaticMarkup(<LumiLabProjectIdeaBoardView />);

        expect(markup).not.toContain('概念フローチャート');
        expect(markup).not.toContain('1案件として扱う初期情報');
        expect(markup).not.toContain('画面候補一覧');
        expect(markup).not.toContain('プロダクト構造図');
        expect(markup).not.toContain('情報量の広がり');
        expect(markup).not.toContain('補助メモ');
    });

    it('保存可能フォームや入力欄として描画しない', () => {
        const markup = renderToStaticMarkup(<LumiLabProjectIdeaBoardView />);

        expect(markup).not.toContain('<form');
        expect(markup).not.toContain('<input');
        expect(markup).not.toContain('<textarea');
    });

    it('モバイルでタブとファイルタグを横スクロールにし、本文側のスクロール領域を残す', () => {
        const markup = renderToStaticMarkup(<LumiLabProjectIdeaBoardView />);

        expect(markup).toContain('overflow-x-auto');
        expect(markup).toContain('min-w-32 flex-none');
        expect(markup).toContain('min-w-24 flex-none');
        expect(markup).toContain('min-h-0 flex-1 overflow-y-auto');
    });
});
