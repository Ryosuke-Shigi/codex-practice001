import { useEffect, useRef, useState } from 'react';

export type BouncingOrbPosition = {
    x: number;
    y: number;
    size: number;
};

type MovingOrb = BouncingOrbPosition & {
    vx: number;
    vy: number;
};

type UseBouncingOrbsOptions = {
    count: number;
    disabled?: boolean;
    paddingPercent?: number;
};

const initialOrbSeeds = [
    { x: 20, y: 34, vx: 5.4, vy: 4.1 },
    { x: 78, y: 36, vx: -4.8, vy: 4.9 },
    { x: 30, y: 70, vx: 4.5, vy: -4.7 },
    { x: 82, y: 68, vx: -5.2, vy: -3.8 },
    { x: 54, y: 54, vx: 4.9, vy: -4.2 },
];

const defaultOrbSize = 108;

/*
 * orb の中心座標は viewport percentage として扱います。
 * Welcome 画面の実 pixel サイズに依存せず動かしつつ、各 render では円形 button 用の pixel size も返します。
 */
function resolveOrbSize() {
    if (typeof window === 'undefined') {
        return defaultOrbSize;
    }

    if (window.innerWidth < 480) {
        return 78;
    }

    if (window.innerWidth < 768) {
        return 88;
    }

    return 112;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function buildInitialOrbs(count: number, size: number): MovingOrb[] {
    return Array.from({ length: count }, (_, index) => {
        const seed = initialOrbSeeds[index] ?? {
            x: 20 + ((index * 19) % 60),
            y: 34 + ((index * 17) % 42),
            vx: index % 2 === 0 ? 2.4 : -2.4,
            vy: index % 3 === 0 ? 2.1 : -2.1,
        };

        return {
            ...seed,
            size,
        };
    });
}

function clampToViewport(orb: MovingOrb, paddingPercent: number): MovingOrb {
    if (typeof window === 'undefined') {
        return orb;
    }

    const radiusX = ((orb.size / window.innerWidth) * 100) / 2 + paddingPercent;
    const radiusY = ((orb.size / window.innerHeight) * 100) / 2 + paddingPercent;

    return {
        ...orb,
        x: clamp(orb.x, radiusX, 100 - radiusX),
        y: clamp(orb.y, radiusY, 100 - radiusY),
    };
}

export default function useBouncingOrbs({
    count,
    disabled = false,
    paddingPercent = 2.5,
}: UseBouncingOrbsOptions): BouncingOrbPosition[] {
    const [orbs, setOrbs] = useState<MovingOrb[]>(() => buildInitialOrbs(count, defaultOrbSize));
    const orbsRef = useRef(orbs);

    useEffect(() => {
        /*
         * 同じ pixel size の orb でも、mobile / tablet / desktop では viewport に占める割合が変わります。
         * resize 時に作り直して clamp し、画面外に半分出た状態で生まれないようにします。
         */
        const rebuildOrbs = () => {
            const nextOrbs = buildInitialOrbs(count, resolveOrbSize()).map((orb) =>
                clampToViewport(orb, paddingPercent),
            );

            orbsRef.current = nextOrbs;
            setOrbs(nextOrbs);
        };

        rebuildOrbs();
        window.addEventListener('resize', rebuildOrbs);

        return () => {
            window.removeEventListener('resize', rebuildOrbs);
        };
    }, [count, paddingPercent]);

    useEffect(() => {
        if (disabled || typeof window === 'undefined') {
            return;
        }

        const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

        if (motionPreference.matches) {
            return;
        }

        let frameId: number;
        let previousTimestamp = window.performance.now();

        const tick = (timestamp: number) => {
            /*
             * velocity は1秒あたりの percentage point として扱います。
             * background tab 復帰や端末復帰直後に大きく飛ばないよう delta を上限付きにします。
             */
            const deltaSeconds = Math.min((timestamp - previousTimestamp) / 1000, 0.05);

            previousTimestamp = timestamp;

            const nextOrbs = orbsRef.current.map((orb) => {
                const radiusX = ((orb.size / window.innerWidth) * 100) / 2 + paddingPercent;
                const radiusY = ((orb.size / window.innerHeight) * 100) / 2 + paddingPercent;
                const minX = radiusX;
                const maxX = 100 - radiusX;
                const minY = radiusY;
                const maxY = 100 - radiusY;
                let nextX = orb.x + orb.vx * deltaSeconds;
                let nextY = orb.y + orb.vy * deltaSeconds;
                let nextVx = orb.vx;
                let nextVy = orb.vy;

                if (nextX <= minX || nextX >= maxX) {
                    nextX = clamp(nextX, minX, maxX);
                    nextVx = -nextVx;
                }

                if (nextY <= minY || nextY >= maxY) {
                    nextY = clamp(nextY, minY, maxY);
                    nextVy = -nextVy;
                }

                return {
                    ...orb,
                    x: nextX,
                    y: nextY,
                    vx: nextVx,
                    vy: nextVy,
                };
            });

            orbsRef.current = nextOrbs;
            setOrbs(nextOrbs);
            frameId = window.requestAnimationFrame(tick);
        };

        frameId = window.requestAnimationFrame(tick);

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [disabled, paddingPercent]);

    return orbs.map(({ x, y, size }) => ({ x, y, size }));
}
