export default function CausticsBackground() {
    return (
        /*
         * Caustics adds the bright, moving light pattern you might see on a pool
         * floor. It is a supporting texture above ColorShiftBackground, so its
         * base gradient stays translucent and the scene color can still breathe.
         */
        <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(155deg,rgba(217,251,255,0.24)_0%,rgba(85,213,228,0.2)_34%,rgba(11,111,145,0.22)_58%,rgba(6,25,54,0.38)_100%)]">
            {/*
                Keep the drifting light pattern in CSS instead of Motion. Motion
                is excellent for element transforms, but background-position
                interpolation can stall after effect switches on some browsers.
                Native keyframes keep this decorative layer running independently
                of React renders and Inertia page changes.
            */}
            <style>
                {`
                    @keyframes portfolio-caustics-drift {
                        0% {
                            background-position: 0px 0px, 0px 0px;
                            transform: translate3d(0, 0, 0);
                        }
                        50% {
                            background-position: 180px 120px, -120px 92px;
                            transform: translate3d(1.5%, -1%, 0);
                        }
                        100% {
                            background-position: 360px 240px, -240px 184px;
                            transform: translate3d(0, 0, 0);
                        }
                    }
                `}
            </style>
            <div
                className="absolute inset-[-18%] opacity-55 mix-blend-screen blur-[0.5px]"
                style={{
                    animation: 'portfolio-caustics-drift 18s linear infinite',
                    backgroundImage:
                        'repeating-linear-gradient(115deg, rgba(255,255,255,0) 0 16px, rgba(255,255,255,0.32) 18px 20px, rgba(255,255,255,0) 24px 54px), repeating-linear-gradient(68deg, rgba(255,255,255,0) 0 24px, rgba(165,243,252,0.26) 26px 28px, rgba(255,255,255,0) 32px 64px)',
                    backgroundSize: '220px 180px',
                    willChange: 'background-position, transform',
                }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.38),rgba(255,255,255,0)_42%)]" />
        </div>
    );
}
