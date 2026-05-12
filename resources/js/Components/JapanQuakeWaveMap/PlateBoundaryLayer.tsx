import { useEffect, useMemo, useState } from 'react';

import {
    isCoordinateInProjectionBounds,
    projectCoordinateToMap,
} from '@/Components/JapanQuakeWaveMap/mapProjection';

type PlateBoundaryLayerProps = {
    visible: boolean;
};

type GeoJsonPosition = [number, number, ...number[]];

type PlateBoundaryFeature = {
    id?: string | number;
    geometry: {
        type: 'LineString' | 'MultiLineString';
        coordinates: GeoJsonPosition[] | GeoJsonPosition[][];
    } | null;
};

type PlateBoundaryFeatureCollection = {
    type: 'FeatureCollection';
    features: PlateBoundaryFeature[];
};

const plateBoundaryDataUrl = '/data/plate-boundaries.geojson';
const projectionMargin = 1.2;

function coordinatesToPathSegments(coordinates: GeoJsonPosition[]) {
    /*
     * GeoJSON は [longitude, latitude] の点列で届きます。
     * SVG の path は1本の線として連続した点だけを結ぶ必要があるため、
     * 日本周辺の投影範囲から外れた点や不正な点に当たったらそこで一度線を切ります。
     *
     * ここで範囲外も無理に結ぶと、画面外を横切る長い直線が出てしまい、
     * プレート境界線ではなく描画アーティファクトに見えます。
     */
    const segments: string[] = [];
    let currentSegment: string[] = [];

    const flushSegment = () => {
        if (currentSegment.length >= 2) {
            segments.push(currentSegment.join(' '));
        }

        currentSegment = [];
    };

    coordinates.forEach(([longitude, latitude]) => {
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            flushSegment();
            return;
        }

        if (!isCoordinateInProjectionBounds({ latitude, longitude }, projectionMargin)) {
            flushSegment();
            return;
        }

        const point = projectCoordinateToMap({ latitude, longitude });
        const command = currentSegment.length === 0 ? 'M' : 'L';

        currentSegment.push(`${command} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`);
    });

    flushSegment();

    return segments;
}

function featureToPathSegments(feature: PlateBoundaryFeature) {
    /*
     * USGS の Plates レイヤーは LineString が中心ですが、静的データを差し替えた時に
     * MultiLineString が混ざっても壊れないよう、描画可能な線分へ平らに変換します。
     * Feature の属性値は今回の地図表示では使わず、境界線の形状だけを表示します。
     */
    if (feature.geometry === null) {
        return [];
    }

    if (feature.geometry.type === 'LineString') {
        return coordinatesToPathSegments(feature.geometry.coordinates as GeoJsonPosition[]);
    }

    if (feature.geometry.type === 'MultiLineString') {
        const coordinates = feature.geometry.coordinates as GeoJsonPosition[][];

        return coordinates.flatMap((lineString) => coordinatesToPathSegments(lineString));
    }

    return [];
}

export default function PlateBoundaryLayer({ visible }: PlateBoundaryLayerProps) {
    /*
     * PlateBoundaryLayer は public/data の静的 GeoJSON を読む表示レイヤーです。
     * USGS へ画面表示時に直接アクセスせず、DB保存や地震map pin生成にも関与しません。
     *
     * 外部サービスへ毎回 fetch しない理由:
     * - 地図を開くたびに外部APIの可用性や通信速度へ依存しないようにするため
     * - プレート境界線は地震イベントの同期結果ではなく、背景に重ねる静的レイヤーだから
     * - DBやRepositoryへ混ぜると「地震データ生成」と「地図背景データ」が同じ責務に見えるため
     *
     * そのため、データ更新が必要になった時は public/data の GeoJSON を差し替えるだけにし、
     * React 側では表示ON/OFFとSVG path化だけを担当します。
     */
    const [geoJson, setGeoJson] = useState<PlateBoundaryFeatureCollection | null>(null);

    useEffect(() => {
        if (!visible || geoJson !== null) {
            return;
        }

        let isActive = true;

        const loadPlateBoundaries = async () => {
            try {
                const response = await fetch(plateBoundaryDataUrl);

                if (!response.ok) {
                    throw new Error(`Failed to load plate boundaries: ${response.status}`);
                }

                const nextGeoJson = await response.json() as PlateBoundaryFeatureCollection;

                if (isActive) {
                    setGeoJson(nextGeoJson);
                }
            } catch {
                if (isActive) {
                    setGeoJson({
                        type: 'FeatureCollection',
                        features: [],
                    });
                }
            }
        };

        void loadPlateBoundaries();

        return () => {
            isActive = false;
        };
    }, [geoJson, visible]);

    const boundaryPaths = useMemo(
        () => geoJson?.features.flatMap((feature) => featureToPathSegments(feature)) ?? [],
        [geoJson],
    );

    if (!visible || boundaryPaths.length === 0) {
        return null;
    }

    return (
        <g
            data-map-layer="plate-boundaries"
            fill="none"
            stroke="#fde047"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.8"
            opacity="0.92"
        >
            {boundaryPaths.map((path, index) => (
                <path
                    key={`${index}-${path}`}
                    d={path}
                    strokeDasharray="9 7"
                    vectorEffect="non-scaling-stroke"
                />
            ))}
        </g>
    );
}
