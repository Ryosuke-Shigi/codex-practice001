/**
 * 背景演出 selector が選択状態と pattern 一覧を表示する UI 契約を固定します。
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('jquery', () => ({
    default: () => ({
        ripples: vi.fn(),
    }),
}));

vi.mock('jquery.ripples', () => ({}));

import EffectPatternSelector from './EffectPatternSelector';

describe('EffectPatternSelector', () => {
    it('renders the five selectable effect orbs and marks the active one', () => {
        const markup = renderToStaticMarkup(
            <EffectPatternSelector activeEffect="aquaParticles" onSelectEffect={() => {}} />,
        );

        expect(markup.match(/背景エフェクトを選択/g)).toHaveLength(5);
        expect(markup).toContain('water 背景エフェクトを選択');
        expect(markup).toContain('caustics 背景エフェクトを選択');
        expect(markup).toContain('cursorRipple 背景エフェクトを選択');
        expect(markup).toContain('AQUAParticles 背景エフェクトを選択');
        expect(markup).toContain('surfaceShimmer 背景エフェクトを選択');
        expect(markup).toContain(
            'aria-label="AQUAParticles 背景エフェクトを選択" aria-pressed="true"',
        );
        expect(markup).not.toContain('none 背景エフェクトを選択');
        expect(markup).not.toContain('floatingLight 背景エフェクトを選択');
    });
});
