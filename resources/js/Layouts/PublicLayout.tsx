import { useState, type PropsWithChildren } from 'react';

import EffectLayer, {
    defaultEffectName,
    type EffectIntensity,
    type EffectName,
    readPreferredEffectName,
} from '@/Components/Effects/EffectLayer';

type PublicLayoutProps = PropsWithChildren<{
    className?: string;
    effect?: EffectName;
    effectIntensity?: EffectIntensity;
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
export default function PublicLayout({
    children,
    className = '',
    effect,
    effectIntensity = 'subtle',
}: PublicLayoutProps) {
    /*
     * Read the saved effect once when the layout mounts. If we read storage on
     * every render, ordinary page state updates could unexpectedly change the
     * background under the user. An explicit effect prop still wins for pages
     * that intentionally choose a domain-specific or quiet background.
     */
    const [preferredEffect] = useState<EffectName>(
        () => readPreferredEffectName() ?? defaultEffectName,
    );
    const resolvedEffect = effect ?? preferredEffect;

    return (
        <div className="relative min-h-screen overflow-hidden text-white">
            {/*
                effect and effectIntensity are normal React props. Welcome and
                entry pages can make water a little more present, while content
                pages keep the same direction with a quieter supporting layer.
                If a page omits effect, the latest Welcome selection is reused.
            */}
            <EffectLayer effect={resolvedEffect} effectIntensity={effectIntensity} />

            {/*
                z-30 keeps links, buttons, and cards above every background layer.
                This is what makes the effect stack decorative rather than
                something that competes with page interaction.
            */}
            <main className={`relative z-30 min-h-screen ${className}`}>{children}</main>
        </div>
    );
}
