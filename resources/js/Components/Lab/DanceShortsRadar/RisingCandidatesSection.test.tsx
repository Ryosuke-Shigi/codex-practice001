/**
 * DanceShortsRadar の上昇候補 section が empty / candidate 表示を分ける仕様を固定します。
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import RisingCandidatesSection from './RisingCandidatesSection';
import type { DanceShortsRisingCandidate } from './types';

describe('RisingCandidatesSection', () => {
    it('renders candidate wording without decisive trend claims and keeps null growth rate as unavailable', () => {
        const candidates: DanceShortsRisingCandidate[] = [
            {
                video_id: 10,
                youtube_video_id: 'rising-null-growth',
                title: 'Null growth candidate',
                channel_title: 'Dance Channel',
                published_at: '2026-05-30 09:00',
                source_region: 'US',
                source_region_label: 'アメリカ',
                source_current_view_count: 1000,
                source_previous_view_count: 0,
                source_collected_at: '2026-06-01 12:00',
                source_previous_collected_at: '2026-05-31 12:00',
                japan_status: '日本側は未観測',
                japan_current_view_count: null,
                japan_previous_view_count: null,
                japan_view_count_delta: null,
                japan_comparison_status: 'unobserved',
                view_count_delta: 1000,
                view_growth_rate: null,
                views_per_hour: 1000 / 24,
                thumbnail_url: null,
                youtube_url: null,
                tags: [],
                observation_note:
                    'アメリカの保存済み snapshot では視聴数増加があり、日本側はまだ未観測の候補です。',
            },
        ];

        const markup = renderToStaticMarkup(
            <RisingCandidatesSection
                periodLabel="1日"
                candidates={candidates}
            />,
        );

        expect(markup).toContain('海外先行で伸びている候補');
        expect(markup).toContain('日本側は未観測');
        expect(markup).toContain('算出不可');
        expect(markup).not.toContain('必ず伸びる');
        expect(markup).not.toContain('これからバズる');
        expect(markup).not.toContain('日本で流行る');
        expect(markup).not.toContain('0%');
    });
});
