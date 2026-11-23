import { Link as LinkIcon } from 'lucide-react';
import { DynamicIcon, iconNames, type IconName } from 'lucide-react/dynamic';
import type { CSSProperties } from 'react';

import type { LinkDisplayValues } from './types';

const supportedIconNames: ReadonlySet<string> = new Set(iconNames);

function isIconName(name: string): name is IconName {
    return supportedIconNames.has(name);
}

function SphereIcon({ display }: { display: LinkDisplayValues }) {
    if (display.iconImageSource !== null) {
        return <img className="links-launcher-sphere-icon" src={display.iconImageSource} alt="" />;
    }

    const name = display.lucideIconName
        ?.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([a-z])(\d)/g, '$1-$2')
        .toLowerCase();

    if (!name || name === 'link' || !isIconName(name)) {
        return <LinkIcon aria-hidden="true" size="38%" strokeWidth={1.8} />;
    }

    return (
        <DynamicIcon
            key={name}
            name={name}
            aria-hidden="true"
            size="38%"
            strokeWidth={1.8}
            fallback={() => <LinkIcon aria-hidden="true" size="38%" strokeWidth={1.8} />}
        />
    );
}

export default function LinkSelectionVisual({
    display,
    reducedMotion,
    preview = false,
}: {
    display: LinkDisplayValues;
    reducedMotion: boolean;
    preview?: boolean;
}) {
    if (display.selectionDisplayType === 'image') {
        const poster = display.selectionImagePosterSource;
        const source = reducedMotion ? poster : (preview ? poster : null) ?? display.selectionImageSource;

        return source === null
            ? <span className="links-launcher-visual-label">{display.title}</span>
            : <img className="links-launcher-selection-image" src={source} alt="" />;
    }

    const style = {
        '--links-launcher-sphere': display.sphereColor ?? undefined,
        '--links-launcher-shadow': display.sphereShadowColor ?? undefined,
    } as CSSProperties;

    return (
        <span className="links-launcher-sphere" aria-hidden="true" style={style}>
            <SphereIcon display={display} />
        </span>
    );
}
