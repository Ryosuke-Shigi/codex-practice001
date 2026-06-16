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
            '諸経費カード',
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

    it('separates target-excluded stages from skipped stages', () => {
        const stageStatuses = projects.flatMap((project) =>
            project.workflowStages.map((stage) => stage.status),
        );

        expect(stageStatuses).toContain('対象外');
        expect(stageStatuses).toContain('SKIP');
    });

    it('keeps exception cards in their own workflow stage', () => {
        const project = projects[0];
        const exceptionStage = project.workflowStages.find(
            (stage) => stage.id === 'exception-support',
        );
        const exceptionCard = project.cards.find(
            (card) => card.id === 'card-exception-001',
        );
        const normalStageCardIds = project.workflowStages
            .filter((stage) => stage.id !== 'exception-support')
            .flatMap((stage) => stage.cardIds);

        expect(exceptionStage?.label).toBe('例外対応');
        expect(exceptionStage?.cardIds).toEqual(['card-exception-001']);
        expect(exceptionCard?.kind).toBe('exception');
        expect(exceptionCard?.phaseId).toBe('exception-support');
        expect(normalStageCardIds).not.toContain('card-exception-001');
    });

    it('uses numeric amounts for cards and detail rows', () => {
        const cards = projects.flatMap((project) => project.cards);
        const rows = cards.flatMap((card) => card.detailRows);

        expect(cards.every((card) => typeof card.amount === 'number')).toBe(true);
        expect(rows.every((row) => typeof row.amount === 'number')).toBe(true);
        expect(cards.some((card) => card.amount < 0)).toBe(true);
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
        ].map((parts) => parts.join(''));

        legacyWords.forEach((word) => {
            expect(serialized).not.toContain(word);
        });
    });
});
