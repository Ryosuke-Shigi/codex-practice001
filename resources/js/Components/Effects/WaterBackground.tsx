/**
 * jQuery ripples を使った水面背景演出 Component です。
 *
 * 外部ライブラリの初期化と破棄だけを扱い、feature data や backend props には触れません。
 */
import { useEffect, useRef } from 'react';
import $ from 'jquery';
import 'jquery.ripples';

/*
 * jquery.ripples は imperative な jQuery plugin です。
 * アプリ本体は React / Inertia の宣言的 UI なので、import と DOM 操作をこの component に閉じ、
 * page、app.tsx、body、#app へ jQuery 前提を広げないようにします。
 */

/*
 * plugin は TypeScript 型を提供していません。
 * この component が実際に呼ぶ options / methods だけを定義し、型の逃げ道を React / jQuery bridge に閉じます。
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
 * 水面表現の方向性は公開ページで共有しますが、ページ密度は同じではありません。
 * showcase は入口画面を動的に見せ、subtle は明るい aqua の方向性を保ちながら
 * form / list / search が多い画面向けに opacity、ripple 数、歪みを抑えます。
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
 * 半透明の fallback は design baseline と安全網を兼ねます。
 * WebGL や jquery.ripples が失敗しても水面系の見た目を保ち、背面の ColorShiftBackground も透けて見えます。
 */
const fallbackBackground =
    'radial-gradient(circle at 22% 12%, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0) 32%), radial-gradient(circle at 74% 20%, rgba(207,250,254,0.48) 0%, rgba(207,250,254,0) 30%), linear-gradient(155deg, rgba(255,255,255,0.7) 0%, rgba(207,250,254,0.62) 26%, rgba(165,243,252,0.48) 52%, rgba(103,232,249,0.32) 76%, rgba(45,212,191,0.2) 100%)';

/*
 * jquery.ripples は画像 texture を歪ませます。
 * SVG は意図的に半透明にし、不透明 texture が ColorShiftBackground を覆って
 * 「反射した空色」layer を見えなくするのを避けます。
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
     * useRef により、React 描画後の安定した DOM node を jQuery に渡します。
     * body や #app を探さないため、plugin の制御範囲はこの water layer に限定されます。
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
         * 背景が START や Lab card の click と競合しないよう、plugin の pointer interactivity は無効にします。
         * programmatic drop だけで水面の動きを維持し、通常の React UI 操作を守ります。
         */
        const addDrop = () => {
            const bounds = element.getBoundingClientRect();

            if (bounds.width === 0 || bounds.height === 0) {
                return;
            }

            try {
                /*
                 * ripple を増やす目的は「生きた水面」に見せることで、荒れた水面にすることではありません。
                 * 大きな高強度 drop ではなく小さな drop を追加し、文字と操作部品の安定感を保ちます。
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
         * useEffect は DOM node が実寸を持った後に動くため、jquery.ripples の WebGL canvas 作成に必要な前提を満たします。
         * try/catch により、WebGL 非対応環境ではページを壊さず半透明 CSS fallback に留めます。
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
             * Inertia は full browser reload なしにページを差し替えます。
             * unmount 時に plugin と timer を破棄し、canvas 重複、古い handler、不要な animation を残さないようにします。
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
                water layer は半透明を維持します。
                ここを solid bg-color や完全不透明 gradient にすると、layer 順序が正しくても ColorShiftBackground が隠れます。
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
