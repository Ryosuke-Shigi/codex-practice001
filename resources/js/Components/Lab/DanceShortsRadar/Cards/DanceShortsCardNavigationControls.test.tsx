/**
 * DanceShortsRadar 表示カードの navigation controls が aria / disabled を保つことを固定します。
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import DanceShortsCardNavigationControls from './DanceShortsCardNavigationControls';

describe('DanceShortsCardNavigationControls', () => {
    it('renders card move and auto slide buttons with aria state', () => {
        const markup = renderToStaticMarkup(
            <DanceShortsCardNavigationControls
                canMovePrev={false}
                canMoveNext
                isWindowSwitching={false}
                autoSlideDirection={1}
                canStartCurrentAutoSlide
                onPrevious={vi.fn()}
                onNext={vi.fn()}
                onToggleAutoSlide={vi.fn()}
            >
                {(controls) => (
                    <div>
                        {controls.topRight}
                        {controls.bottomLeft}
                    </div>
                )}
            </DanceShortsCardNavigationControls>,
        );

        expect(markup).toContain('aria-label="前のカードへ移動"');
        expect(markup).toContain('aria-label="次のカードへ移動"');
        expect(markup).toContain('aria-label="自動右送りを切り替え"');
        expect(markup).toContain('aria-label="自動左送りを切り替え"');
        expect(markup).toContain('aria-pressed="true"');
        expect(markup).toContain('aria-pressed="false"');
        expect(markup).toContain('disabled=""');
    });

    it('disables move and auto controls while window switching or auto slide cannot start', () => {
        const markup = renderToStaticMarkup(
            <DanceShortsCardNavigationControls
                canMovePrev
                canMoveNext
                isWindowSwitching
                autoSlideDirection={null}
                canStartCurrentAutoSlide={false}
                onPrevious={vi.fn()}
                onNext={vi.fn()}
                onToggleAutoSlide={vi.fn()}
            >
                {(controls) => (
                    <div>
                        {controls.topRight}
                        {controls.bottomLeft}
                    </div>
                )}
            </DanceShortsCardNavigationControls>,
        );

        expect(markup.match(/disabled=""/g)).toHaveLength(4);
        expect(markup).toContain('aria-pressed="false"');
    });
});
