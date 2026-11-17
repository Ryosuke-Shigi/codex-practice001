/**
 * PRODUCT の表示候補を、既存の地図投影範囲へそろえる表示用 utility です。
 * 保存済みデータや Backend の pin 生成条件は変更しません。
 */
import type { EarthquakeMapPin } from '@/Components/JapanQuakeWaveMap/JapanQuakeWaveMap';
import {
    isCoordinateInProjectionBounds,
    type MapCoordinate,
} from '@/Components/JapanQuakeWaveMap/mapProjection';

export function displayableMapPinCoordinate(
    pin: Pick<EarthquakeMapPin, 'latitude' | 'longitude'>,
): MapCoordinate | null {
    const latitudeValue = pin.latitude?.trim();
    const longitudeValue = pin.longitude?.trim();

    // Number(null) / Number('') の 0 変換を表示可能な座標と扱わないよう先に除きます。
    if (!latitudeValue || !longitudeValue) {
        return null;
    }

    // 十進数の座標表現だけを受け、Number() が許す16進数などは表示候補へ含めません。
    const decimalCoordinate = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

    if (!decimalCoordinate.test(latitudeValue) || !decimalCoordinate.test(longitudeValue)) {
        return null;
    }

    const coordinate = {
        latitude: Number(latitudeValue),
        longitude: Number(longitudeValue),
    };

    if (!Number.isFinite(coordinate.latitude)
        || !Number.isFinite(coordinate.longitude)
        || !isCoordinateInProjectionBounds(coordinate)) {
        return null;
    }

    return coordinate;
}
