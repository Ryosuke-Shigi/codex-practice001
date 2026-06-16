import { describe, expect, it } from 'vitest';

import {
    cardKindLabels,
    documentTypeTabs,
    projectHubEntries,
    projects,
    screenSteps,
} from './mockData';

describe('ConstructionOrderNewMock fixed data', () => {
    it('keeps the project detail hub entries to the three approved entrances', () => {
        expect(projectHubEntries).toEqual([
            {
                key: 'site-access',
                label: '現場アクセス',
            },
            {
                key: 'work-detail',
                label: '詳細',
            },
            {
                key: 'documents',
                label: '書類',
            },
        ]);

        const serialized = JSON.stringify(projectHubEntries);

        expect(serialized).not.toContain('工程内カード');
        expect(serialized).not.toContain('履歴');
        expect(serialized).not.toContain('関連案件');
        expect(serialized).not.toContain('帳票');
    });

    it('keeps CSV import inside the entry form instead of a separate screen step', () => {
        expect(screenSteps.map((step) => step.label)).toEqual([
            '案件登録',
            '案件一覧',
        ]);
        expect(screenSteps.map((step) => String(step.key))).not.toContain('csv');
    });

    it('keeps the primary card kinds separated for the MOCK workflow', () => {
        expect(Object.values(cardKindLabels)).toEqual([
            '商品カード',
            '作業カード',
            '調整カード',
            '例外対応カード',
        ]);
    });

    it('keeps document switching inside the documents view', () => {
        expect(documentTypeTabs.map((tab) => tab.label)).toEqual([
            '見積書',
            '請求書',
            '領収書',
        ]);
    });

    it('keeps estimate, invoice, and receipt previews populated separately', () => {
        const reports = projects[0].reports;

        expect(reports.estimate.title).toBe('御見積書');
        expect(reports.invoice.title).toBe('御請求書');
        expect(reports.receipt.title).toBe('領収書');
        expect(new Set(documentTypeTabs.map((tab) => reports[tab.key].documentNumber)).size)
            .toBe(3);

        documentTypeTabs.forEach((tab) => {
            const report = reports[tab.key];

            expect(report.documentNumber).toBeTruthy();
            expect(report.recipient).toBeTruthy();
            expect(report.issuer).toBeTruthy();
            expect(report.issuedAt).toBeTruthy();
            expect(report.targetSummary).toBeTruthy();
            expect(report.fileLabel).toBeTruthy();
            expect(report.status).toBeTruthy();
            expect(report.selectedCardIds.length).toBeGreaterThan(0);
        });

        expect(reports.invoice.paymentAccount).toContain('サンプル銀行');
        expect(reports.invoice.paymentDue).toBe('2026/07/31');
        expect(reports.receipt.proviso).toBe('給湯配管交換工事代として');
        expect(reports.receipt.receiptStatus).toBe('未発行');
    });

    it('keeps the site access reference fields populated from the old MOCK shape', () => {
        const project = projects[0];

        [
            project.siteAddress,
            project.parkingMemo,
            project.loadingMemo,
            project.accessMethod,
            project.keyNote,
            project.visitNote,
            project.emergencyContact,
            project.siteMemo,
        ].forEach((value) => {
            expect(value).toBeTruthy();
        });
    });

    it('keeps the detail sections aligned to the four-section mock', () => {
        const sectionLabels = projects[0].workflowStages.map((stage) => stage.label);
        const sectionCardIds = Object.fromEntries(
            projects[0].workflowStages.map((stage) => [stage.id, stage.cardIds]),
        );

        expect(sectionLabels).toEqual(['商品', '作業', '調整', '例外対応']);
        expect(sectionCardIds.product).toEqual(['card-product-001']);
        expect(sectionCardIds.work).toEqual(['card-work-001']);
        expect(sectionCardIds.adjustment).toEqual([]);
        expect(sectionCardIds.exception).toEqual([]);
    });

    it('keeps adjustment and exception cards as add-only initial sections', () => {
        const project = projects[0];

        expect(project.cards.some((card) => card.kind === 'adjustment')).toBe(false);
        expect(project.cards.some((card) => card.kind === 'exception')).toBe(false);
    });

    it('uses numeric amounts for cards and detail rows', () => {
        const cards = projects.flatMap((project) => project.cards);
        const rows = cards.flatMap((card) => card.detailRows);

        expect(cards.every((card) => typeof card.amount === 'number')).toBe(true);
        expect(rows.every((row) => typeof row.amount === 'number')).toBe(true);
    });

    it('does not bring back legacy wording in the active MOCK data', () => {
        const serialized = JSON.stringify({
            cardKindLabels,
            projects,
            projectHubEntries,
        });

        const legacyWords = [
            ['タスク', 'カード'],
            ['問題対応', 'カード'],
            ['後日対応', 'カード'],
            ['帳票', '確認'],
            ['カード', '確認'],
            ['商品', '確認'],
            ['発注', '確認'],
            ['納品', '確認'],
            ['請求', '確認'],
            ['入金・領収', '確認'],
        ].map((parts) => parts.join(''));

        legacyWords.forEach((word) => {
            expect(serialized).not.toContain(word);
        });
    });
});
