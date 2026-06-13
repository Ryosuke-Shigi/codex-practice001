/**
 * 色変化を使う背景演出 Component です。
 *
 * motion の見た目だけを担当し、各 feature の状態や API 通信には関与しません。
 */
import { motion } from 'motion/react';

/*
 * ColorShiftBackground は遅い色変化だけを担当します。
 * water / caustics / shimmer / cursor effect は上位 layer に分け、各 component が個別に調整できるようにします。
 */
const colorLayers = [
    {
        name: 'emerald',
        background:
            'radial-gradient(circle at 22% 18%, rgba(209,250,229,0.72) 0%, rgba(209,250,229,0) 32%), linear-gradient(145deg, #10b981 0%, #22d3ee 42%, #0f5f86 100%)',
        opacity: [1, 0, 0, 0, 1],
    },
    {
        name: 'aqua',
        background:
            'radial-gradient(circle at 28% 12%, rgba(224,251,255,0.68) 0%, rgba(224,251,255,0) 34%), linear-gradient(145deg, #2dd4bf 0%, #38bdf8 46%, #0b4e77 100%)',
        opacity: [0, 1, 0, 0, 0],
    },
    {
        name: 'deep-blue',
        background:
            'radial-gradient(circle at 62% 18%, rgba(186,230,253,0.42) 0%, rgba(186,230,253,0) 36%), linear-gradient(145deg, #0f766e 0%, #075985 48%, #081b45 100%)',
        opacity: [0, 0, 1, 0, 0],
    },
    {
        name: 'pale-violet',
        background:
            'radial-gradient(circle at 55% 16%, rgba(233,213,255,0.5) 0%, rgba(233,213,255,0) 34%), linear-gradient(145deg, #67e8f9 0%, #64748b 44%, #8b5cf6 100%)',
        opacity: [0, 0, 0, 1, 0],
    },
];

export default function ColorShiftBackground() {
    return (
        /*
         * EffectLayer の最背面 layer です。
         * emerald -> aqua -> deep-blue -> pale-violet の循環で、水面に映る空色の変化を表現します。
         */
        <div className="pointer-events-none absolute inset-0 z-0 bg-emerald-500">
            {/*
                複雑な gradient 文字列を直接補間するより、実 layer を cross-fade する方が安定します。
                pointer-events-none により、START や Lab card の click を奪わないようにします。
            */}
            {colorLayers.map((layer) => (
                <motion.div
                    key={layer.name}
                    className="absolute inset-0"
                    style={{ background: layer.background }}
                    animate={{ opacity: layer.opacity }}
                    transition={{
                        duration: 16,
                        ease: 'easeInOut',
                        repeat: Infinity,
                        times: [0, 0.28, 0.56, 0.82, 1],
                    }}
                />
            ))}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.2),rgba(255,255,255,0)_46%)]" />
        </div>
    );
}
