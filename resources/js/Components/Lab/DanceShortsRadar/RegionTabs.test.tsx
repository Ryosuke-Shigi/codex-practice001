import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import RegionTabs from './RegionTabs';
import type { DanceShortsTab } from './types';

describe('RegionTabs', () => {
    it('renders the rising candidates tab first in the expected tab order', () => {
        const tabs: DanceShortsTab[] = [
            {
                code: 'RISING',
                label: '上昇候補',
                description: '海外先行で伸びている候補',
            },
            {
                code: 'ALL',
                label: 'まとめ',
                description: '全地域のまとめ',
            },
            {
                code: 'JP',
                label: '日本',
                description: '日本のランキング',
            },
            {
                code: 'US',
                label: 'アメリカ',
                description: 'アメリカのランキング',
            },
            {
                code: 'KR',
                label: '韓国',
                description: '韓国のランキング',
            },
        ];

        const markup = renderToStaticMarkup(
            <RegionTabs tabs={tabs} selectedTab="RISING" />,
        );

        expect(markup.indexOf('上昇候補')).toBeLessThan(
            markup.indexOf('まとめ'),
        );
        expect(markup.indexOf('まとめ')).toBeLessThan(
            markup.indexOf('日本'),
        );
        expect(markup.indexOf('日本')).toBeLessThan(
            markup.indexOf('アメリカ'),
        );
        expect(markup.indexOf('アメリカ')).toBeLessThan(
            markup.indexOf('韓国'),
        );
        expect(markup).toContain('aria-selected="true"');
    });
});
