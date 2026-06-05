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
