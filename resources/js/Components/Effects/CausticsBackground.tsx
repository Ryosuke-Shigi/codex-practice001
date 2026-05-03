import { motion } from 'motion/react';

export default function CausticsBackground() {
    return (
        /*
         * Caustics adds the bright, moving light pattern you might see on a pool
         * floor. It is a supporting texture above ColorShiftBackground, so its
         * base gradient stays translucent and the scene color can still breathe.
         */
        <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(155deg,rgba(217,251,255,0.24)_0%,rgba(85,213,228,0.2)_34%,rgba(11,111,145,0.22)_58%,rgba(6,25,54,0.38)_100%)]">
            <motion.div
                className="absolute inset-[-18%] opacity-55 mix-blend-screen blur-[0.5px]"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(115deg, rgba(255,255,255,0) 0 16px, rgba(255,255,255,0.32) 18px 20px, rgba(255,255,255,0) 24px 54px), repeating-linear-gradient(68deg, rgba(255,255,255,0) 0 24px, rgba(165,243,252,0.26) 26px 28px, rgba(255,255,255,0) 32px 64px)',
                    backgroundSize: '220px 180px',
                }}
                animate={{ backgroundPosition: ['0px 0px', '180px 120px', '0px 0px'] }}
                transition={{ duration: 16, ease: 'linear', repeat: Infinity }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.38),rgba(255,255,255,0)_42%)]" />
        </div>
    );
}
