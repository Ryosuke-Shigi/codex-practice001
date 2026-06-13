/**
 * 背景演出パターンを選ぶ UI Component です。
 *
 * 選択状態は Layout の UI state として扱い、各 Page の機能状態や backend props には影響させません。
 */
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
     * Selector は pattern 一覧、現在の orb 位置、click / tap 時の選択だけを担当します。
     * 円形の見た目状態は EffectPatternOrb 側へ分けます。
     */
    const orbPositions = useBouncingOrbs({ count: effectPatterns.length });

    return (
        <div
            role="group"
            aria-label="背景エフェクト選択"
            className={`pointer-events-none absolute inset-0 z-10 overflow-hidden ${className}`}
        >
            {/*
                この keyframes は各 orb 内の小さな preview だけを動かします。
                orb 自体の viewport 移動と端での反射は useBouncingOrbs に閉じます。
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
