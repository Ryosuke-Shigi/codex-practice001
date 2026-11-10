import {
    createElement,
    type HTMLAttributes,
    type ReactNode,
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
    children: ReactNode;
};

/**
 * ページ内の文字を単一の可視テキストとして描画します。
 * 演出は親の図や短いラベルに任せ、本文の表示を遅らせません。
 */
export default function RpgText({
    as = 'span',
    children,
    ...attributes
}: RpgTextProps) {
    return createElement(
        as,
        {
            ...attributes,
            'data-rpg-text': true,
        },
        <span data-rpg-semantic>{children}</span>,
    );
}
