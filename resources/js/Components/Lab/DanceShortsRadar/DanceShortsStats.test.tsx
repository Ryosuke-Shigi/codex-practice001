import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import DanceShortsStats from './DanceShortsStats';
import type { DanceShortsCandidate } from './types';

const candidate: DanceShortsCandidate = {
    video_id: 10,
    youtube_video_id: 'metric-video',
    region: 'JP',
    title: 'Metric short',
    channel_title: 'Dance Channel',
    published_at: '2026-06-01 12:00',
    collected_at: '2026-06-01 12:00',
    like_count: 12000,
    comment_count: 128,
    view_count: 1500,
    previous_view_count: 1200,
    view_diff: 300,
    view_growth_rate: 0.25,
    views_per_hour: 12.5,
    thumbnail_url: null,
    youtube_url: null,
    has_previous_snapshot: true,
    comparison_status: '比較済み',
};

describe('DanceShortsStats', () => {
    it('renders the selected sort metric below the standard like and comment line', () => {
        const markup = renderToStaticMarkup(
            <DanceShortsStats candidate={candidate} sortKey="view_count_delta" />,
        );

        expect(markup).toContain('いいね');
        expect(markup).toContain('コメント');
        expect(markup).toContain('視聴増加数');
        expect(markup).toContain('+300回');
        expect(markup).not.toContain('1時間あたりの視聴増加数');
        expect(markup).not.toContain('伸び率');
    });

    it('groups current and previous view counts for the current view sort', () => {
        const markup = renderToStaticMarkup(
            <DanceShortsStats
                candidate={candidate}
                sortKey="current_view_count"
            />,
        );

        expect(markup).toContain('現在の視聴数');
        expect(markup).toContain('1,500回');
        expect(markup).toContain('前回の視聴数');
        expect(markup).toContain('1,200回');
    });

    it('renders missing comparison metrics without converting null to zero', () => {
        const missingMetricCandidate: DanceShortsCandidate = {
            ...candidate,
            youtube_video_id: 'initial-only-video',
            title: 'Initial only short',
            like_count: null,
            comment_count: null,
            previous_view_count: null,
            view_diff: null,
            view_growth_rate: null,
            views_per_hour: null,
            has_previous_snapshot: false,
            comparison_status: '比較元なし',
        };

        const markup = renderToStaticMarkup(
            <DanceShortsStats
                candidate={missingMetricCandidate}
                sortKey="views_per_hour"
            />,
        );

        expect(markup).toContain('算出不可');
        expect(markup).not.toContain('+0回');
        expect(markup).not.toContain('0回/時');

        const currentViewMarkup = renderToStaticMarkup(
            <DanceShortsStats
                candidate={missingMetricCandidate}
                sortKey="current_view_count"
            />,
        );

        expect(currentViewMarkup).toContain('比較元なし');
    });
});
