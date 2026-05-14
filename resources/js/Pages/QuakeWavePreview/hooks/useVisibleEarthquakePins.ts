import { useMemo, useState } from 'react';

import type { EarthquakeMapPin } from '@/Components/JapanQuakeWaveMap/JapanQuakeWaveMap';
import { PIN_DISPLAY_LIMIT_INITIAL } from '@/Components/JapanQuakeWaveMap/PinDisplayLimitSlider';
import {
    quakeIntensityKey,
    quakeIntensityKeys,
    quakeIntensitySortRank,
    type QuakeIntensityKey,
} from '@/Components/JapanQuakeWaveMap/QuakeIntensitySwitchFilter';

/*
 * DB から受け取った pins を、画面上で「今どれを描画するか」に変換する hook です。
 * 日付範囲はサーバー再取得の責務ですが、震度ON/OFF・表示件数・表示順は React 側だけの
 * 表示状態として扱います。ここに集めることで Page は画面構成に集中でき、共通地図
 * コンポーネント JapanQuakeWaveMap にも絞り込みロジックを持ち込まずに済みます。
 */
export function pinTimestamp(pin: Pick<EarthquakeMapPin, 'occurredAt' | 'reportedAt'>) {
    /*
     * 表示順では reportedAt を優先し、値がない場合だけ occurredAt を使います。
     * 既存挙動に合わせ、不正日付や未設定値は 0 として扱い、震度が同じ pins の中で
     * 新しい報告時刻が上に来るよう comparePinsForDisplay から利用します。
     */
    const value = pin.reportedAt ?? pin.occurredAt;
    const timestamp = value ? new Date(value).getTime() : Number.NaN;

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function pinKey(pin: EarthquakeMapPin) {
    /*
     * eventId がない pin でも sourceEntryId と組み合わせて同一性を作ります。
     * 震度別に代表 pin を先に拾う処理で、同じ pin を二重に visiblePins へ入れないための
     * 表示専用キーです。DB の主キーや Repository の識別子には影響させません。
     */
    return `${pin.eventId ?? 'no-event'}:${pin.sourceEntryId}`;
}

export function comparePinsForDisplay(left: EarthquakeMapPin, right: EarthquakeMapPin) {
    /*
     * 既存の表示順は「震度が強い順、同じ震度なら新しい報告順」です。
     * quakeIntensitySortRank は UI の震度キー定義に基づく並び替えだけを担い、
     * DB 取得順や backend DTO の順序には手を入れません。
     */
    const intensityDifference = quakeIntensitySortRank(right.maxIntensity)
        - quakeIntensitySortRank(left.maxIntensity);

    if (intensityDifference !== 0) {
        return intensityDifference;
    }

    return pinTimestamp(right) - pinTimestamp(left);
}

export function pickVisiblePins(
    filteredPins: EarthquakeMapPin[],
    selectedIntensities: QuakeIntensityKey[],
    limit: number,
) {
    const sortedPins = [...filteredPins].sort(comparePinsForDisplay);

    /*
     * 震度が未選択、または全震度が選択されている場合は、代表選出を挟まず単純に上位 limit 件を
     * 表示します。この分岐を残すことで、全件表示時の既存の並びと件数制限を変えません。
     */
    if (
        selectedIntensities.length === 0
        || selectedIntensities.length === quakeIntensityKeys.length
    ) {
        return sortedPins.slice(0, limit);
    }

    const pickedPins: EarthquakeMapPin[] = [];
    const pickedKeys = new Set<string>();

    /*
     * 一部の震度だけがONの場合は、ONにした震度が地図上で埋もれないよう、選択震度ごとに
     * まず代表 pin を1件ずつ拾います。その後に残り枠を通常順で埋め、最後にもう一度
     * comparePinsForDisplay で並べ直すことで、描画順そのものは既存の見え方に戻します。
     */
    for (const intensity of selectedIntensities) {
        if (pickedPins.length >= limit) {
            break;
        }

        const pin = sortedPins.find((candidate) => quakeIntensityKey(candidate.maxIntensity) === intensity
            && !pickedKeys.has(pinKey(candidate)));

        if (pin) {
            pickedPins.push(pin);
            pickedKeys.add(pinKey(pin));
        }
    }

    for (const pin of sortedPins) {
        if (pickedPins.length >= limit) {
            break;
        }

        if (!pickedKeys.has(pinKey(pin))) {
            pickedPins.push(pin);
            pickedKeys.add(pinKey(pin));
        }
    }

    return pickedPins.sort(comparePinsForDisplay);
}

export function useVisibleEarthquakePins(pins: EarthquakeMapPin[]) {
    const [pinDisplayLimit, setPinDisplayLimit] = useState(PIN_DISPLAY_LIMIT_INITIAL);
    const [selectedIntensities, setSelectedIntensities] = useState<QuakeIntensityKey[]>(quakeIntensityKeys);
    const filteredPins = useMemo(() => {
        /*
         * 震度フィルターは取得済み pins の表示ON/OFFです。
         * selectedIntensities の順序は pickVisiblePins の代表選出にも使うため、
         * filter では Set 化して判定だけを高速化します。
         */
        const selectedSet = new Set(selectedIntensities);

        return pins.filter((pin) => selectedSet.has(quakeIntensityKey(pin.maxIntensity)));
    }, [pins, selectedIntensities]);
    const visiblePins = useMemo(
        /*
         * 日付範囲だけは Inertia 経由で再取得します。
         * 震度ON/OFFと表示件数は、取得済み pins の見え方を調整する画面状態に留めます。
         */
        () => pickVisiblePins(filteredPins, selectedIntensities, pinDisplayLimit),
        [filteredPins, pinDisplayLimit, selectedIntensities],
    );

    return {
        filteredPins,
        visiblePins,
        selectedIntensities,
        setSelectedIntensities,
        pinDisplayLimit,
        setPinDisplayLimit,
    };
}
