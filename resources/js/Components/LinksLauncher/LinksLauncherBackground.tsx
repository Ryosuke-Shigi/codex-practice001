import { lazy, Suspense } from 'react';

import type { LinkDisplayValues } from './types';

const LinksLauncherEffect = lazy(() => import('./LinksLauncherEffect'));

export default function LinksLauncherBackground({
    display,
    reducedMotion,
}: {
    display: LinkDisplayValues;
    reducedMotion: boolean;
}) {
    const image = reducedMotion ? display.backgroundImagePosterSource : display.backgroundImageSource;

    return (
        <div className="links-launcher-backdrop" aria-hidden="true">
            {image !== null && (
                <img
                    key={image}
                    className={display.backgroundImageEntranceAnimationName === 'slide-in-top'
                        ? 'links-launcher-background-image links-launcher-background-image--slide-in'
                        : 'links-launcher-background-image links-launcher-background-image--fade-in'}
                    src={image}
                    alt=""
                />
            )}
            {!reducedMotion && display.backgroundEffectName !== null && (
                <Suspense fallback={null}>
                    <LinksLauncherEffect name={display.backgroundEffectName} />
                </Suspense>
            )}
        </div>
    );
}
