import type { CSSProperties } from 'react';

/*
 * AquaParticles is intentionally more energetic than the other water effects.
 * Water/Caustics/Shimmer read as surfaces; this one reads as illuminated matter
 * moving through the scene. The effect stays CSS-only so it remains cheap,
 * portable, and compatible with the shared decorative EffectLayer contract.
 */
export default function AquaParticlesBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(125,211,252,0.46),rgba(255,255,255,0)_30%),linear-gradient(150deg,rgba(6,182,212,0.32)_0%,rgba(20,184,166,0.28)_34%,rgba(14,116,144,0.34)_58%,rgba(2,6,23,0.72)_100%)]">
            <style>
                {`
                    @keyframes portfolio-aqua-particle-rise {
                        0% {
                            opacity: 0;
                            transform: translate3d(0, 34%, 0) scale(0.62);
                        }
                        12% {
                            opacity: 0.95;
                        }
                        64% {
                            opacity: 0.76;
                        }
                        100% {
                            opacity: 0;
                            transform: translate3d(var(--particle-drift), -122%, 0) scale(1.34);
                        }
                    }

                    @keyframes portfolio-aqua-particle-stream {
                        0% {
                            background-position: 0% 0%;
                            transform: translate3d(-9%, 8%, 0) rotate(-11deg);
                        }
                        100% {
                            background-position: 210% -140%;
                            transform: translate3d(9%, -8%, 0) rotate(-11deg);
                        }
                    }

                    @keyframes portfolio-aqua-particle-sheen {
                        0%,
                        100% {
                            opacity: 0.3;
                            transform: translate3d(-10%, 0, 0) scale(1);
                        }
                        50% {
                            opacity: 0.64;
                            transform: translate3d(10%, -3%, 0) scale(1.05);
                        }
                    }
                `}
            </style>

            {/*
                The stream layer gives the effect an immediate visual signature.
                Individual particles rise below, but this tiled diagonal field
                makes the selected effect look different as soon as it fades in.
            */}
            <div
                className="absolute inset-[-28%] opacity-80 mix-blend-screen blur-[0.2px]"
                style={{
                    animation: 'portfolio-aqua-particle-stream 8s linear infinite',
                    background:
                        'radial-gradient(circle, rgba(255,255,255,0.82) 0 2px, rgba(255,255,255,0) 3px), radial-gradient(circle, rgba(103,232,249,0.74) 0 3px, rgba(255,255,255,0) 4px), radial-gradient(circle, rgba(45,212,191,0.62) 0 2px, rgba(255,255,255,0) 3px)',
                    backgroundPosition: '0% 0%, 16% 24%, 32% 8%',
                    backgroundSize: '92px 92px, 128px 128px, 156px 156px',
                }}
            />

            {/*
                Particles use deterministic positions instead of Math.random().
                That keeps server/client render output stable while still
                producing a scattered, organic-looking field.
            */}
            {Array.from({ length: 34 }, (_, index) => {
                const left = 4 + ((index * 13) % 92);
                const size = 10 + (index % 6) * 6;
                const duration = 4.8 + (index % 7) * 0.52;
                const delay = -(index * 0.34);
                const drift = `${index % 2 === 0 ? '' : '-'}${18 + (index % 5) * 8}vw`;

                return (
                    <span
                        key={index}
                        aria-hidden="true"
                        className="absolute bottom-[-18%] rounded-full border border-white/45 bg-cyan-50/80 shadow-[0_0_26px_rgba(103,232,249,0.76),0_0_52px_rgba(20,184,166,0.34)]"
                        style={{
                            animation: `portfolio-aqua-particle-rise ${duration}s ease-in-out ${delay}s infinite`,
                            height: size,
                            left: `${left}%`,
                            width: size,
                            /*
                             * A custom property lets each particle share the
                             * same keyframes while drifting by a different
                             * horizontal amount.
                             */
                            '--particle-drift': drift,
                        } as CSSProperties}
                    />
                );
            })}

            {/*
                The sheen layer is separate from the particles so brightness can
                pulse without forcing every particle to change opacity together.
            */}
            <div
                className="absolute inset-[-12%] opacity-70 mix-blend-screen"
                style={{
                    animation: 'portfolio-aqua-particle-sheen 6.5s ease-in-out infinite',
                    background:
                        'radial-gradient(circle at 26% 34%, rgba(255,255,255,0.62), rgba(255,255,255,0) 26%), radial-gradient(circle at 74% 24%, rgba(153,246,228,0.54), rgba(255,255,255,0) 30%), radial-gradient(circle at 54% 72%, rgba(125,211,252,0.52), rgba(255,255,255,0) 32%)',
                }}
            />
        </div>
    );
}
