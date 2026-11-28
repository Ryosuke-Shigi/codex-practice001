import type { ReactNode } from 'react';

export function StrategySwapIllustration() {
    return (
        <svg className="dp-swap-scene" viewBox="0 0 300 94" aria-hidden="true" focusable="false">
            <path className="dp-swap-base" d="M10 81h280" />
            <rect className="dp-swap-neighbor" x="18" y="39" width="74" height="36" rx="4" />
            <rect className="dp-swap-neighbor" x="208" y="39" width="74" height="36" rx="4" />
            <path className="dp-swap-neighbor-detail" d="M38 57h32m159 0h32" />
            <rect className="dp-swap-slot" x="111" y="39" width="78" height="36" rx="4" />
            <g className="dp-swap-outgoing">
                <rect x="118" y="45" width="64" height="24" rx="4" />
                <path d="M135 58l7-6 7 6 7-6 7 6" />
            </g>
            <g className="dp-swap-incoming">
                <path d="M118 45h52l12 12-12 12h-52z" />
                <path d="M136 62l9-10 8 8 8-8" />
            </g>
        </svg>
    );
}

export type DevelopmentStageDrawing = 'idea' | 'mock' | 'prototype' | 'product';

const stageDrawings = {
    idea: (
        <>
            <path d="M27 12h35l9 9v25H27zM62 12v9h9M34 36h28m-28 5h20" />
            <path className="dp-stage-trace" pathLength="1" d="M35 30c1-6 10-8 16-3l4-5 7 8" />
            <path d="m69 36 8-8 3 3-8 8-5 2z" />
        </>
    ),
    mock: (
        <>
            <rect x="23" y="10" width="50" height="38" rx="3" />
            <path d="M23 17h50m-43 6h36v8H30z" />
            <path className="dp-stage-trace" pathLength="1" d="M30 35h15v7H30zm21 0h15v7H51z" />
        </>
    ),
    prototype: (
        <>
            <rect x="13" y="12" width="27" height="29" rx="3" />
            <rect x="58" y="18" width="27" height="29" rx="3" />
            <path d="M13 18h27m18 6h27M19 24h15m-15 5h11m34 1h15m-15 5h11" />
            <path className="dp-stage-trace" pathLength="1" d="M40 29h8v8h10m-4-4 4 4-4 4" />
        </>
    ),
    product: (
        <>
            <rect x="19" y="9" width="60" height="41" rx="4" />
            <path d="M19 17h60M27 13h1m4 0h1m4 0h1" />
            <path className="dp-stage-trace" pathLength="1" d="M26 23h17v20H26zm23 0h23v8H49zm0 14h15m-15 6h19" />
            <path d="m67 36 3 3 5-6" />
        </>
    ),
} as const satisfies Record<DevelopmentStageDrawing, ReactNode>;

export function DevelopmentStageIllustration({ drawing }: { drawing: DevelopmentStageDrawing }) {
    return (
        <svg className="dp-stage-drawing" viewBox="0 0 98 57" aria-hidden="true" focusable="false">
            {stageDrawings[drawing]}
        </svg>
    );
}
