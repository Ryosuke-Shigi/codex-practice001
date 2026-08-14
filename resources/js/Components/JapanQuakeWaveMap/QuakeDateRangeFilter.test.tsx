import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import QuakeDateRangeFilter from './QuakeDateRangeFilter';

describe('QuakeDateRangeFilter', () => {
    it('keeps start and end date fields in two columns from mobile width', () => {
        const markup = renderToStaticMarkup(
            <QuakeDateRangeFilter
                value={{ startDate: '2026-08-01', endDate: '2026-08-14' }}
                onChange={() => {}}
            />,
        );

        expect(markup).toContain('class="mt-3 grid w-full min-w-0 grid-cols-2 gap-2');
        expect(markup).toContain('min-w-0');
        expect(markup).toContain('開始日');
        expect(markup).toContain('終了日');
    });
});
