import { motion } from 'motion/react';

const lights = [
    'left-[12%] top-[18%] h-44 w-44 bg-cyan-100/34',
    'right-[10%] top-[26%] h-56 w-56 bg-sky-200/24',
    'left-[34%] bottom-[14%] h-48 w-48 bg-emerald-100/20',
] as const;

export default function FloatingLightBackground() {
    return (
        /*
         * FloatingLightBackground provides a few slow light particles, like dust
         * or bubbles catching light underwater. Keeping the count low preserves
         * the quiet portfolio entrance and avoids covering text with busy motion.
         */
        <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(155deg,rgba(201,251,255,0.2)_0%,rgba(66,191,211,0.18)_36%,rgba(11,85,120,0.24)_66%,rgba(4,23,47,0.4)_100%)]">
            {lights.map((className, index) => (
                <motion.div
                    key={className}
                    className={`absolute rounded-full blur-3xl mix-blend-screen ${className}`}
                    animate={{
                        x: index % 2 === 0 ? ['-6%', '8%', '-6%'] : ['7%', '-5%', '7%'],
                        y: index % 2 === 0 ? [0, 28, 0] : [16, -24, 16],
                        opacity: [0.36, 0.72, 0.36],
                    }}
                    transition={{
                        duration: 13 + index * 3,
                        ease: 'easeInOut',
                        repeat: Infinity,
                    }}
                />
            ))}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.34),rgba(255,255,255,0)_32%)]" />
        </div>
    );
}
