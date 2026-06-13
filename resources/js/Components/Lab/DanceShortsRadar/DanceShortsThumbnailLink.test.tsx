/**
 * DanceShortsRadar のサムネイル表示補助とリンク無効化条件を、React表示と純粋関数の両方で固定します。
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import DanceShortsThumbnailLink, {
    areDanceShortsThumbnailDisplayDataEqual,
    createDanceShortsThumbnailDisplayData,
    isDanceShortsThumbnailRequestCurrent,
    shouldDisableDanceShortsThumbnailLink,
    shouldQueueDanceShortsThumbnailLoad,
} from './DanceShortsThumbnailLink';

describe('DanceShortsThumbnailLink', () => {
    it('renders the displayed thumbnail and YouTube link from the same data set', () => {
        const markup = renderToStaticMarkup(
            <DanceShortsThumbnailLink
                title="Current dance"
                thumbnailUrl="https://example.test/current-thumb.jpg"
                youtubeUrl="https://www.youtube.com/shorts/current"
            />,
        );

        expect(markup).toContain(
            'href="https://www.youtube.com/shorts/current"',
        );
        expect(markup).toContain('src="https://example.test/current-thumb.jpg"');
        expect(markup).toContain('alt="Current dance のサムネイル"');
        expect(markup).toContain('transition-opacity');
        expect(markup).not.toContain('bg-slate-900');
        expect(markup).not.toContain('scale-');
        expect(markup).not.toContain('translate');
    });

    it('renders a placeholder when there is no displayed thumbnail source', () => {
        const markup = renderToStaticMarkup(
            <DanceShortsThumbnailLink
                title="Dance thumbnail"
                thumbnailUrl={null}
                youtubeUrl="https://www.youtube.com/shorts/example"
            />,
        );

        expect(markup).toContain('No Thumbnail');
        expect(markup).not.toContain('<img');
    });

    it('queues a new thumbnail only when a different image source must load first', () => {
        const displayedData = createDanceShortsThumbnailDisplayData(
            'Current dance',
            'https://example.test/current-thumb.jpg',
            'https://www.youtube.com/shorts/current',
        );
        const nextData = createDanceShortsThumbnailDisplayData(
            'Next dance',
            'https://example.test/next-thumb.jpg',
            'https://www.youtube.com/shorts/next',
        );
        const sameImageNextLinkData = createDanceShortsThumbnailDisplayData(
            'Next dance',
            'https://example.test/current-thumb.jpg',
            'https://www.youtube.com/shorts/next',
        );
        const noThumbnailData = createDanceShortsThumbnailDisplayData(
            'Next dance',
            null,
            'https://www.youtube.com/shorts/next',
        );

        expect(shouldQueueDanceShortsThumbnailLoad(displayedData, nextData)).toBe(
            true,
        );
        expect(
            shouldQueueDanceShortsThumbnailLoad(
                displayedData,
                sameImageNextLinkData,
            ),
        ).toBe(false);
        expect(
            shouldQueueDanceShortsThumbnailLoad(displayedData, noThumbnailData),
        ).toBe(false);
    });

    it('commits a pending thumbnail only when it is still the current request', () => {
        const oldData = createDanceShortsThumbnailDisplayData(
            'Old dance',
            'https://example.test/old-thumb.jpg',
            'https://www.youtube.com/shorts/old',
        );
        const nextData = createDanceShortsThumbnailDisplayData(
            'Next dance',
            'https://example.test/next-thumb.jpg',
            'https://www.youtube.com/shorts/next',
        );
        const newerData = createDanceShortsThumbnailDisplayData(
            'Newer dance',
            'https://example.test/newer-thumb.jpg',
            'https://www.youtube.com/shorts/newer',
        );

        expect(
            areDanceShortsThumbnailDisplayDataEqual(nextData, {
                ...nextData,
            }),
        ).toBe(true);
        expect(
            isDanceShortsThumbnailRequestCurrent(nextData, nextData, nextData),
        ).toBe(true);
        expect(
            isDanceShortsThumbnailRequestCurrent(nextData, newerData, nextData),
        ).toBe(false);
        expect(
            isDanceShortsThumbnailRequestCurrent(nextData, nextData, oldData),
        ).toBe(false);
        expect(
            isDanceShortsThumbnailRequestCurrent(null, nextData, nextData),
        ).toBe(false);
    });

    it('disables link operation while a loaded thumbnail is cross fading', () => {
        const nextData = createDanceShortsThumbnailDisplayData(
            'Next dance',
            'https://example.test/next-thumb.jpg',
            'https://www.youtube.com/shorts/next',
        );

        expect(shouldDisableDanceShortsThumbnailLink(nextData)).toBe(true);
        expect(shouldDisableDanceShortsThumbnailLink(null)).toBe(false);
    });
});
