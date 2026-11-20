import type { CSSProperties } from 'react';

/** 全文と文字幅を保ち、短いインクの濃淡で文字を描き出します。 */
export default function PhilosophyInkText({ text }: { text: string }) {
    let order = 0;
    return <span className="dp-ink-text" data-ink-text aria-label={text}>
        {text.split(/(AIとつくる。|品質は、|仕組みで|確かめる。)/u).filter(Boolean).map((word, index) => (
            <span className={word.length <= 8 ? 'dp-ink-word' : undefined} key={index}>
                {Array.from(word).map((letter, offset) => <span className="dp-ink-letter" key={offset} style={{ '--ink-order': Math.min(order++, 32) } as CSSProperties}>{letter}</span>)}
            </span>
        ))}
    </span>;
}
