import { describe, expect, it } from 'vitest';

import {
    getEntryProductCardId,
    syncEntryDraftToProjects,
} from './projectCardSync';
import { initialEntryDraft, projects } from './mockData';

describe('projectCardSync', () => {
    it('turns products entered in the first form into product cards', () => {
        const syncedProjects = syncEntryDraftToProjects(
            projects,
            initialEntryDraft,
            projects[0].id,
        );
        const productCards = syncedProjects[0].cards.filter(
            (card) => card.kind === 'product',
        );
        const productStage = syncedProjects[0].workflowStages.find(
            (stage) => stage.id === 'product',
        );

        expect(productCards).toHaveLength(initialEntryDraft.products.length);
        expect(productCards.map((card) => card.id)).toEqual(
            initialEntryDraft.products.map((product) =>
                getEntryProductCardId(product.id),
            ),
        );
        expect(productCards.map((card) => card.title)).toEqual(
            initialEntryDraft.products.map((product) => product.productLabel),
        );
        expect(productCards[0].summary).toBe(
            initialEntryDraft.products[0].productMemo ||
                initialEntryDraft.products[0].productName,
        );
        expect(productCards[0].summary).not.toContain('入口フォーム');
        expect(productStage?.cardIds).toHaveLength(
            initialEntryDraft.products.length,
        );
    });
});
