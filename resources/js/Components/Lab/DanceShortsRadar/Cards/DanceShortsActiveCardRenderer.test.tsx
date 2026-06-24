/**
 * DanceShortsRadar 表示カード renderer が ranking / rising / empty を分けることを固定します。
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES } from '../types';
import type {
    DanceShortsCandidate,
    DanceShortsDisplayCardField,
    DanceShortsRisingCandidate,
} from '../types';
import DanceShortsActiveCardRenderer from './DanceShortsActiveCardRenderer';

const thumbnailControls = {
    topRight: <span>auto right</span>,
    bottomLeft: <span>auto left</span>,
};

function rankingCandidate(): DanceShortsCandidate {
    return {
        video_id: 1,
        youtube_video_id: 'ranking-video',
        region: 'JP',
        title: 'Ranking renderer card',
        channel_title: 'Dance Channel',
        published_at: '2026-06-01 12:00',
        collected_at: '2026-06-01 13:00',
        like_count: 100,
        comment_count: 10,
        view_count: 1200,
        previous_view_count: 1000,
        view_diff: 200,
        view_growth_rate: 0.2,
        views_per_hour: 12,
        thumbnail_url: null,
        youtube_url: null,
    };
}

function risingCandidate(): DanceShortsRisingCandidate {
    return {
        video_id: 2,
        youtube_video_id: 'rising-video',
        title: 'Rising renderer card',
        channel_title: 'Dance Channel',
        published_at: '2026-06-01 12:00',
        source_region: 'US',
        source_region_label: 'アメリカ',
        source_collected_at: '2026-06-01 13:00',
        japan_status: '日本側は未観測',
        japan_view_count_delta: null,
        japan_comparison_status: 'unobserved',
        view_count_delta: 300,
        view_growth_rate: null,
        thumbnail_url: null,
        youtube_url: null,
        tags: ['US先行'],
        observation_note: '海外側の保存済み snapshot では視聴数増加があります。',
    };
}

function rankingWindow(): DanceShortsDisplayCardField {
    return {
        type: DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES.RANKING,
        visibleCards: [rankingCandidate()],
        activeIndex: 0,
        activeRank: 1,
        pagination: {
            startRank: 1,
            windowSize: 5,
            hasPrev: false,
            hasNext: false,
            prevStartRank: null,
            nextStartRank: null,
        },
        emptyMessage: null,
    };
}

function risingWindow(): DanceShortsDisplayCardField {
    return {
        type: DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES.RISING,
        visibleCards: [risingCandidate()],
        activeIndex: 0,
        activeRank: 1,
        pagination: {
            startRank: 1,
            windowSize: 5,
            hasPrev: false,
            hasNext: false,
            prevStartRank: null,
            nextStartRank: null,
        },
        emptyMessage: null,
    };
}

describe('DanceShortsActiveCardRenderer', () => {
    it('renders the active ranking card with the ranking card component', () => {
        const currentWindow = rankingWindow();
        const markup = renderToStaticMarkup(
            <DanceShortsActiveCardRenderer
                currentWindow={currentWindow}
                activeCard={currentWindow.visibleCards[0]}
                sortKey="view_count_delta"
                rank={1}
                thumbnailControls={thumbnailControls}
                contentTransitionClassName="transition-test"
                contentTransitionKey={1}
            />,
        );

        expect(markup).toContain('Ranking renderer card');
        expect(markup).toContain('JP');
        expect(markup).toContain('auto right');
        expect(markup).not.toContain('日本側は未観測');
    });

    it('renders the active rising card with the rising card component', () => {
        const currentWindow = risingWindow();
        const markup = renderToStaticMarkup(
            <DanceShortsActiveCardRenderer
                currentWindow={currentWindow}
                activeCard={currentWindow.visibleCards[0]}
                sortKey="view_count_delta"
                rank={1}
                thumbnailControls={thumbnailControls}
                contentTransitionClassName="transition-test"
                contentTransitionKey={1}
            />,
        );

        expect(markup).toContain('Rising renderer card');
        expect(markup).toContain('アメリカ / US');
        expect(markup).toContain('日本側は未観測');
        expect(markup).toContain('算出不可');
    });

    it('renders empty state when the active card is invalid', () => {
        const markup = renderToStaticMarkup(
            <DanceShortsActiveCardRenderer
                currentWindow={rankingWindow()}
                activeCard={undefined}
                sortKey="view_count_delta"
                rank={1}
                thumbnailControls={thumbnailControls}
                contentTransitionClassName=""
                contentTransitionKey={0}
            />,
        );

        expect(markup).toContain('表示できるカードはまだありません。');
    });
});
