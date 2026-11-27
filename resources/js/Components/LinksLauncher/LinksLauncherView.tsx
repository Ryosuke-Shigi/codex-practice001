import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    type CSSProperties,
} from 'react';

import usePrefersReducedMotion from '@/Hooks/usePrefersReducedMotion';
import useSwipeNavigation from '@/Hooks/useSwipeNavigation';

import LinkDescription from './LinkDescription';
import LinkSelectionVisual from './LinkSelectionVisual';
import LinksLauncherBackground from './LinksLauncherBackground';
import type { LinksLauncherPageProps } from './types';
import useLinksLauncherNavigation from './useLinksLauncherNavigation';

import './linksLauncher.css';

export default function LinksLauncherView(props: LinksLauncherPageProps) {
    const { linksLauncher } = props;
    const {
        canSwitch, isNavigating, next, openSelected, previous, select, selected, showHistoryBack,
    } = useLinksLauncherNavigation(props);
    const reducedMotion = usePrefersReducedMotion();
    const selectionButton = useRef<HTMLButtonElement>(null);
    const selectedKey = selected?.linkKey;
    const selectPrevious = useCallback(() => select(-1), [select]);
    const selectNext = useCallback(() => select(1), [select]);

    useSwipeNavigation({
        onSwipeLeft: selectNext,
        onSwipeRight: selectPrevious,
        disabled: !canSwitch || isNavigating,
    });

    useLayoutEffect(() => {
        if (selectedKey !== undefined) {
            selectionButton.current?.focus({ preventScroll: true });
        }
    }, [selectedKey, linksLauncher.linksLauncherKey]);

    useEffect(() => {
        if (!canSwitch) {
            return;
        }

        const onArrow = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey
                || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) {
                return;
            }

            if (event.target instanceof Element
                && event.target !== selectionButton.current
                && event.target.closest('a, button, input, textarea, select, [contenteditable="true"]') !== null) {
                return;
            }

            event.preventDefault();
            select(event.key === 'ArrowLeft' ? -1 : 1);
        };

        window.addEventListener('keydown', onArrow);
        return () => window.removeEventListener('keydown', onArrow);
    }, [canSwitch, select]);

    const display = selected?.displayValues;
    const theme = {
        '--links-launcher-background': display?.backgroundColor,
        '--links-launcher-accent': display?.accentColor,
        '--links-launcher-text': display?.textColor,
    } as CSSProperties;

    return (
        <main className="links-launcher-page" style={theme}>
            {display && <LinksLauncherBackground display={display} reducedMotion={reducedMotion} />}

            <header className="links-launcher-header">
                <Link className="links-launcher-top" href={props.navigation.topUrl}>
                    TOPへ
                </Link>
                {showHistoryBack && (
                    <button
                        className="links-launcher-back"
                        type="button"
                        onClick={() => window.history.back()}
                    >
                        戻る
                    </button>
                )}
                {linksLauncher.title !== null && <h1>{linksLauncher.title}</h1>}
                {linksLauncher.description !== null && <p>{linksLauncher.description}</p>}
            </header>

            {selected === null ? (
                <p className="links-launcher-empty">表示できるリンクはありません</p>
            ) : (
                <>
                    <div
                        className={'links-launcher-stage'
                            + (selected.displayValues.selectionDisplayType === 'image' ? ' links-launcher-stage--image' : '')}
                        role="group"
                        aria-label="リンクの選択"
                    >
                        {previous && (
                            <div className="links-launcher-neighbor links-launcher-neighbor--previous" aria-hidden="true">
                                <LinkSelectionVisual display={previous.displayValues} reducedMotion={reducedMotion} preview />
                            </div>
                        )}
                        {canSwitch && (
                            <button
                                className="links-launcher-arrow links-launcher-arrow--previous"
                                type="button"
                                aria-label="前のリンク"
                                disabled={isNavigating}
                                onClick={selectPrevious}
                            >
                                <ChevronLeft aria-hidden="true" size={24} />
                            </button>
                        )}
                        <button
                            ref={selectionButton}
                            className={'links-launcher-selection links-launcher-selection--'
                                + selected.displayValues.selectionDisplayType}
                            type="button"
                            aria-label={selected.displayValues.title}
                            aria-disabled={selected.destinationUrl === null || isNavigating}
                            onClick={openSelected}
                        >
                            <LinkSelectionVisual display={selected.displayValues} reducedMotion={reducedMotion} />
                        </button>
                        {next && (
                            <div className="links-launcher-neighbor links-launcher-neighbor--next" aria-hidden="true">
                                <LinkSelectionVisual display={next.displayValues} reducedMotion={reducedMotion} preview />
                            </div>
                        )}
                        {canSwitch && (
                            <button
                                className="links-launcher-arrow links-launcher-arrow--next"
                                type="button"
                                aria-label="次のリンク"
                                disabled={isNavigating}
                                onClick={selectNext}
                            >
                                <ChevronRight aria-hidden="true" size={24} />
                            </button>
                        )}
                    </div>
                    <LinkDescription
                        key={selected.linkKey}
                        display={selected.displayValues}
                        reducedMotion={reducedMotion}
                    />
                    <p className="sr-only" aria-live="polite">
                        {selected.displayValues.title} を選択しています。
                    </p>
                </>
            )}
        </main>
    );
}
