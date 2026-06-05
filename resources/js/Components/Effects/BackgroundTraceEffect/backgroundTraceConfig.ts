export type TraceLightSize = 'sm' | 'md' | 'lg';

export const backgroundTraceConfig = {
    lights: {
        count: 3,
        speed: 1.08,
        speedVariation: 0.06,
        colorCycleDuration: 9,
        trailLength: 0.22,
        coreLength: 0.07,
        autoStartDelay: 0.2,
        lightSize: 'md',
    },
    pattern: {
        circleRingGap: 9,
        lineOpacity: 0.028,
        circleOpacity: 0.04,
    },
} as const satisfies {
    lights: {
        count: number;
        speed: number;
        speedVariation: number;
        colorCycleDuration: number;
        trailLength: number;
        coreLength: number;
        autoStartDelay: number;
        lightSize: TraceLightSize;
    };
    pattern: {
        circleRingGap: number;
        lineOpacity: number;
        circleOpacity: number;
    };
};
