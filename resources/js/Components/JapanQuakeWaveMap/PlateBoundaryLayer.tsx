type PlateBoundaryLayerProps = {
    visible: boolean;
};

const plateBoundaryPaths = [
    {
        id: 'pacific-plate',
        d: 'M 468 88 C 438 150 424 222 420 300 C 416 390 386 488 334 610',
    },
    {
        id: 'philippine-sea-plate',
        d: 'M 122 660 C 176 588 216 520 254 456 C 290 396 326 352 374 320',
    },
    {
        id: 'amur-okhotsk-boundary',
        d: 'M 242 164 C 292 214 326 266 350 342 C 372 410 378 482 368 552',
    },
];

export default function PlateBoundaryLayer({ visible }: PlateBoundaryLayerProps) {
    /*
     * PlateBoundaryLayer は静的な地図レイヤーです。
     * 地震データのDB取得や map pin 生成とは関係させず、JapanSimpleMap の SVG viewBox に
     * 合わせた黄色の線として重ねます。将来 GeoJSON を使う場合も、このコンポーネント内で
     * public/data 配下の静的データを読む形に閉じ込めます。
     */
    if (!visible) {
        return null;
    }

    return (
        <g
            data-map-layer="plate-boundaries"
            fill="none"
            stroke="#fde047"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3.2"
            opacity="0.92"
        >
            {plateBoundaryPaths.map((path) => (
                <path
                    key={path.id}
                    d={path.d}
                    strokeDasharray="10 9"
                    vectorEffect="non-scaling-stroke"
                />
            ))}
        </g>
    );
}
