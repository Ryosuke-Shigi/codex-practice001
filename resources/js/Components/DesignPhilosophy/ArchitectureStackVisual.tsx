export default function ArchitectureStackVisual() {
    return (
        <div
            aria-hidden="true"
            className="dp-architecture-stack"
            data-architecture-stack
        >
            <div className="dp-architecture-stack__layer dp-architecture-stack__layer--action">
                <span>A</span>
                <i />
            </div>
            <div className="dp-architecture-stack__layer dp-architecture-stack__layer--domain">
                <span>D</span>
                <i />
            </div>
            <div className="dp-architecture-stack__layer dp-architecture-stack__layer--responder">
                <span>R</span>
                <i />
            </div>
            <svg viewBox="0 0 420 280" focusable="false">
                <path d="M87 66 210 8l123 58-123 59Z" />
                <path d="m87 132 123-58 123 58-123 59Z" />
                <path d="m87 198 123-58 123 58-123 59Z" />
            </svg>
        </div>
    );
}
