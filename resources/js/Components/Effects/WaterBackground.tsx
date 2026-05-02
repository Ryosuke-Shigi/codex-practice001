import { useEffect, useRef } from 'react';
import $ from 'jquery';
import 'jquery.ripples';

/*
 * jquery.ripples is an imperative jQuery plugin, while the rest of the app is
 * declarative React/Inertia. Keeping the import and DOM manipulation in this
 * one visual component prevents jQuery assumptions from spreading into pages,
 * app.tsx, body, or #app.
 */

/*
 * The plugin does not ship TypeScript types. We describe only the options and
 * methods this component actually calls, so the type escape stays local to the
 * React/jQuery bridge instead of weakening the whole codebase.
 */
type RipplesOptions = {
    imageUrl: string;
    resolution: number;
    dropRadius: number;
    perturbance: number;
    interactive: boolean;
};

type RipplesElement = JQuery<HTMLElement> & {
    ripples(options: RipplesOptions): JQuery<HTMLElement>;
    ripples(method: 'destroy'): JQuery<HTMLElement>;
    ripples(method: 'drop', x: number, y: number, radius: number, strength: number): JQuery<HTMLElement>;
};

/*
 * This gradient is the baseline design, not just an error state. If WebGL or
 * jquery.ripples fails, the screen still has a complete water-themed background
 * instead of becoming blank or visually broken.
 */
const fallbackBackground =
    'radial-gradient(circle at 22% 12%, rgba(236,254,255,0.72) 0%, rgba(236,254,255,0) 28%), linear-gradient(155deg, #dffbff 0%, #87e8f1 24%, #2297b2 48%, #0b4e73 70%, #04152f 100%)';

/*
 * jquery.ripples distorts an image texture. Using an inline SVG gives the plugin
 * a stable water surface without adding another asset file or network request,
 * while the CSS gradient remains available as the no-WebGL fallback.
 */
const waterTexture = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="none">
  <defs>
    <linearGradient id="water" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#dffbff"/>
      <stop offset="0.28" stop-color="#83e8f0"/>
      <stop offset="0.55" stop-color="#1689aa"/>
      <stop offset="0.78" stop-color="#0a4268"/>
      <stop offset="1" stop-color="#04132d"/>
    </linearGradient>
    <radialGradient id="glow" cx="26%" cy="15%" r="55%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.74"/>
      <stop offset="0.44" stop-color="#b9f7ff" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.008 0.032" numOctaves="3" seed="8"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.13"/>
      </feComponentTransfer>
    </filter>
  </defs>
  <rect width="1600" height="1000" fill="url(#water)"/>
  <rect width="1600" height="1000" fill="url(#glow)"/>
  <g fill="none" stroke="#e8fdff" stroke-opacity="0.18" stroke-width="8">
    <path d="M-120 210 C 180 120, 420 305, 720 205 S 1230 95, 1720 245"/>
    <path d="M-180 430 C 170 560, 430 340, 760 465 S 1270 650, 1760 475"/>
    <path d="M-160 690 C 210 570, 470 780, 820 690 S 1300 520, 1740 720"/>
  </g>
  <rect width="1600" height="1000" filter="url(#grain)" opacity="0.48"/>
</svg>
`)}`;

export default function WaterBackground() {
    /*
     * useRef gives jQuery one stable DOM node after React has rendered it. We
     * avoid document/body queries so the plugin can only affect this background
     * layer and cannot accidentally take over the React app root.
     */
    const rippleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = rippleRef.current;

        if (!element) {
            return;
        }

        const $water = $(element) as unknown as RipplesElement;
        let dropTimer: number | undefined;
        let firstDropTimer: number | undefined;

        /*
         * The plugin's pointer interactivity is disabled so the background never
         * competes with START or Lab card clicks. Programmatic drops keep the
         * water visibly alive while preserving normal React UI interaction.
         */
        const addDrop = () => {
            const bounds = element.getBoundingClientRect();

            if (bounds.width === 0 || bounds.height === 0) {
                return;
            }

            try {
                $water.ripples(
                    'drop',
                    bounds.width * (0.18 + Math.random() * 0.64),
                    bounds.height * (0.16 + Math.random() * 0.68),
                    22 + Math.random() * 18,
                    0.08 + Math.random() * 0.08,
                );
            } catch {
                window.clearInterval(dropTimer);
            }
        };

        /*
         * useEffect runs in the browser after the DOM node exists and has real
         * dimensions, which jquery.ripples needs to create its WebGL canvas.
         * try/catch is important because WebGL support differs by device; when
         * initialization fails, the CSS water gradient is already good enough to
         * keep the public pages readable and visually intentional.
         */
        try {
            $water.ripples({
                imageUrl: waterTexture,
                resolution: 512,
                dropRadius: 20,
                perturbance: 0.04,
                interactive: false,
            });

            firstDropTimer = window.setTimeout(addDrop, 450);
            dropTimer = window.setInterval(addDrop, 1800);
        } catch {
            element.style.backgroundImage = fallbackBackground;
        }

        return () => {
            /*
             * Inertia can mount/unmount React pages without a full reload. Timers
             * and the plugin canvas must be cleaned up so returning to this layout
             * does not leave duplicate canvases, event handlers, or animation work.
             */
            window.clearTimeout(firstDropTimer);
            window.clearInterval(dropTimer);

            try {
                $water.ripples('destroy');
            } catch {
                element.style.backgroundImage = fallbackBackground;
            }
        };
    }, []);

    return (
        /*
         * pointer-events-none makes the animated layer behave like scenery: it can
         * be seen, but it cannot block clicks. PublicLayout lifts page content with
         * z-index so buttons and cards remain above this fixed viewport background.
         */
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden bg-slate-950">
            <div
                ref={rippleRef}
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: fallbackBackground }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.34),rgba(255,255,255,0)_42%),linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_34%,rgba(1,8,23,0.44)_100%)]" />
            <div className="absolute inset-0 bg-slate-950/10" />
        </div>
    );
}
