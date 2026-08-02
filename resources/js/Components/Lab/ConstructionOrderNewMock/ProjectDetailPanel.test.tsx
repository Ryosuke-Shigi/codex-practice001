import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import ProjectDetailPanel from './ProjectDetailPanel';
import type { DocumentType } from './mockData';
import { projects } from './mockData';

const noop = () => {};

describe('ProjectDetailPanel', () => {
    const renderProjectDetail = (
        activeView: 'hub' | 'site-access' | 'work-detail' | 'documents',
        activeDocumentType: DocumentType = 'estimate',
    ) =>
        renderToStaticMarkup(
            <ProjectDetailPanel
                activeDocumentType={activeDocumentType}
                activeView={activeView}
                project={projects[0]}
                onAddCard={noop}
                onBackToProjects={noop}
                onDeleteCard={noop}
                onDocumentTypeChange={noop}
                onSaveCard={noop}
                onViewChange={noop}
            />,
        );

    it('renders the project detail entrance screen with the three approved entrances', () => {
        const markup = renderProjectDetail('hub');

        expect(markup).toContain('案件詳細');
        expect(markup).toContain('現場アクセス');
        expect(markup).toContain('詳細');
        expect(markup).toContain('書類');
        expect(markup).toContain('aria-label="案件一覧へ戻る"');
        expect(markup).toContain('title="案件一覧へ戻る"');
        expect(markup).toContain('>戻る</button>');
        expect(markup).not.toContain('開く');
        expect(markup).not.toContain('工程内カード');
        expect(markup).not.toContain('履歴');
        expect(markup).not.toContain('関連案件');
        expect(markup).not.toContain('帳票ファイル');
    });

    it('renders work detail top as the four-section selection screen', () => {
        const markup = renderProjectDetail('work-detail');

        expect(markup).toContain('商品');
        expect(markup).toContain('作業');
        expect(markup).toContain('調整');
        expect(markup).toContain('例外対応');
        expect(markup).toContain('あり');
        expect(markup).toContain('未追加');
        expect(markup).not.toContain('区分を選択してください');
        expect(markup).not.toContain('あり / なし の状態をここで確認できます');
        expect(markup).not.toContain('案件パターン');
        expect(markup).not.toContain('工程・カード');
        expect(markup).not.toContain('商品確認');
        expect(markup).not.toContain('発注確認');
        expect(markup).not.toContain('納品確認');
        expect(markup).not.toContain('請求確認');
        expect(markup).not.toContain('入金・領収確認');
        expect(markup).not.toContain('対象外');
        expect(markup).not.toContain('SKIP');
        expect(markup).not.toContain('見積書');
        expect(markup).not.toContain('請求書');
        expect(markup).not.toContain('領収書');
        expect(markup).not.toContain('現場アクセス');
    });

    it('renders site access with a Yahoo map search URL for the real mock address', () => {
        const project = projects[0];
        const markup = renderProjectDetail('site-access');

        expect(project.siteAddress).toBe(
            '大阪府大阪市北区梅田3-1-1 大阪ステーションシティ',
        );
        expect(markup).toContain('Yahoo!マップ');
        expect(markup).toContain(
            `https://map.yahoo.co.jp/search?q=${encodeURIComponent(project.siteAddress)}`,
        );
        expect(markup).not.toContain('Yahoo!マップで現場を開く');
    });

    it('renders documents with estimate, invoice, and receipt switching', () => {
        const markup = renderProjectDetail('documents');

        expect(markup).toContain('見積書');
        expect(markup).toContain('請求書');
        expect(markup).toContain('領収書');
        expect(markup).toContain('帳票ファイル');
        expect(markup).toContain('対象内容');
        expect(markup).toContain('帳票番号');
        expect(markup).toContain('宛名');
        expect(markup).toContain('発行者');
        expect(markup).toContain('発行日');
        expect(markup).toContain('出力明細の選択');
        expect(markup).toContain('印刷');
        expect(markup).toContain('PDF');
        expect(markup).toContain('Excel');
        expect(markup).not.toContain('Excel風');
        expect(markup).not.toContain('外部向け備考');
        expect(markup).not.toContain('メモ');
    });

    it('renders invoice and receipt previews with their own official fields', () => {
        const invoiceMarkup = renderProjectDetail('documents', 'invoice');
        const receiptMarkup = renderProjectDetail('documents', 'receipt');

        expect(invoiceMarkup).toContain('御請求書');
        expect(invoiceMarkup).toContain('INV-20260621-001');
        expect(invoiceMarkup).toContain('請求書未確定');
        expect(invoiceMarkup).toContain('御請求金額');

        expect(receiptMarkup).toContain('領収書');
        expect(receiptMarkup).toContain('REC-20260701-001');
        expect(receiptMarkup).toContain('入金確認待ち');
        expect(receiptMarkup).toContain('領収金額');
        expect(receiptMarkup).not.toContain('外部向け備考');
    });
});
