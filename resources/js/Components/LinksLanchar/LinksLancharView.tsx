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
import LinksLancharBackground from './LinksLancharBackground';
import type { LinksLancharPageProps } from './types';
import useLinksLancharNavigation from './useLinksLancharNavigation';

import './linksLanchar.css';

export default function LinksLancharView(props: LinksLancharPageProps) {
    const { linksLanchar } = props;
    const {
        canGoBack, canSwitch, isNavigating, next, openSelected, previous, select, selected,
    } = useLinksLancharNavigation(props);
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
    }, [selectedKey, linksLanchar.linksLancharKey]);

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
        '--links-lanchar-background': display?.backgroundColor,
        '--links-lanchar-accent': display?.accentColor,
        '--links-lanchar-text': display?.textColor,
    } as CSSProperties;

    return (
        <main className="links-lanchar-page" style={theme}>
            {display && <LinksLancharBackground display={display} reducedMotion={reducedMotion} />}

            {(canGoBack || linksLanchar.title !== null || linksLanchar.description !== null) && (
                <header className="links-lanchar-header">
                    {canGoBack && (
                        <button
                            className="links-lanchar-back"
                            type="button"
                            onClick={() => window.history.back()}
                        >
                            戻る
                        </button>
                    )}
                    {linksLanchar.title !== null && <h1>{linksLanchar.title}</h1>}
                    {linksLanchar.description !== null && <p>{linksLanchar.description}</p>}
                </header>
            )}

            {selected === null ? (
                <p className="links-lanchar-empty">表示できるリンクはありません</p>
            ) : (
                <>
                    <div className="links-lanchar-stage" role="group" aria-label="リンクの選択">
                        {previous && (
                            <div className="links-lanchar-neighbor links-lanchar-neighbor--previous" aria-hidden="true">
                                <LinkSelectionVisual display={previous.displayValues} reducedMotion={reducedMotion} preview />
                            </div>
                        )}
                        {canSwitch && (
                            <button
                                className="links-lanchar-arrow links-lanchar-arrow--previous"
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
                            className={'links-lanchar-selection links-lanchar-selection--'
                                + selected.displayValues.selectionDisplayType}
                            type="button"
                            aria-label={selected.displayValues.title}
                            aria-disabled={selected.destinationUrl === null || isNavigating}
                            onClick={openSelected}
                        >
                            <LinkSelectionVisual display={selected.displayValues} reducedMotion={reducedMotion} />
                        </button>
                        {next && (
                            <div className="links-lanchar-neighbor links-lanchar-neighbor--next" aria-hidden="true">
                                <LinkSelectionVisual display={next.displayValues} reducedMotion={reducedMotion} preview />
                            </div>
                        )}
                        {canSwitch && (
                            <button
                                className="links-lanchar-arrow links-lanchar-arrow--next"
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
