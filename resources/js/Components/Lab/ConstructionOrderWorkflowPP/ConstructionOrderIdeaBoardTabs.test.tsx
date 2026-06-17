import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import ConstructionOrderIdeaBoardTabs from './ConstructionOrderIdeaBoardTabs';

describe('ConstructionOrderIdeaBoardTabs', () => {
    it('renders the refreshed construction order idea board around cases, processes, and cards', () => {
        const markup = renderToStaticMarkup(<ConstructionOrderIdeaBoardTabs />);

        expect(markup).toContain('工事発注管理システム IDEA BOARD');
        expect(markup).toContain('案件を中心に、工程とカードで管理する');
        expect(markup).toContain('FORM入力');
        expect(markup).toContain('CSV出力');
        expect(markup).toContain('CSV取込');
        expect(markup).toContain('案件管理へ');
        expect(markup).toContain('案件が親');
        expect(markup).toContain('通常工事');
        expect(markup).toContain('クレーム対応');
        expect(markup).toContain('工事後対応');
        expect(markup).toContain('追加作業');
        expect(markup).toContain('工程はカードを管理する箱');
        expect(markup).toContain('商品カード');
        expect(markup).toContain('作業カード');
        expect(markup).toContain('調整カード');
        expect(markup).toContain('例外対応カード');
        expect(markup).toContain('内容 / 金額 / 写真 / ファイル / 完了状態 / メモ');
        expect(markup).toContain('見積は、使うカードを選んで出力する');
        expect(markup).toContain('請求は、使うカードを選んで出力する');
        expect(markup).toContain('領収は、使うカードを選んで出力する');
        expect(markup).toContain('現場アクセスは別入口');
        expect(markup).toContain('現場アクセスは独立した別入口');
    });

    it('does not render implementation details or old workflow wording', () => {
        const markup = renderToStaticMarkup(<ConstructionOrderIdeaBoardTabs />);

        [
            '見積対象',
            '請求対象',
            '領収対象',
            '対象外',
            'SKIP',
            '工程進捗',
            '標準工程',
            '例外工程',
            'DB',
            'Migration',
            'Repository',
            'Service',
            'DTO',
            'S3',
            'Storage',
            'PRODUCT',
            'API',
            '作成日',
            'Ver',
            '確認項目',
            '今後詰めるもの',
        ].forEach((blockedText) => {
            expect(markup).not.toContain(blockedText);
        });
    });
});
