import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PinDisplayLimitSlider from './PinDisplayLimitSlider';

describe('PinDisplayLimitSlider', () => {
    it('uses a native vertical range with a stable touch hit area', () => {
        const markup = renderToStaticMarkup(
            <PinDisplayLimitSlider value={10} availablePinCount={45} onChange={() => {}} />,
        );

        expect(markup).toContain('aria-orientation="vertical"');
        expect(markup).toContain('writing-mode:vertical-lr');
        expect(markup).toContain('direction:rtl');
        expect(markup).toContain('touch-none');
        expect(markup).not.toContain('-rotate-90');
    });
});
