import { motion } from 'motion/react';

import type { EffectPattern } from '@/Components/Effects/EffectLayer';
import type { BouncingOrbPosition } from '@/Components/Effects/useBouncingOrbs';

type EffectPatternOrbProps = {
    pattern: EffectPattern;
    position: BouncingOrbPosition;
    isActive: boolean;
    onSelect: () => void;
};

export default function EffectPatternOrb({
    pattern,
    position,
    isActive,
    onSelect,
}: EffectPatternOrbProps) {
    return (
        /*
         * wrapper は pointer-events-none にし、移動する orb 周辺の空白が START を塞がないようにします。
         * button 本体だけ pointer events を戻し、この visual layer の唯一の操作対象にします。
         */
        <div
            className="pointer-events-none absolute"
            style={{
                height: position.size,
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: 'translate(-50%, -50%)',
                width: position.size,
                zIndex: isActive ? 2 : 1,
            }}
        >
            <motion.button
                type="button"
                aria-label={`${pattern.label} 背景エフェクトを選択`}
                aria-pressed={isActive}
                title={pattern.label}
                onClick={onSelect}
                className={`pointer-events-auto relative block h-full w-full overflow-hidden rounded-full border border-white/45 bg-slate-950/22 shadow-[0_18px_44px_rgba(2,24,45,0.28)] backdrop-blur-md outline-none transition focus-visible:ring-4 focus-visible:ring-cyan-100/70 ${
                    isActive
                        ? 'ring-4 ring-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.48),0_22px_54px_rgba(103,232,249,0.34)]'
                        : 'opacity-82 hover:opacity-100'
                }`}
                animate={{
                    filter: isActive ? 'brightness(1.14) saturate(1.08)' : 'brightness(0.92) saturate(0.96)',
                    scale: isActive ? 1.12 : 1,
                }}
                whileHover={{ scale: isActive ? 1.16 : 1.07 }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
            >
                {/*
                    orb preview は full background component ではなく EffectLayer の catalog data を使います。
                    preview を軽量に保ち、新しい effect は定義1件の追加で selector に参加できます。
                */}
                <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full"
                    style={{ background: pattern.preview.baseBackground }}
                />
                <span
                    aria-hidden="true"
                    className="absolute inset-[-20%] rounded-full mix-blend-screen"
                    style={{
                        animation: 'portfolio-orb-preview-drift 7s linear infinite',
                        background: pattern.preview.textureBackground,
                        opacity: pattern.preview.textureOpacity,
                    }}
                />
                <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full mix-blend-screen"
                    style={{
                        animation: 'portfolio-orb-preview-glow 5.8s ease-in-out infinite',
                        background: pattern.preview.highlightBackground,
                    }}
                />
                <span
                    aria-hidden="true"
                    className={`absolute inset-0 rounded-full ${
                        isActive ? 'bg-white/10' : 'bg-slate-950/12'
                    }`}
                />
                <span
                    aria-hidden="true"
                    className="absolute inset-1 rounded-full border border-white/28"
                />
            </motion.button>
        </div>
    );
}
