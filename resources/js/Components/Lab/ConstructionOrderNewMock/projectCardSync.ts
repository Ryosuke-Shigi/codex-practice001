import type {
    CardKind,
    EntryDraft,
    EntryProductDraft,
    Project,
    WorkCard,
} from './mockData';
import { parseYenInput } from './mockData';

export function syncEntryDraftToProjects(
    targetProjects: Project[],
    draft: EntryDraft,
    targetProjectId: string,
) {
    return targetProjects.map((project) =>
        project.id === targetProjectId
            ? syncEntryDraftToProject(project, draft)
            : project,
    );
}

export function updateProjectCardSummary(
    project: Project,
    cards: WorkCard[],
): Project {
    const amountSummary = cards.reduce((total, card) => total + card.amount, 0);
    const targetCardIds = cards
        .filter((card) => card.billingTarget === '請求対象')
        .map((card) => card.id);

    return {
        ...project,
        cards,
        workflowStages: project.workflowStages.map((stage) => {
            const stageKind = getStageCardKind(stage.id);
            const stageCardIds = stageKind
                ? cards
                      .filter((card) => card.kind === stageKind)
                      .map((card) => card.id)
                : stage.cardIds.filter((cardId) =>
                      cards.some((card) => card.id === cardId),
                  );

            return {
                ...stage,
                cardIds: stageCardIds,
                status:
                    stageCardIds.length > 0 ? 'できている' : 'できていない',
                statusNote:
                    stageCardIds.length > 0
                        ? `${stage.label}カード ${stageCardIds.length}件。`
                        : `${stage.label}カードは未追加。`,
                evidenceSummary:
                    stageCardIds.length > 0
                        ? `${stage.label}カード ${stageCardIds.length}件`
                        : `${stage.label}カードなし`,
            };
        }),
        cardCount: `${cards.length}枚`,
        pendingCardCount: cards.filter((card) => card.status !== 'できている')
            .length,
        confirmCount: cards.filter(
            (card) => card.requiresRelatedProject || card.status === '差戻し',
        ).length,
        hasRelatedProjects: cards.some((card) => card.requiresRelatedProject),
        amountSummary,
        reports: {
            estimate: {
                ...project.reports.estimate,
                selectedCardIds: targetCardIds,
            },
            invoice: {
                ...project.reports.invoice,
                selectedCardIds: targetCardIds,
            },
            receipt: {
                ...project.reports.receipt,
                selectedCardIds: cards
                    .filter((card) => card.receiptTarget === '領収対象')
                    .map((card) => card.id),
            },
        },
    };
}

export function getEntryProductCardId(productId: string) {
    return `card-product-${productId}`;
}

function syncEntryDraftToProject(project: Project, draft: EntryDraft): Project {
    const productCards = draft.products.map(createEntryProductCard);
    const nonProductCards = project.cards.filter((card) => card.kind !== 'product');
    const projectWithEntryDraft = {
        ...project,
        name: draft.projectName || project.name,
        customerName: draft.customerName || project.customerName,
        siteAddress: draft.siteAddress || project.siteAddress,
        owner: draft.owner || project.owner,
    };

    return updateProjectCardSummary(projectWithEntryDraft, [
        ...productCards,
        ...nonProductCards,
    ]);
}

function createEntryProductCard(
    product: EntryProductDraft,
    index: number,
): WorkCard {
    const id = getEntryProductCardId(product.id);
    const amount = parseYenInput(product.productFixedAmount);
    const quantity = parseProductQuantity(product.productMeasurement);
    const title =
        product.productLabel ||
        product.productName ||
        `商品カード ${index + 1}`;

    return {
        id,
        kind: 'product',
        phaseId: 'product',
        title,
        status: 'できている',
        amount,
        category: '商品',
        hasMemo: product.productMemo.trim().length > 0,
        hasPhotos: false,
        hasFiles: false,
        billingTarget: '請求対象',
        receiptTarget: '領収対象',
        requiresRelatedProject: false,
        summary: product.productMemo || product.productName || title,
        detailRows: [
            {
                id: `row-${id}`,
                content: product.productName || title,
                displayLabel: '商品数',
                quantity,
                unit: product.productUnit || '式',
                unitPrice: amount,
                amount,
                memo: product.productMemo,
            },
        ],
        photos: [],
        files: [],
        memo: product.productMemo,
        documentReflection: '書類入口側で扱う',
    };
}

function parseProductQuantity(value: string) {
    const quantity = Number(value.replace(/[^\d.-]/g, ''));

    return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function getStageCardKind(stageId: string): CardKind | null {
    if (
        stageId === 'product' ||
        stageId === 'work' ||
        stageId === 'adjustment' ||
        stageId === 'exception'
    ) {
        return stageId;
    }

    return null;
}
