import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import DanceShortsThumbnailLink, {
    initialDanceShortsThumbnailLoadStatus,
    shouldRenderDanceShortsThumbnailImage,
} from './DanceShortsThumbnailLink';

describe('DanceShortsThumbnailLink', () => {
    it('keeps a new thumbnail hidden until load without image transform classes', () => {
        const markup = renderToStaticMarkup(
            <DanceShortsThumbnailLink
                title="Dance thumbnail"
                thumbnailUrl="https://example.test/thumb.jpg"
                youtubeUrl="https://www.youtube.com/shorts/example"
            />,
        );

        expect(markup).toContain('opacity-0');
        expect(markup).toContain('transition-opacity');
        expect(markup).not.toContain('scale-');
        expect(markup).not.toContain('translate');
    });

    it('renders a placeholder when there is no thumbnail source', () => {
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

    it('falls back to placeholder display state after thumbnail load error', () => {
        expect(initialDanceShortsThumbnailLoadStatus(null)).toBe('empty');
        expect(
            initialDanceShortsThumbnailLoadStatus(
                'https://example.test/thumb.jpg',
            ),
        ).toBe('loading');
        expect(
            shouldRenderDanceShortsThumbnailImage(
                'https://example.test/thumb.jpg',
                'loading',
            ),
        ).toBe(true);
        expect(
            shouldRenderDanceShortsThumbnailImage(
                'https://example.test/thumb.jpg',
                'loaded',
            ),
        ).toBe(true);
        expect(
            shouldRenderDanceShortsThumbnailImage(
                'https://example.test/thumb.jpg',
                'error',
            ),
        ).toBe(false);
    });
});
