import { motion } from 'motion/react';

export default function SurfaceShimmerBackground() {
    return (
        /*
         * SurfaceShimmer is the subtle reflection layer: thin moving highlights
         * imply a water surface without becoming the focal point. Opacity stays
         * restrained so the START button and Lab cards remain easy to read.
         */
        <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(160deg,rgba(216,252,255,0.22)_0%,rgba(108,221,234,0.18)_30%,rgba(12,118,152,0.22)_56%,rgba(4,23,51,0.4)_100%)]">
            <motion.div
                className="absolute inset-[-10%] opacity-45 mix-blend-soft-light"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(96deg, rgba(255,255,255,0.46) 0 1px, rgba(255,255,255,0) 1px 18px), repeating-linear-gradient(4deg, rgba(255,255,255,0.16) 0 1px, rgba(255,255,255,0) 1px 38px)',
                    backgroundSize: '240% 160%',
                }}
                animate={{ backgroundPosition: ['0% 50%', '100% 54%', '0% 50%'] }}
                transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
            />
            <motion.div
                className="absolute -inset-x-24 top-[38%] h-32 rounded-[100%] bg-white/18 blur-2xl"
                animate={{ x: ['-5%', '6%', '-5%'], opacity: [0.18, 0.36, 0.18] }}
                transition={{ duration: 12, ease: 'easeInOut', repeat: Infinity }}
            />
        </div>
    );
}
