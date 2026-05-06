type DirectionalNavigationButtonProps = {
    direction: 'previous' | 'next';
    ariaLabel: string;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
};

const sideClassNames = {
    previous: 'left-2 sm:left-4 lg:left-6',
    next: 'right-2 sm:right-4 lg:right-6',
};

const arrowLabels = {
    previous: '←',
    next: '→',
};

export default function DirectionalNavigationButton({
    direction,
    ariaLabel,
    onClick,
    disabled = false,
    className = '',
}: DirectionalNavigationButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            className={`fixed top-1/2 z-50 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-slate-950/38 text-2xl font-bold leading-none text-white shadow-[0_18px_36px_rgba(2,24,45,0.28)] backdrop-blur-2xl transition hover:bg-slate-900/56 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/40 disabled:cursor-not-allowed disabled:opacity-35 sm:h-14 sm:w-14 ${sideClassNames[direction]} ${className}`}
        >
            <span aria-hidden="true">{arrowLabels[direction]}</span>
        </button>
    );
}
