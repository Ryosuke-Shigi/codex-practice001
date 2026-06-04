import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import DanceShortsCandidateCard from './DanceShortsCandidateCard';
import type { DanceShortsCandidate } from './types';

describe('DanceShortsCandidateCard', () => {
    it('keeps the thumbnail YouTube link without rendering an explanatory link sentence', () => {
        const candidate: DanceShortsCandidate = {
            video_id: 1,
            youtube_video_id: 'linked-video',
            region: 'JP',
            title: 'Linked short',
            channel_title: 'Dance Channel',
            published_at: '2026-06-01 12:00',
            collected_at: '2026-06-01 13:00',
            like_count: 1200,
            comment_count: 20,
            view_count: 1500,
            previous_view_count: 1200,
            view_diff: 300,
            view_growth_rate: 0.25,
            views_per_hour: 12.5,
            thumbnail_url: 'https://example.test/thumb.jpg',
            youtube_url: 'https://www.youtube.com/shorts/linked-video',
            has_previous_snapshot: true,
            comparison_status: '比較済み',
        };

        const markup = renderToStaticMarkup(
            <DanceShortsCandidateCard
                candidate={candidate}
                sortKey="view_count_delta"
                rank={3}
                isActive
            />,
        );

        expect(markup).toContain('target="_blank"');
        expect(markup).toContain('rel="noopener noreferrer"');
        expect(markup).toContain('YouTubeで開く');
        expect(markup).not.toContain('YouTubeを別タブ');
        expect(markup).not.toContain('サムネイルからYouTube');
    });
});
