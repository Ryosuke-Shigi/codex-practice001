import {
    createElement,
    type CSSProperties,
    type HTMLAttributes,
} from 'react';

type RpgElement =
    | 'span'
    | 'p'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'strong'
    | 'small'
    | 'dt'
    | 'dd';

type RpgTextProps = HTMLAttributes<HTMLElement> & {
    as?: RpgElement;
    children: string;
};

type RpgCharStyle = CSSProperties & {
    '--dp-rpg-char-delay': string;
};

/**
 * Keeps one complete semantic string while the aria-hidden visual copy reveals
 * glyph by glyph. Hidden glyphs retain their inline space, so motion cannot
 * change the surrounding layout.
 */
export default function RpgText({
    as = 'span',
    children,
    ...attributes
}: RpgTextProps) {
    const characters = Array.from(children);
    const characterDelay = Math.min(
        24,
        Math.max(5, Math.floor(780 / Math.max(characters.length, 1))),
    );

    return createElement(
        as,
        {
            ...attributes,
            'data-rpg-text': true,
        },
        <span className="dp-visually-hidden" data-rpg-semantic>
            {children}
        </span>,
        <span aria-hidden="true" data-rpg-visual>
            {characters.map((character, index) => (
                <span
                    key={`${index}-${character}`}
                    className="dp-rpg-char"
                    style={
                        {
                            '--dp-rpg-char-delay': `${index * characterDelay}ms`,
                        } as RpgCharStyle
                    }
                >
                    {character}
                </span>
            ))}
        </span>,
    );
}
