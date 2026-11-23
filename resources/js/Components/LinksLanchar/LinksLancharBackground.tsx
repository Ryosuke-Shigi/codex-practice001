import { lazy, Suspense } from 'react';

import type { LinkDisplayValues } from './types';

const LinksLancharEffect = lazy(() => import('./LinksLancharEffect'));

export default function LinksLancharBackground({
    display,
    reducedMotion,
}: {
    display: LinkDisplayValues;
    reducedMotion: boolean;
}) {
    const image = reducedMotion ? display.backgroundImagePosterSource : display.backgroundImageSource;

    return (
        <div className="links-lanchar-backdrop" aria-hidden="true">
            {image !== null && (
                <img
                    key={image}
                    className={display.backgroundImageEntranceAnimationName === 'slide-in-top'
                        ? 'links-lanchar-background-image links-lanchar-background-image--slide-in'
                        : 'links-lanchar-background-image links-lanchar-background-image--fade-in'}
                    src={image}
                    alt=""
                />
            )}
            {!reducedMotion && display.backgroundEffectName !== null && (
                <Suspense fallback={null}>
                    <LinksLancharEffect name={display.backgroundEffectName} />
                </Suspense>
            )}
        </div>
    );
}
