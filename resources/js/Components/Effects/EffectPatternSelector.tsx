import {
    effectPatterns,
    type EffectName,
} from '@/Components/Effects/EffectLayer';
import EffectPatternOrb from '@/Components/Effects/EffectPatternOrb';
import useBouncingOrbs from '@/Components/Effects/useBouncingOrbs';

type EffectPatternSelectorProps = {
    activeEffect: EffectName;
    onSelectEffect: (effect: EffectName) => void;
    className?: string;
};

export default function EffectPatternSelector({
    activeEffect,
    onSelectEffect,
    className = '',
}: EffectPatternSelectorProps) {
    /*
     * Selector owns the collection-level behavior only: which patterns exist,
     * where their orbs currently are, and which effect should be selected on
     * click/tap. The actual circular visual state lives in EffectPatternOrb.
     */
    const orbPositions = useBouncingOrbs({ count: effectPatterns.length });

    return (
        <div
            role="group"
            aria-label="背景エフェクト選択"
            className={`pointer-events-none absolute inset-0 z-10 overflow-hidden ${className}`}
        >
            {/*
                These keyframes animate the miniature previews inside each orb.
                They do not move the orbs themselves; viewport movement and edge
                reflection stay inside useBouncingOrbs.
            */}
            <style>
                {`
                    @keyframes portfolio-orb-preview-drift {
                        0% {
                            transform: translate3d(-4%, -3%, 0) rotate(0deg);
                        }
                        50% {
                            transform: translate3d(5%, 4%, 0) rotate(18deg);
                        }
                        100% {
                            transform: translate3d(-4%, -3%, 0) rotate(36deg);
                        }
                    }

                    @keyframes portfolio-orb-preview-glow {
                        0%,
                        100% {
                            opacity: 0.42;
                            transform: translate3d(-5%, 0, 0);
                        }
                        50% {
                            opacity: 0.78;
                            transform: translate3d(7%, -2%, 0);
                        }
                    }
                `}
            </style>

            {effectPatterns.map((pattern, index) => (
                <EffectPatternOrb
                    key={pattern.key}
                    pattern={pattern}
                    position={orbPositions[index]}
                    isActive={activeEffect === pattern.key}
                    onSelect={() => onSelectEffect(pattern.key)}
                />
            ))}
        </div>
    );
}
