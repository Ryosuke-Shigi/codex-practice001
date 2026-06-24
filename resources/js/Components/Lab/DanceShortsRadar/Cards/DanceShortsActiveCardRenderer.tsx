import type { ReactNode } from 'react';

import DanceShortsCandidateCard from '../DanceShortsCandidateCard';
import DanceShortsRisingCandidateCard from '../DanceShortsRisingCandidateCard';
import { DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES } from '../types';
import type { DanceShortsDisplayCardField } from '../types';
import EmptyDisplayCardField from './EmptyDisplayCardField';
import type { DanceShortsActiveDisplayCard } from './useDanceShortsCardWindow';

type DanceShortsActiveCardRendererProps = {
    currentWindow: DanceShortsDisplayCardField;
    activeCard: DanceShortsActiveDisplayCard | undefined;
    sortKey: string;
    rank: number;
    thumbnailControls: {
        topRight: ReactNode;
        bottomLeft: ReactNode;
    };
    contentTransitionClassName: string;
    contentTransitionKey: number;
};

/**
 * DanceShortsRadar の active card を ranking / rising の種類ごとに描画します。
 *
 * window取得、prefetch、interval、keyboard、swipe の状態管理は持たず、カード種別分岐だけを担当します。
 */
export default function DanceShortsActiveCardRenderer({
    currentWindow,
    activeCard,
    sortKey,
    rank,
    thumbnailControls,
    contentTransitionClassName,
    contentTransitionKey,
}: DanceShortsActiveCardRendererProps) {
    if (activeCard === undefined) {
        return (
            <EmptyDisplayCardField message="表示できるカードはまだありません。" />
        );
    }

    if (
        currentWindow.type === DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES.RANKING &&
        'region' in activeCard
    ) {
        return (
            <DanceShortsCandidateCard
                candidate={activeCard}
                sortKey={sortKey}
                rank={rank}
                isActive
                thumbnailControls={thumbnailControls}
                contentTransitionClassName={contentTransitionClassName}
                contentTransitionKey={contentTransitionKey}
            />
        );
    }

    if (
        currentWindow.type === DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES.RISING &&
        'source_region' in activeCard
    ) {
        return (
            <DanceShortsRisingCandidateCard
                title={activeCard.title}
                publishedAt={activeCard.published_at}
                sourceRegion={activeCard.source_region}
                sourceRegionLabel={activeCard.source_region_label}
                sourceCollectedAt={activeCard.source_collected_at}
                japanStatus={activeCard.japan_status}
                viewCountDelta={activeCard.view_count_delta}
                viewGrowthRate={activeCard.view_growth_rate}
                japanViewCountDelta={activeCard.japan_view_count_delta ?? null}
                thumbnailUrl={activeCard.thumbnail_url}
                youtubeUrl={activeCard.youtube_url}
                tags={activeCard.tags}
                observationNote={activeCard.observation_note}
                rank={rank}
                isActive
                thumbnailControls={thumbnailControls}
                contentTransitionClassName={contentTransitionClassName}
                contentTransitionKey={contentTransitionKey}
            />
        );
    }

    return (
        <EmptyDisplayCardField message="表示できるカードはまだありません。" />
    );
}
