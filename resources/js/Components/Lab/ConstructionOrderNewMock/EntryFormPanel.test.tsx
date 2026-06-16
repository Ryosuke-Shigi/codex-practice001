import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import EntryFormPanel from './EntryFormPanel';
import { initialEntryDraft } from './mockData';

const noop = () => {};

describe('EntryFormPanel', () => {
    it('keeps FORM and CSV import inside the same entry form shell', () => {
        const markup = renderToStaticMarkup(
            <EntryFormPanel
                draft={initialEntryDraft}
                previewed={false}
                onDraftChange={noop}
                onNext={noop}
                onPreview={noop}
                onProductAdd={noop}
                onProductChange={noop}
                onProductDuplicate={noop}
                onProductRemove={noop}
            />,
        );

        expect(markup).toContain('案件登録FORM');
        expect(markup).toContain('FORM');
        expect(markup).toContain('CSV取込');
        expect(markup).toContain('商品情報');
        expect(markup).toContain('登録');
        expect(markup).not.toContain('CSV取込画面');
        expect(markup).not.toContain('案件一覧に移動');
    });
});
