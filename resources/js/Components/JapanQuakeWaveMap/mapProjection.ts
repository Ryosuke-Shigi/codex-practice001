/**
 * QuakeWave map の緯度経度を SVG 座標へ変換する utility です。
 *
 * 表示上の projection だけを扱い、座標の抽出・検証・pin生成可否判断は backend 側へ置きます。
 */
export type MapPoint = {
    x: number;
    y: number;
};

export type MapCoordinate = {
    latitude: number;
    longitude: number;
};

export const mapViewBox = {
    width: 560,
    height: 760,
};

/*
 * JapanSimpleMap の日本地図SVGは、厳密なGIS地図ではなくUI用に軽量化した図形です。
 * その上へ地震ピンとプレート境界線を重ねるため、この範囲を「画面上の日本周辺」として
 * 1か所に固定します。
 *
 * ここを共通化しておかないと、地震ピンは JapanSimpleMap 内の投影、プレート線は
 * PlateBoundaryLayer 内の別投影、という状態になり、同じ緯度経度でも表示位置がずれます。
 */
export const mapProjectionBounds = {
    minLongitude: 122.6,
    maxLongitude: 146.4,
    minLatitude: 23.6,
    maxLatitude: 46.0,
};

const mapPadding = {
    x: 22,
    y: 22,
};

export function isCoordinateInProjectionBounds(
    { latitude, longitude }: MapCoordinate,
    margin = 0,
) {
    /*
     * プレート境界線は日本周辺だけを描画します。
     * margin を持たせるのは、境界線が表示範囲の端で少しだけ外へ出入りする時に
     * 不自然に途切れすぎないようにするためです。
     */
    return longitude >= mapProjectionBounds.minLongitude - margin
        && longitude <= mapProjectionBounds.maxLongitude + margin
        && latitude >= mapProjectionBounds.minLatitude - margin
        && latitude <= mapProjectionBounds.maxLatitude + margin;
}

export function projectCoordinateToMap({ latitude, longitude }: MapCoordinate): MapPoint {
    /*
     * この projection は本格GISではなく、既存の簡易日本地図SVGに緯度経度を
     * 重ねるための線形変換です。地震ピンとプレート境界線で同じ viewBox と
     * 投影範囲を共有し、表示位置のズレを避けます。
     *
     * 戻り値はSVG viewBox上の座標です。ピン表示側はこの値を percentage に変換して
     * absolute配置し、プレート境界線側はそのまま path の M/L コマンドに使います。
     */
    const innerWidth = mapViewBox.width - mapPadding.x * 2;
    const innerHeight = mapViewBox.height - mapPadding.y * 2;

    return {
        x:
            ((longitude - mapProjectionBounds.minLongitude)
                / (mapProjectionBounds.maxLongitude - mapProjectionBounds.minLongitude))
                * innerWidth
            + mapPadding.x,
        y:
            ((mapProjectionBounds.maxLatitude - latitude)
                / (mapProjectionBounds.maxLatitude - mapProjectionBounds.minLatitude))
                * innerHeight
            + mapPadding.y,
    };
}
