import './radarLightTrace.css';

// 各経路は上から下へ単調に進み、曲がり角は曲線で接続します。常設の回路は描きません。
const desktopRoutes = [
    'M 90 -80 V 150 Q 90 170 110 170 H 260 Q 280 170 280 190 V 480 Q 280 500 260 500 H 140 Q 120 500 120 520 V 1080',
    'M 830 -80 V 250 Q 830 270 810 270 H 690 Q 670 270 670 290 V 610 Q 670 630 690 630 H 880 Q 900 630 900 650 V 1080',
    'M 460 -80 V 350 Q 460 370 480 370 H 570 Q 590 370 590 390 V 750 Q 590 770 570 770 H 390 Q 370 770 370 790 V 1080',
    'M 970 -80 V 100 Q 970 120 950 120 H 760 Q 740 120 740 140 V 820 Q 740 840 760 840 H 800 Q 820 840 820 860 V 1080',
];
const mobileRoutes = [
    'M 80 -80 V 180 Q 80 205 105 205 H 320 Q 345 205 345 230 V 580 Q 345 605 320 605 H 135 Q 110 605 110 630 V 1080',
    'M 890 -80 V 310 Q 890 335 865 335 H 690 Q 665 335 665 360 V 730 Q 665 755 690 755 H 870 Q 895 755 895 780 V 1080',
    'M 480 -80 V 100 Q 480 125 505 125 H 760 Q 785 125 785 150 V 480 Q 785 505 760 505 H 490 Q 465 505 465 530 V 1080',
    'M 960 -80 V 470 Q 960 495 935 495 H 900 Q 875 495 875 520 V 880 Q 875 905 850 905 H 250 Q 225 905 225 930 V 1080',
];

/** Radar PRODUCTのみが選ぶ、背景色と短い光跡。既存背景の設定・モバイル固定経路は変更しません。 */
export default function RadarLightTraceEffect() {
    return (
        <div className="radar-light-trace" aria-hidden="true">
            {[{ size: 'desktop', routes: desktopRoutes }, { size: 'mobile', routes: mobileRoutes }].map(({ size, routes }) => (
                <svg key={size} className={`radar-light-trace__routes radar-light-trace__routes--${size}`} viewBox="0 0 1000 1000" preserveAspectRatio="none">
                    {routes.map((route, index) => (
                        <g key={route} className={`radar-light-trace__light radar-light-trace__light--${index}`}>
                            <path d={route} pathLength="100" className="radar-light-trace__glow" />
                            <path d={route} pathLength="100" className="radar-light-trace__core" />
                        </g>
                    ))}
                </svg>
            ))}
        </div>
    );
}
