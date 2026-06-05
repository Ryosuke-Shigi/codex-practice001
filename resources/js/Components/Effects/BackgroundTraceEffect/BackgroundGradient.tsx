import type { HTMLAttributes } from 'react';

type BackgroundGradientVariant = 'cute-pastel';

type BackgroundGradientProps = HTMLAttributes<HTMLDivElement> & {
    variant?: BackgroundGradientVariant;
};

export default function BackgroundGradient({
    variant = 'cute-pastel',
    className = '',
    ...props
}: BackgroundGradientProps) {
    return (
        <div
            className={`background-trace-effect__gradient background-trace-effect__gradient--${variant} ${className}`}
            {...props}
        />
    );
}
