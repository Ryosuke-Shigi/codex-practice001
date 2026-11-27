import { useEffect, useState, type TouchEvent } from 'react';

import type { LinkDisplayValues } from './types';

function keepTouchInDescription(event: TouchEvent<HTMLElement>) {
    event.stopPropagation();
}

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
        <div className="links-launcher-description-layer">
            <section
                aria-label="選択中のリンクの説明"
                className="links-launcher-message"
                tabIndex={0}
                onTouchStart={keepTouchInDescription}
                onTouchEnd={keepTouchInDescription}
            >
                <h2>{display.title}</h2>
                {description !== null && (
                    <>
                        <p className="sr-only">{description}</p>
                        <p aria-hidden="true">
                            {reducedMotion ? description : description.slice(0, characterCount)}
                        </p>
                    </>
                )}
            </section>
        </div>
    );
}
