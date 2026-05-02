import type { PropsWithChildren } from 'react';

import WaterBackground from '@/Components/Effects/WaterBackground';

type PublicLayoutProps = PropsWithChildren<{
    className?: string;
}>;

/*
 * PublicLayout is the boundary for login-free pages. Welcome and Lab/Index share
 * it so the portfolio entrance has one consistent water treatment, while future
 * authenticated screens, dashboards, and admin tools can use different layouts
 * without inheriting jquery.ripples.
 */
export default function PublicLayout({ children, className = '' }: PublicLayoutProps) {
    return (
        <div className="min-h-screen overflow-hidden text-white">
            <WaterBackground />
            {/* z-10 keeps real page UI above the fixed, non-interactive background layer. */}
            <main className={`relative z-10 min-h-screen ${className}`}>{children}</main>
        </div>
    );
}
