export default function HeroSystemCore() {
    return (
        <div
            aria-hidden="true"
            className="dp-system-core"
            data-hero-system-core
        >
            <div className="dp-system-core__grid" />
            <div className="dp-system-core__orbit dp-system-core__orbit--outer">
                <span />
                <span />
                <span />
            </div>
            <div className="dp-system-core__orbit dp-system-core__orbit--middle">
                <span />
                <span />
            </div>
            <div className="dp-system-core__orbit dp-system-core__orbit--inner">
                <span />
            </div>
            <div className="dp-system-core__center">
                <svg viewBox="0 0 120 120" focusable="false">
                    <path d="M60 10 103 35v50L60 110 17 85V35Z" />
                    <path d="m60 31 25 14v30L60 89 35 75V45Z" />
                    <path d="M60 10v21M103 35 85 45M103 85 85 75M60 110V89M17 85l18-10M17 35l18 10" />
                </svg>
            </div>
            <div className="dp-system-core__axis dp-system-core__axis--x" />
            <div className="dp-system-core__axis dp-system-core__axis--y" />
        </div>
    );
}
