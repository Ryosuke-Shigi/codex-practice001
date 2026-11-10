/** 採用モックの和紙の図。技術的なノードと説明は既存の責務図で示します。 */
export default function HeroEvidenceIllustration() {
    return (
        <svg
            className="dp-hero-illustration"
            viewBox="0 0 460 355"
            role="img"
            aria-label="和紙に記した意図から実行と検証の記録を経て、人間の朱印へ戻る"
            data-scroll-reveal
        >
            <rect className="dp-hero-illustration__paper" x="8" y="8" width="444" height="338" />
            <circle cx="230" cy="172" r="139" fill="none" stroke="currentColor" strokeOpacity=".23" />
            <path
                className="dp-hero-illustration__trace"
                d="M230 120V159H117V210M230 159H343V210M117 275V305H343V275"
                pathLength="1"
            />
            <g transform="translate(147 39) rotate(-7 83 44)">
                <rect className="dp-hero-illustration__sheet" width="166" height="93" />
                <path d="M18 30H148M18 48H127M18 66H137" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <path className="dp-hero-illustration__red" d="M18 18H51" strokeWidth="3" />
            </g>
            <g transform="translate(54 196) rotate(5 63 41)">
                <rect className="dp-hero-illustration__sheet" width="126" height="85" />
                <path d="M18 21H44V43H77V65H108" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="18" cy="21" r="4" fill="currentColor" />
                <circle cx="108" cy="65" r="4" fill="currentColor" />
            </g>
            <g transform="translate(280 196) rotate(-5 63 41)">
                <rect className="dp-hero-illustration__sheet" width="126" height="85" />
                <path d="M39 22H107M39 43H107M39 64H98" fill="none" stroke="currentColor" strokeOpacity=".65" />
                <path d="m16 22 4 4 8-10m-12 27 4 4 8-10m-12 27 4 4 8-10" fill="none" stroke="currentColor" strokeWidth="1.7" />
            </g>
            <g className="dp-hero-illustration__seal dp-hero-illustration__red">
                <rect className="dp-hero-illustration__paper" x="205" y="283" width="50" height="45" rx="2" strokeWidth="2.5" />
                <rect x="210" y="288" width="40" height="35" rx="1" fill="none" />
                <path d="m220 305 7 7 15-15" fill="none" strokeWidth="2.7" />
            </g>
        </svg>
    );
}
