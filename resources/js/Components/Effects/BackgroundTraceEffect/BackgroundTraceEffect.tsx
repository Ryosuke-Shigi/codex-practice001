/**
 * trace pattern 背景演出の Component です。
 *
 * 背景グラデーションと SVG trace を重ねるだけにし、業務データや操作UIには依存しません。
 */
import BackgroundGradient from './BackgroundGradient';
import TracePattern from './TracePattern';
import './backgroundTraceEffect.css';
import {
    defaultTracePatternId,
    type TracePatternId,
} from './tracePatterns';

type BackgroundTraceEffectProps = {
    patternId?: TracePatternId;
};

export default function BackgroundTraceEffect({
    patternId = defaultTracePatternId,
}: BackgroundTraceEffectProps) {
    return (
        <div
            aria-hidden="true"
            className="background-trace-effect"
            data-pattern={patternId}
        >
            <BackgroundGradient />
            <TracePattern patternId={patternId} />
        </div>
    );
}
