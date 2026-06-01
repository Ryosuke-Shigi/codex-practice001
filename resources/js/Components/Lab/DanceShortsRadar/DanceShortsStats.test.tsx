import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import DanceShortsStats from './DanceShortsStats';
import type { DanceShortsCandidate } from './types';

describe('DanceShortsStats', () => {
    it('renders missing comparison metrics without converting null to zero', () => {
        const candidate: DanceShortsCandidate = {
            video_id: 10,
            youtube_video_id: 'initial-only-video',
            region: 'JP',
            title: 'Initial only short',
            channel_title: 'Dance Channel',
            published_at: '2026-06-01 12:00',
            collected_at: '2026-06-01 12:00',
            like_count: null,
            comment_count: null,
            view_count: 1500,
            previous_view_count: null,
            view_diff: null,
            view_growth_rate: null,
            views_per_hour: null,
            thumbnail_url: null,
            youtube_url: null,
            has_previous_snapshot: false,
            comparison_status: '比較元なし',
        };

        const markup = renderToStaticMarkup(
            <DanceShortsStats candidate={candidate} />,
        );

        expect(markup).toContain('比較元なし');
        expect(markup).toContain('算出不可');
        expect(markup).not.toContain('+0回');
        expect(markup).not.toContain('0回/時');
    });
});
