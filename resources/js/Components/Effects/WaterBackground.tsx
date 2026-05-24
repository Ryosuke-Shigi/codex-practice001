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

export type WaterBackgroundIntensity = 'showcase' | 'subtle';

type WaterBackgroundProps = {
    intensity?: WaterBackgroundIntensity;
};

/*
 * The water direction is shared across public pages, but the page density is
 * not. showcase keeps the entrance screens lively; subtle keeps the same bright
 * aqua identity while reducing opacity, ripple count, and distortion for forms,
 * lists, and search-heavy pages.
 */
const waterIntensitySettings: Record<
    WaterBackgroundIntensity,
    {
        layerOpacity: number;
        firstDropDelayMs: number;
        dropIntervalMs: number;
        dropsPerPulse: number;
        radiusBase: number;
        radiusRange: number;
        strengthBase: number;
        strengthRange: number;
        pluginDropRadius: number;
        perturbance: number;
    }
> = {
    showcase: {
        layerOpacity: 0.9,
        firstDropDelayMs: 280,
        dropIntervalMs: 1180,
        dropsPerPulse: 2,
        radiusBase: 15,
        radiusRange: 16,
        strengthBase: 0.042,
        strengthRange: 0.052,
        pluginDropRadius: 18,
        perturbance: 0.032,
    },
    subtle: {
        layerOpacity: 0.72,
        firstDropDelayMs: 620,
        dropIntervalMs: 1540,
        dropsPerPulse: 1,
        radiusBase: 12,
        radiusRange: 14,
        strengthBase: 0.028,
        strengthRange: 0.036,
        pluginDropRadius: 14,
        perturbance: 0.022,
    },
};

/*
 * This translucent fallback is both a design baseline and a safety net. If
 * WebGL or jquery.ripples fails, the page still has a water-themed surface, and
 * ColorShiftBackground can still show through from behind.
 */
const fallbackBackground =
    'radial-gradient(circle at 22% 12%, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0) 32%), radial-gradient(circle at 74% 20%, rgba(207,250,254,0.48) 0%, rgba(207,250,254,0) 30%), linear-gradient(155deg, rgba(255,255,255,0.7) 0%, rgba(207,250,254,0.62) 26%, rgba(165,243,252,0.48) 52%, rgba(103,232,249,0.32) 76%, rgba(45,212,191,0.2) 100%)';

/*
 * jquery.ripples distorts an image texture. The SVG stays intentionally
 * semi-transparent; an opaque texture would cover the ColorShiftBackground and
 * make the "reflected sky color" layer impossible to see.
 */
const waterTexture = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="none">
  <defs>
    <linearGradient id="water" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.82"/>
      <stop offset="0.26" stop-color="#ecfeff" stop-opacity="0.68"/>
      <stop offset="0.52" stop-color="#a5f3fc" stop-opacity="0.5"/>
      <stop offset="0.76" stop-color="#67e8f9" stop-opacity="0.34"/>
      <stop offset="1" stop-color="#2dd4bf" stop-opacity="0.22"/>
    </linearGradient>
    <radialGradient id="glow" cx="26%" cy="15%" r="55%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="0.44" stop-color="#ecfeff" stop-opacity="0.34"/>
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
  <g fill="none" stroke="#f8feff" stroke-opacity="0.18" stroke-width="7">
    <path d="M-120 210 C 180 120, 420 305, 720 205 S 1230 95, 1720 245"/>
    <path d="M-160 320 C 130 230, 420 390, 710 315 S 1200 210, 1730 330"/>
    <path d="M-180 430 C 170 560, 430 340, 760 465 S 1270 650, 1760 475"/>
    <path d="M-150 555 C 190 470, 490 645, 820 555 S 1300 430, 1740 590"/>
    <path d="M-160 690 C 210 570, 470 780, 820 690 S 1300 520, 1740 720"/>
  </g>
  <g fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="6">
    <ellipse cx="390" cy="285" rx="128" ry="42"/>
    <ellipse cx="1040" cy="390" rx="168" ry="54"/>
    <ellipse cx="705" cy="710" rx="150" ry="48"/>
  </g>
  <rect width="1600" height="1000" filter="url(#grain)" opacity="0.28"/>
</svg>
`)}`;

export default function WaterBackground({ intensity = 'subtle' }: WaterBackgroundProps) {
    const settings = waterIntensitySettings[intensity];

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
                /*
                 * More ripples should read as "active water", not as a storm.
                 * Use extra small drops instead of one large high-strength drop
                 * so the surface has more motion while text and controls remain
                 * visually stable above the background layer.
                 */
                for (let index = 0; index < settings.dropsPerPulse; index += 1) {
                    $water.ripples(
                        'drop',
                        bounds.width * (0.14 + Math.random() * 0.72),
                        bounds.height * (0.12 + Math.random() * 0.72),
                        settings.radiusBase + Math.random() * settings.radiusRange,
                        settings.strengthBase + Math.random() * settings.strengthRange,
                    );
                }
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
                dropRadius: settings.pluginDropRadius,
                perturbance: settings.perturbance,
                interactive: false,
            });

            firstDropTimer = window.setTimeout(addDrop, settings.firstDropDelayMs);
            dropTimer = window.setInterval(addDrop, settings.dropIntervalMs);
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
    }, [settings]);

    return (
        <div className="absolute inset-0 overflow-hidden">
            {/*
                The water layer must stay translucent. A solid bg-color or fully
                opaque gradient here would hide ColorShiftBackground even though
                the layer order is technically correct.
            */}
            <div
                ref={rippleRef}
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: fallbackBackground,
                    opacity: settings.layerOpacity,
                }}
            />
        </div>
    );
}
