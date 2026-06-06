import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import DanceShortsThumbnailLink from './DanceShortsThumbnailLink';

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
});
