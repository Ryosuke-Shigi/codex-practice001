import type { CSSProperties } from 'react';

import {
    backgroundTraceConfig,
    type TraceLightSize,
} from './backgroundTraceConfig';
import {
    defaultTracePatternId,
    tracePatterns,
    type TraceCircle,
    type TraceLight,
    type TraceLine,
    type TracePatternId,
    type TraceRoute,
} from './tracePatterns';

type TracePatternProps = {
    patternId?: TracePatternId;
};

type TracePatternSvgProps = {
    className: string;
    pattern: (typeof tracePatterns)[TracePatternId];
};

const lightSizeStyles = {
    sm: {
        trailWidth: 1.75,
    },
    md: {
        trailWidth: 2.1,
    },
    lg: {
        trailWidth: 2.5,
    },
} as const satisfies Record<
    TraceLightSize,
    {
        trailWidth: number;
    }
>;

function timingForLight(light: TraceLight, index: number) {
    const variationOffset = (index % 3) - 1;
    const duration =
        (light.duration *
            (1 + variationOffset * backgroundTraceConfig.lights.speedVariation)) /
        backgroundTraceConfig.lights.speed;

    return {
        delay: -(light.delay + backgroundTraceConfig.lights.autoStartDelay),
        duration,
    };
}

function targetForLight(
    light: TraceLight,
    circles: TraceCircle[],
    lines: TraceLine[],
    routes: TraceRoute[],
) {
    if (light.targetType === 'circle') {
        return circles.find((circle) => circle.key === light.targetKey) ?? null;
    }

    if (light.targetType === 'route') {
        return routes.find((route) => route.key === light.targetKey) ?? null;
    }

    return lines.find((line) => line.key === light.targetKey) ?? null;
}

function lightStyle(light: TraceLight, index: number): CSSProperties {
    const size = lightSizeStyles[light.size ?? backgroundTraceConfig.lights.lightSize];
    const timing = timingForLight(light, index);

    return {
        '--trace-color-delay': `${index * -1.7}s`,
        '--trace-color-duration': `${backgroundTraceConfig.lights.colorCycleDuration}s`,
        '--trace-core-length': backgroundTraceConfig.lights.coreLength * 100,
        '--trace-delay': `${timing.delay}s`,
        '--trace-duration': `${timing.duration}s`,
        '--trace-offset-end': `${-backgroundTraceConfig.lights.trailLength * 100}`,
        '--trace-offset-start': `${100 + backgroundTraceConfig.lights.trailLength * 100}`,
        '--trace-glow-width': size.trailWidth * 1.35,
        '--trace-trail-gap': 180,
        '--trace-trail-length': backgroundTraceConfig.lights.trailLength * 100,
        '--trace-trail-width': size.trailWidth,
    } as CSSProperties;
}

function renderCircleRings(circle: TraceCircle) {
    return Array.from({ length: circle.rings }, (_, index) => {
        const radius = circle.r + index * backgroundTraceConfig.pattern.circleRingGap;

        return (
            <circle
                key={`${circle.key}-${radius}`}
                className="background-trace-effect__circle"
                cx={circle.cx}
                cy={circle.cy}
                r={radius}
                pathLength={1}
            />
        );
    });
}

function renderLightTarget(
    light: TraceLight,
    target: TraceCircle | TraceLine | TraceRoute,
    index: number,
) {
    const directionClass =
        light.direction === 'reverse'
            ? 'background-trace-effect__light--reverse'
            : '';
    const className = `background-trace-effect__light ${directionClass}`;

    return (
        <g key={light.id} className={className} style={lightStyle(light, index)}>
            {'r' in target ? (
                <>
                    <circle
                        className="background-trace-effect__light-trail background-trace-effect__light-trail--glow"
                        cx={target.cx}
                        cy={target.cy}
                        r={
                            target.r +
                            Math.min(light.ringIndex ?? 0, target.rings - 1) *
                                backgroundTraceConfig.pattern.circleRingGap
                        }
                        pathLength={100}
                    />
                    <circle
                        className="background-trace-effect__light-trail background-trace-effect__light-trail--core"
                        cx={target.cx}
                        cy={target.cy}
                        r={
                            target.r +
                            Math.min(light.ringIndex ?? 0, target.rings - 1) *
                                backgroundTraceConfig.pattern.circleRingGap
                        }
                        pathLength={100}
                    />
                </>
            ) : 'd' in target ? (
                <>
                    <path
                        className="background-trace-effect__light-trail background-trace-effect__light-trail--glow"
                        d={target.d}
                        pathLength={100}
                    />
                    <path
                        className="background-trace-effect__light-trail background-trace-effect__light-trail--core"
                        d={target.d}
                        pathLength={100}
                    />
                </>
            ) : (
                <>
                    <line
                        className="background-trace-effect__light-trail background-trace-effect__light-trail--glow"
                        x1={target.x1}
                        y1={target.y1}
                        x2={target.x2}
                        y2={target.y2}
                        pathLength={100}
                    />
                    <line
                        className="background-trace-effect__light-trail background-trace-effect__light-trail--core"
                        x1={target.x1}
                        y1={target.y1}
                        x2={target.x2}
                        y2={target.y2}
                        pathLength={100}
                    />
                </>
            )}
        </g>
    );
}

function TracePatternSvg({ className, pattern }: TracePatternSvgProps) {
    const activeLights = pattern.lights.slice(0, backgroundTraceConfig.lights.count);

    return (
        <svg
            aria-hidden="true"
            className={className}
            preserveAspectRatio="xMidYMid slice"
            viewBox={pattern.viewBox}
        >
            <g
                className="background-trace-effect__base"
                style={
                    {
                        '--trace-circle-opacity':
                            backgroundTraceConfig.pattern.circleOpacity,
                        '--trace-line-opacity':
                            backgroundTraceConfig.pattern.lineOpacity,
                    } as CSSProperties
                }
            >
                {pattern.lines.map((line) => (
                    <line
                        key={line.key}
                        className="background-trace-effect__line"
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                    />
                ))}
                {pattern.circles.flatMap(renderCircleRings)}
            </g>

            <g className="background-trace-effect__lights">
                {activeLights.map((light, index) => {
                    const target = targetForLight(
                        light,
                        pattern.circles,
                        pattern.lines,
                        pattern.routes,
                    );

                    return target === null
                        ? null
                        : renderLightTarget(light, target, index);
                })}
            </g>
        </svg>
    );
}

export default function TracePattern({
    patternId = defaultTracePatternId,
}: TracePatternProps) {
    const pattern = tracePatterns[patternId] ?? tracePatterns[defaultTracePatternId];
    const mobilePattern = tracePatterns['dance-radar-mobile'];

    return (
        <>
            <TracePatternSvg
                pattern={pattern}
                className="background-trace-effect__pattern background-trace-effect__pattern--desktop"
            />
            <TracePatternSvg
                pattern={mobilePattern}
                className="background-trace-effect__pattern background-trace-effect__pattern--mobile"
            />
        </>
    );
}
