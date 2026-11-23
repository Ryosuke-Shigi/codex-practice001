import { useEffect, useState } from 'react';

import type { LinkDisplayValues } from './types';

export default function LinkDescription({
    display,
    reducedMotion,
}: {
    display: LinkDisplayValues;
    reducedMotion: boolean;
}) {
    const [characterCount, setCharacterCount] = useState(0);
    const description = display.description;

    useEffect(() => {
        if (description === null || reducedMotion) {
            return;
        }

        let nextCount = 0;
        const timer = window.setInterval(() => {
            nextCount += 1;
            setCharacterCount(nextCount);
            if (nextCount >= description.length) {
                window.clearInterval(timer);
            }
        }, 24);

        return () => window.clearInterval(timer);
    }, [description, reducedMotion]);

    return (
        <aside className="links-launcher-message">
            <h2>{display.title}</h2>
            {description !== null && (
                <>
                    <p className="sr-only">{description}</p>
                    <p aria-hidden="true">
                        {reducedMotion ? description : description.slice(0, characterCount)}
                    </p>
                </>
            )}
        </aside>
    );
}
