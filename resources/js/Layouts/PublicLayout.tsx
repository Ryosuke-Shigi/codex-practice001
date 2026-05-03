import type { PropsWithChildren } from 'react';

import EffectLayer, { type EffectName } from '@/Components/Effects/EffectLayer';

type PublicLayoutProps = PropsWithChildren<{
    className?: string;
    effect?: EffectName;
}>;

/*
 * PublicLayout is only for public, login-free pages such as Welcome and Lab.
 * The important render order is:
 *   1. EffectLayer as the fixed background
 *   2. children as the actual page content
 *
 * Keeping those responsibilities separate lets the page content stay ordinary
 * React/Inertia UI while the visual experiments evolve behind it.
 */
export default function PublicLayout({ children, className = '', effect = 'water' }: PublicLayoutProps) {
    return (
        <div className="relative min-h-screen overflow-hidden text-white">
            {/*
                effect is a normal React prop. Welcome can pass its current state
                here, while Lab can omit it and use the default. PublicLayout then
                forwards the choice to EffectLayer instead of knowing effect details.
            */}
            <EffectLayer effect={effect} />

            {/*
                z-30 keeps links, buttons, and cards above every background layer.
                This is what makes the effect stack decorative rather than
                something that competes with page interaction.
            */}
            <main className={`relative z-30 min-h-screen ${className}`}>{children}</main>
        </div>
    );
}
