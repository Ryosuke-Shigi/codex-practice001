export default function SurfaceShimmerBackground() {
    return (
        /*
         * SurfaceShimmer は控えめな反射 layer です。
         * 細い highlight で水面感だけを足し、START button や Lab card の読みやすさを優先します。
         */
        <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(160deg,rgba(216,252,255,0.22)_0%,rgba(108,221,234,0.18)_30%,rgba(12,118,152,0.22)_56%,rgba(4,23,51,0.4)_100%)]">
            {/*
                shimmer layer は UI state transition ではなく連続 texture animation です。
                CSS keyframes に閉じることで、effect 切替や Lab への遷移時に Motion animation が再起動する問題を避けます。
            */}
            <style>
                {`
                    @keyframes portfolio-surface-shimmer-lines {
                        0% {
                            background-position: 0% 50%;
                        }
                        100% {
                            background-position: 160% 54%;
                        }
                    }

                    @keyframes portfolio-surface-shimmer-glow {
                        0%,
                        100% {
                            opacity: 0.18;
                            transform: translate3d(-5%, 0, 0);
                        }
                        50% {
                            opacity: 0.36;
                            transform: translate3d(6%, 0, 0);
                        }
                    }
                `}
            </style>
            <div
                className="absolute inset-[-10%] opacity-45 mix-blend-soft-light"
                style={{
                    animation: 'portfolio-surface-shimmer-lines 18s linear infinite',
                    backgroundImage:
                        'repeating-linear-gradient(96deg, rgba(255,255,255,0.46) 0 1px, rgba(255,255,255,0) 1px 18px), repeating-linear-gradient(4deg, rgba(255,255,255,0.16) 0 1px, rgba(255,255,255,0) 1px 38px)',
                    backgroundSize: '240% 160%',
                    willChange: 'background-position',
                }}
            />
            <div
                className="absolute -inset-x-24 top-[38%] h-32 rounded-[100%] bg-white/18 blur-2xl"
                style={{
                    animation: 'portfolio-surface-shimmer-glow 12s ease-in-out infinite',
                    willChange: 'opacity, transform',
                }}
            />
        </div>
    );
}
