// @vitest-environment jsdom

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

    it.each([0, 3, 10])('distinguishes the configured limit from %i final targets in PRODUCT mode', (displayedPinCount) => {
        const markup = renderToStaticMarkup(
            <PinDisplayLimitSlider value={10} availablePinCount={displayedPinCount} displayedPinCount={displayedPinCount} onChange={() => {}} />,
        );
        const container = new DOMParser().parseFromString(markup, 'text/html');
        const range = container.querySelector('input[type="range"]');

        expect(container.body.textContent).toContain('表示上限');
        expect(container.body.textContent).toMatch(new RegExp(`対象\\s*${displayedPinCount}件`));
        expect(range?.getAttribute('value')).toBe('10');
        expect(range?.getAttribute('min')).toBe('5');
        expect(range?.getAttribute('max')).toBe('45');
    });

    it('preserves the old available-count clamp when no PRODUCT count is supplied', () => {
        const markup = renderToStaticMarkup(
            <PinDisplayLimitSlider value={10} availablePinCount={3} onChange={() => {}} />,
        );

        expect(markup).toContain('表示件数');
        expect(markup).toContain('max="5"');
        expect(markup).toContain('value="5"');
        expect(markup).not.toContain('表示上限');
    });
});
