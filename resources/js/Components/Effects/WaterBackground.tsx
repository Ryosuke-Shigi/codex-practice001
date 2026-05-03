import { useEffect, useRef } from 'react';
import $ from 'jquery';
import 'jquery.ripples';

/*
 * jquery.ripples is an imperative jQuery plugin, while the app is otherwise
 * declarative React/Inertia. Keeping the import and DOM manipulation in this
 * component prevents jQuery assumptions from spreading into pages, app.tsx,
 * body, or #app.
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
 * This translucent fallback is both a design baseline and a safety net. If
 * WebGL or jquery.ripples fails, the page still has a water-themed surface, and
 * ColorShiftBackground can still show through from behind.
 */
const fallbackBackground =
    'radial-gradient(circle at 22% 12%, rgba(236,254,255,0.48) 0%, rgba(236,254,255,0) 30%), linear-gradient(155deg, rgba(223,251,255,0.48) 0%, rgba(135,232,241,0.4) 24%, rgba(34,151,178,0.34) 48%, rgba(11,78,115,0.42) 70%, rgba(4,21,47,0.56) 100%)';

/*
 * jquery.ripples distorts an image texture. The SVG stays intentionally
 * semi-transparent; an opaque texture would cover the ColorShiftBackground and
 * make the "reflected sky color" layer impossible to see.
 */
const waterTexture = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="none">
  <defs>
    <linearGradient id="water" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#dffbff" stop-opacity="0.56"/>
      <stop offset="0.28" stop-color="#83e8f0" stop-opacity="0.46"/>
      <stop offset="0.55" stop-color="#1689aa" stop-opacity="0.34"/>
      <stop offset="0.78" stop-color="#0a4268" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#04132d" stop-opacity="0.58"/>
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
  <rect width="1600" height="1000" fill="url(#glow)" opacity="0.72"/>
  <g fill="none" stroke="#e8fdff" stroke-opacity="0.18" stroke-width="8">
    <path d="M-120 210 C 180 120, 420 305, 720 205 S 1230 95, 1720 245"/>
    <path d="M-180 430 C 170 560, 430 340, 760 465 S 1270 650, 1760 475"/>
    <path d="M-160 690 C 210 570, 470 780, 820 690 S 1300 520, 1740 720"/>
  </g>
  <rect width="1600" height="1000" filter="url(#grain)" opacity="0.28"/>
</svg>
`)}`;

export default function WaterBackground() {
    /*
     * useRef gives jQuery one stable DOM node after React has rendered it. That
     * avoids querying body or #app, so the plugin only controls this water layer.
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
         * Plugin pointer interactivity is disabled because the background should
         * not compete with START or Lab card clicks. Programmatic drops keep the
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
         * useEffect runs after the DOM node exists and has real dimensions, which
         * jquery.ripples needs before creating its WebGL canvas. try/catch keeps
         * devices without the required WebGL support on the translucent CSS
         * fallback instead of breaking the page.
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
             * Inertia can swap pages without a full browser reload. Destroying the
             * plugin and timers prevents duplicate canvases, stale handlers, and
             * unnecessary animation work when this layer unmounts.
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
        <div className="absolute inset-0 overflow-hidden">
            {/*
                The water layer must stay translucent. A solid bg-color or fully
                opaque gradient here would hide ColorShiftBackground even though
                the layer order is technically correct.
            */}
            <div
                ref={rippleRef}
                className="absolute inset-0 bg-cover bg-center opacity-70"
                style={{ backgroundImage: fallbackBackground }}
            />
        </div>
    );
}
