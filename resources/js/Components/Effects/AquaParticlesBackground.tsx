/**
 * 水面粒子風の背景演出 Component です。
 *
 * CSS / DOM 演出だけを担当し、Page props や機能データには依存しません。
 */
import type { CSSProperties } from 'react';

/*
 * AquaParticles は水中を漂う光粒として見せつつ、背景群の中で最も重い実装にならないようにします。
 * particle field は sparse かつ CSS-only にして、EffectLayer の装飾専用契約に合わせます。
 */
export default function AquaParticlesBackground() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(125,211,252,0.46),rgba(255,255,255,0)_30%),linear-gradient(150deg,rgba(6,182,212,0.32)_0%,rgba(20,184,166,0.28)_34%,rgba(14,116,144,0.34)_58%,rgba(2,6,23,0.72)_100%)]"
        >
            {/*
                particle の移動量は percentage ではなく vh で指定します。
                percentage transform は各粒子自身の box 基準になるため、画面下部で詰まって見えることがあります。
            */}
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
                        36% {
                            transform: translate3d(var(--particle-sway), -34vh, 0) scale(0.9);
                        }
                        64% {
                            opacity: 0.76;
                            transform: translate3d(var(--particle-return-sway), -76vh, 0) scale(1.12);
                        }
                        100% {
                            opacity: 0;
                            transform: translate3d(0, -122vh, 0) scale(1.34);
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

                    @media (prefers-reduced-motion: reduce) {
                        .portfolio-aqua-particle,
                        .portfolio-aqua-particle-sheen {
                            animation: none !important;
                        }
                    }
                `}
            </style>

            {/*
                particle 位置は Math.random() ではなく決定的に作ります。
                server / client の render 差分を避けつつ、散らばった見た目を作るためです。
                光る shadow がこの effect の主な負荷なので、粒子数は意図的に抑えます。
            */}
            {Array.from({ length: 16 }, (_, index) => {
                const left = 8 + ((index * 19) % 84);
                const size = 10 + (index % 6) * 6;
                const duration = 6.8 + (index % 6) * 0.72;
                const delay = -(index * 0.56);
                /*
                 * 横揺れは控えめにします。
                 * タイトル全体を流す水流ではなく、粒子が浮き上がる揺らぎとして見せるためです。
                 */
                const swayValue = 4 + (index % 4) * 1.4;
                const sway = `${index % 2 === 0 ? '' : '-'}${swayValue}vw`;
                const returnSway = `${index % 2 === 0 ? '-' : ''}${swayValue}vw`;

                return (
                    <span
                        key={index}
                        aria-hidden="true"
                        className="portfolio-aqua-particle absolute bottom-[-18%] rounded-full border border-white/45 bg-cyan-50/80 shadow-[0_0_26px_rgba(103,232,249,0.76),0_0_52px_rgba(20,184,166,0.34)]"
                        style={{
                            animation: `portfolio-aqua-particle-rise ${duration}s ease-in-out ${delay}s infinite`,
                            height: size,
                            left: `${left}%`,
                            width: size,
                            /*
                             * custom property により、同じ keyframes を共有しながら粒子ごとに小さく横揺れさせます。
                             */
                            '--particle-sway': sway,
                            '--particle-return-sway': returnSway,
                        } as CSSProperties}
                    />
                );
            })}

            {/*
                sheen layer は particle と分け、全粒子の opacity を同時に変えずに明るさだけを pulse させます。
            */}
            <div
                className="portfolio-aqua-particle-sheen absolute inset-[-12%] opacity-[0.42] mix-blend-screen"
                style={{
                    animation: 'portfolio-aqua-particle-sheen 8s ease-in-out infinite',
                    background:
                        'radial-gradient(circle at 26% 34%, rgba(255,255,255,0.62), rgba(255,255,255,0) 26%), radial-gradient(circle at 74% 24%, rgba(153,246,228,0.54), rgba(255,255,255,0) 30%), radial-gradient(circle at 54% 72%, rgba(125,211,252,0.52), rgba(255,255,255,0) 32%)',
                }}
            />
        </div>
    );
}
