/**
 * Japan Quake Wave Map の SVG 地図描画 Component です。
 *
 * pins と layer state を描画要素へ変換し、pin の取得条件や同期処理は持ちません。
 */
import { useMemo } from 'react';

import EarthquakeMapPinMarker from '@/Components/JapanQuakeWaveMap/EarthquakeMapPinMarker';
import EarthquakeMapRipple from '@/Components/JapanQuakeWaveMap/EarthquakeMapRipple';
import type { MapLayerVisibility } from '@/Components/JapanQuakeWaveMap/MapLayerControlPanel';
import {
    mapViewBox,
    projectCoordinateToMap,
} from '@/Components/JapanQuakeWaveMap/mapProjection';
import PlateBoundaryLayer from '@/Components/JapanQuakeWaveMap/PlateBoundaryLayer';
import type { EarthquakeMapPin } from '@/Components/JapanQuakeWaveMap/JapanQuakeWaveMap';

type JapanSimpleMapProps = {
    pins: EarthquakeMapPin[];
    layers: MapLayerVisibility;
    selectedPin: EarthquakeMapPin | null;
    onSelectPin: (pin: EarthquakeMapPin) => void;
};

type PinPlacement = {
    displayOrder: number;
    eventKey: string;
    pin: EarthquakeMapPin;
    xPercent: number;
    yPercent: number;
    visual: EarthquakeMapPinVisual;
};

type EarthquakeMapPinVisual = {
    color: string;
    label: string;
    markerSize: number;
    fontClassName: string;
    ringCount: number;
    rippleSize: number;
    durationSeconds: number;
};

function intensityRank(maxIntensity: string | null) {
    /*
     * 気象庁XML由来の震度は "5-" や "5+" のような文字列もあり得ます。
     * 今回の第1段階では細かな強弱記号までは分けず、先頭数字だけで
     * 「5弱以上 / 3〜4 / 1〜2 / 不明」の表示カテゴリへ寄せます。
     */
    const normalized = maxIntensity?.trim();

    if (!normalized || normalized === '?' || normalized === '不明') {
        return null;
    }

    const leadingNumber = Number.parseInt(normalized.slice(0, 1), 10);

    if (Number.isNaN(leadingNumber)) {
        return null;
    }

    return leadingNumber;
}

/*
 * Natural Earth / DataHub の Japan feature を、UI モック用に軽量化した
 * SVG path です。背景は塗らず、WaterBackground が透ける地図レイヤーにします。
 */
const japanLandPaths = [
    'M 256.6 391.3 L 253.6 395.3 L 252.8 391.9 L 251.5 396.6 L 249.1 397.3 L 251.1 394.2 L 249.5 393.1 L 248.8 394.9 L 243.9 395.6 L 240 399.2 L 237.8 399.4 L 237 394.3 L 233.3 394.4 L 230.6 397.9 L 229.3 410.6 L 227 412.7 L 228 409.7 L 222.6 405.6 L 221 406.5 L 222 404.7 L 220.2 403.8 L 217 404.4 L 216.7 406 L 214.6 404.5 L 213.7 406.2 L 212.6 404.3 L 209.7 408 L 204.9 404 L 201.5 407.6 L 201.8 394.6 L 204.8 393.4 L 202.7 392.9 L 203.2 391.9 L 207.9 393.8 L 207.8 391.8 L 210.2 392.5 L 208.6 393.8 L 213.1 392 L 217.1 384.5 L 222.7 382.7 L 234.6 368 L 239.6 364.2 L 239.6 359.5 L 246.8 357.1 L 249.5 354.4 L 254.2 355.2 L 253.2 357.7 L 256.2 359.1 L 260.1 356.6 L 274.3 356.1 L 280.8 352.1 L 289.3 353.1 L 295.8 348.9 L 297.5 352.1 L 294.9 356.2 L 296.2 354.7 L 297.8 359.3 L 299.6 358.2 L 298.2 356.4 L 300.9 354.3 L 302.3 357.9 L 304.9 356.3 L 304.3 358.1 L 306.5 357.9 L 306.9 355.4 L 308.9 356.5 L 308.4 353 L 312.1 353.5 L 311.6 350.3 L 312.9 349.1 L 314 352.5 L 314.7 348.8 L 311.7 341.6 L 315.2 333.6 L 320.8 329.1 L 327.5 318.3 L 329.2 310.3 L 327.1 304.9 L 329.5 297.7 L 339.7 292.9 L 341.8 293.5 L 339.2 300.3 L 336.6 300.6 L 334.5 303.8 L 333.1 302.2 L 331.2 307.2 L 333.8 308.2 L 335.2 306.5 L 334.3 314.9 L 340.7 317.4 L 343.9 311.8 L 361.2 303.8 L 367.8 297.6 L 374.5 283.2 L 386.8 272.9 L 388.2 263.2 L 394.3 251.6 L 399.1 235.3 L 399.8 219.4 L 397.5 217 L 394 218.3 L 392.7 214.2 L 396.4 214.3 L 399.5 206.3 L 399.8 202.4 L 396.2 194.3 L 400.2 189.2 L 401.9 190 L 405.1 187.8 L 406.2 180.9 L 407.3 182.3 L 408.1 181 L 404.6 177.9 L 406.7 173.3 L 409.3 175.9 L 411.1 174.6 L 413 175.6 L 414.5 186.5 L 417.7 185.5 L 418.5 181.5 L 423.7 185.9 L 426.9 176.9 L 425.4 173.4 L 422.2 176 L 415.8 177.2 L 418.9 164.6 L 426.9 170.5 L 430.9 168.1 L 429.3 180.9 L 430.4 192.4 L 438.9 205.8 L 439.2 211.5 L 441.5 213.9 L 442.7 221.1 L 441.7 226.2 L 443.4 225.3 L 444.1 228.2 L 441.6 231 L 443.9 230.8 L 440.6 235.2 L 442.2 234.5 L 440.4 237 L 440.8 240.3 L 439.2 240.9 L 440.7 242.6 L 438.6 242.8 L 439.3 245 L 436.7 244.6 L 436.8 247.3 L 434.8 246.2 L 435.5 250.5 L 433.7 249.5 L 432.2 253.2 L 433.2 255.2 L 431 256.6 L 432.5 257.5 L 431.1 259.5 L 432.8 261.1 L 431.1 264 L 432.8 265.4 L 432.3 269.2 L 430.2 265.6 L 427.5 264.7 L 424.6 267.4 L 422.6 266.2 L 420.2 272.3 L 419.2 278.8 L 421.4 286.4 L 421.1 305.4 L 420.1 310.8 L 416.7 313.3 L 415.3 317.1 L 411.5 332.6 L 413.3 341.2 L 418.3 350.6 L 413.6 351.6 L 409.7 355.5 L 407.4 368 L 402.2 369.7 L 397.6 376.6 L 394 375 L 396.4 373.6 L 396.3 365.7 L 394.5 363.4 L 401.5 355.5 L 398.9 352.2 L 394.7 354.3 L 394.2 352.7 L 394.6 357.2 L 391.5 359.1 L 391.6 364.1 L 393.7 365.6 L 392.4 369.1 L 390.9 369.3 L 389.4 363.8 L 381.5 365.2 L 379.2 371.2 L 380.6 377.7 L 377.4 384.8 L 374 386.5 L 372.1 383.5 L 372.4 374.2 L 375.6 372.6 L 373.3 369.7 L 367.9 370.5 L 367 374.2 L 363.8 376.3 L 360.6 382.8 L 360.9 386.6 L 355.2 384.3 L 346.1 383.9 L 334.6 387.1 L 335.8 384.3 L 336.6 385.6 L 341.6 382.3 L 340.3 379.7 L 334.6 380.5 L 333.7 376 L 332.4 380.8 L 333.6 383.3 L 331.1 381.9 L 330.4 375.1 L 331.7 370.8 L 330.9 372.3 L 330.5 371.1 L 330.7 372.6 L 326.8 374.1 L 323.8 383.8 L 324.5 386.3 L 332.4 391.7 L 331.9 397 L 329.7 397.5 L 330.9 395.7 L 327.8 396.1 L 327.8 394.9 L 319.8 399.7 L 319.2 402.7 L 317.3 403.2 L 318.4 406.5 L 314.8 409 L 311.7 418.6 L 307.3 423.7 L 307.4 422.1 L 300.5 419.9 L 297.9 416.1 L 299.3 414.7 L 293.4 409 L 292.1 409.4 L 294.3 404.8 L 292.9 403.4 L 293.5 401.2 L 295 400.8 L 292.2 397 L 298.9 390.1 L 299.8 383.4 L 296.4 383.2 L 296.1 384.8 L 291.8 385.6 L 285.3 381.1 L 279.8 380.4 L 276.8 383 L 273.7 382.3 L 275.2 383.3 L 272.4 386.5 L 267.8 386.8 L 270.2 387 L 267.8 391.1 L 264.7 391.4 L 263.2 388.7 L 257.7 392 L 258.8 390.1 L 256.5 391.1 Z',
    'M 524.3 105.5 L 525.4 106.2 L 521.3 108 L 519.2 112.5 L 510.6 113.8 L 511.3 115.4 L 507.7 116.5 L 508 118.2 L 505.5 118.5 L 503.3 116.4 L 502.1 120.3 L 496 119.9 L 493 117.8 L 483.5 122.9 L 476.8 130.6 L 471.9 139.7 L 469.5 152.2 L 463.4 146.5 L 452.6 141.2 L 438.6 130.7 L 430.2 131.8 L 420.4 140.3 L 415.1 131.8 L 410.1 131.3 L 406.3 136 L 405.6 141.6 L 411.1 146.5 L 414.7 145.6 L 425.3 156.3 L 421.1 159.1 L 417.1 157.2 L 414.6 158 L 415 155.9 L 413.6 155.4 L 412.3 158.3 L 409.1 160.1 L 408.6 164.9 L 403.8 169 L 400.1 167.7 L 398.8 163.2 L 402.4 150.4 L 394.6 142 L 395.8 129.8 L 400.4 127.7 L 403.2 124 L 405.3 125.7 L 410.5 118 L 406.6 111.2 L 407.1 107.5 L 409.8 106 L 416.5 111.6 L 421.2 110.6 L 421.4 112.3 L 424.6 113.4 L 430.1 107.7 L 428.2 95.1 L 434.8 87.9 L 435.1 77.1 L 438.1 66.8 L 437.3 57.6 L 433.4 47.4 L 435.4 39.6 L 435.9 41.1 L 438.8 40.5 L 441.4 37.3 L 463.9 67.2 L 473.1 75.8 L 481.1 79.9 L 479 80.1 L 480.1 82.3 L 488.6 81.8 L 489.3 85.3 L 491.2 82.1 L 494.2 87.3 L 502 88.7 L 515.1 74.9 L 515.7 78 L 509.2 93.1 L 516.2 108.1 L 513.2 107.4 L 518.9 110.6 L 520.3 107.2 L 524.2 105.5 Z',
    'M 218.4 454.3 L 211.5 489.6 L 208.7 486.9 L 205.7 487.1 L 204.4 489.9 L 207 492.5 L 202.8 497.6 L 196.7 501.4 L 199.7 490.5 L 197.5 484 L 195.2 482.7 L 197.3 481.7 L 198.9 483.4 L 199.3 478.8 L 196.4 478.6 L 193.9 485.1 L 194.6 490.8 L 196.8 492.8 L 195.2 496.5 L 192.2 493.5 L 187.3 493.6 L 185 488.4 L 187.4 489.3 L 189.7 483.5 L 186.2 476.2 L 187.5 475.3 L 186.3 466.5 L 189.4 465.7 L 193.5 458.7 L 196.9 448.8 L 192.2 449.6 L 196 447 L 195.7 444.4 L 192 440 L 191.6 434.7 L 187.7 431.5 L 185.2 433.7 L 187.3 438.3 L 184.7 441.5 L 189.8 442.1 L 190.3 447.5 L 186 450.5 L 185.2 447.6 L 186.9 445.5 L 184.5 444.1 L 181.5 445.1 L 176.8 451.3 L 179.4 446.3 L 174.6 439.9 L 175.5 434.5 L 176.8 437.8 L 178.6 438.2 L 178 441.5 L 182.5 442.5 L 181.3 437 L 176.9 435.4 L 176.1 432.3 L 175.2 434.3 L 174.9 431.5 L 172.7 430.3 L 173.3 425.7 L 175.4 424.8 L 179.2 428.6 L 179.6 424.8 L 177.8 423 L 179.6 423.4 L 179.3 419.9 L 182.8 423.3 L 186.1 420.5 L 184.5 419.2 L 186.9 416.3 L 188.7 419.2 L 190.9 418.2 L 191.1 416.1 L 188.7 415.8 L 192.1 414.6 L 193 410.2 L 198.8 407.4 L 202.2 409 L 204.3 406.7 L 203.3 411.4 L 206.4 417.6 L 212.1 419.2 L 215.4 415.9 L 218.6 416.2 L 220.1 422 L 217 426.4 L 215.1 425.9 L 215.2 428.8 L 223.7 429 L 221.7 433.5 L 223.9 433.5 L 223.2 435.1 L 225.7 434.6 L 223.7 438.1 L 227.6 439.4 L 219.4 450.9 L 220.1 453.8 L 218.8 454.4 Z',
    'M 284.1 411.1 L 285.4 410.8 L 275.9 419.2 L 273 430 L 267.5 421.8 L 263.5 420.4 L 253.8 425.9 L 252.4 432.5 L 247.5 438 L 247.5 446.8 L 245.6 444.6 L 239.4 445.5 L 241.2 440.4 L 237.9 439.6 L 236.7 441 L 236 436.2 L 234.1 436.9 L 236.4 433.3 L 234.4 431 L 236.3 432.1 L 237.7 430.3 L 237.2 427.5 L 234 427.3 L 234.9 423.3 L 232.5 422.7 L 226 426.4 L 240.5 414.7 L 241.2 408.6 L 245.7 403.4 L 245.3 401.6 L 246.2 401.1 L 250.2 407.7 L 254.5 405.9 L 258.6 406.7 L 261.4 403 L 259.6 397.3 L 262.7 398.2 L 267.8 393.6 L 270.9 394.5 L 272.3 393 L 272.8 395.2 L 273.9 394.2 L 278.7 398.9 L 283.2 397.9 L 282.1 404.6 L 284.2 407.1 L 284.1 410.8 Z',
    'M 146.4 635.8 L 142.1 643.6 L 135.9 647.2 L 137.3 651.4 L 135.4 651.2 L 134.7 656.8 L 131.5 658.6 L 133.1 647.5 L 138.2 643.3 L 136.4 639.1 L 140.3 640.7 L 144.6 633 L 146.3 635.3 Z',
    'M 365.8 275.5 L 368.4 275.3 L 366.7 280.7 L 360.9 284.2 L 363.3 278.8 L 361.3 278.4 L 361.1 275.4 L 367 267.4 L 365.7 276 Z',
    'M 176.1 582.6 L 170.5 588.1 L 168.9 593.5 L 166.6 590 L 163.9 589.4 L 166.6 589.2 L 166.5 586.8 L 175.9 581.5 Z',
    'M 290.9 386.1 L 288.6 393.7 L 289.9 396.9 L 285 399.5 L 283.4 396.4 L 290.4 386.3 Z',
    'M 185.9 452 L 186.8 458.7 L 182.3 463.4 L 181.6 461.4 L 183.8 459.7 L 182 458.9 L 182.5 452.5 L 185.5 452 Z',
    'M 197.1 521.5 L 195 525.9 L 191.9 525.8 L 190.6 520.8 L 193.3 518.5 L 196.3 520.6 Z',
    'M 170.6 385.8 L 168.2 396 L 167.5 393.3 L 165.7 394.2 L 167.5 390.9 L 167 387.4 L 170.5 383.2 L 170.8 385.7 Z',
    'M 205.2 506.6 L 205.4 513.9 L 203.3 521.5 L 201.3 522.4 L 200.9 518.4 L 205.1 506.7 Z',
    'M 158.1 448 L 158.6 449 L 156 448.8 L 155.8 451.2 L 152.1 449.9 L 153.4 444.5 L 154.2 445.7 L 156.6 443.9 L 157.6 447.5 Z',
    'M 167.5 396.6 L 165.5 402.7 L 165.3 395 L 167.3 396.4 Z',
    'M 255.4 332.9 L 254.5 336.6 L 251.7 335.1 L 253.8 330.7 L 255.4 332.7 Z',
    'M 48.3 712.7 L 50.9 713.5 L 49.6 717 L 45.2 715.7 L 47.8 712.1 Z',
    'M 160.5 603.4 L 161.4 604.6 L 159.6 607.5 L 158.1 603 L 159.6 600.1 L 160.3 602.6 Z',
    'M 428 48.5 L 426.4 50.8 L 423.8 48.5 L 424.8 46.2 L 427.3 47.4 Z',
    'M 191.3 453.1 L 192.6 453.1 L 190.3 457.5 L 190.1 455.9 L 187.7 456.9 L 187.2 454.9 L 190.9 453.2 Z',
    'M 59.5 706.6 L 57.6 713.6 L 55.4 714.3 L 54.1 711.3 L 56.9 710.9 L 59.3 706.3 Z',
    'M 162.9 437.9 L 164.7 438 L 162.2 443.4 L 160.3 439.2 L 162.6 436.8 L 163.1 432.2 L 162.9 437 Z',
    'M 172.8 424.4 L 171.4 429.7 L 168.2 431.8 L 172.1 424.6 Z',
    'M 277.1 387.9 L 276.7 391.8 L 276.1 390.6 L 274.5 392.2 L 273 388.9 L 276.8 387.9 Z',
    'M 389.5 142.1 L 387.4 148.2 L 386.5 144.3 L 389.2 142.2 Z',
    'M 230.9 409.8 L 230.7 407.1 L 232.9 408.9 L 236 407.6 L 233.9 410.6 L 231.1 410 Z',
    'M 177.6 412.8 L 176.2 415.1 L 174.8 412.8 L 175.7 409.7 L 177.6 412.6 Z',
    'M 82.4 700.2 L 83.7 701.6 L 79.6 701.8 L 79.7 696.9 L 82 700.3 Z',
    'M 422.1 39.6 L 421.7 45.5 L 420.2 39.2 L 421.7 39.7 Z',
    'M 386.6 380.6 L 387.2 383.9 L 385.2 382.6 L 386.2 380.4 Z',
    'M 177.7 475.9 L 175.8 481.6 L 175 480.4 L 177.6 476.5 Z',
    'M 394.7 433.2 L 396.6 434.7 L 395.7 436.3 L 394.2 432.7 Z',
    'M 154.3 614.8 L 150.6 617.7 L 150.7 616 L 153.2 615.4 Z',
    'M 167.2 593.5 L 168.4 594.6 L 165.6 594.2 L 164.7 591.3 L 167 593.4 Z',
    'M 237.8 403.3 L 235.7 402.8 L 237.3 399.9 L 238.2 403.1 Z',
];

function earthquakeVisual(maxIntensity: string | null): EarthquakeMapPinVisual {
    const rank = intensityRank(maxIntensity);

    /*
     * 地図表示の演出は React の責務です。
     * Repository/DTO には色・サイズ・速度を保存せず、maxIntensity からこの関数で
     * 描画用の値へ変換します。後続で時間経過やユーザー設定を加える場合もここを起点にします。
     */
    if (rank !== null && rank >= 5) {
        return {
            color: '#ef4444',
            label: `震度${maxIntensity}`,
            markerSize: 32,
            fontClassName: 'text-[10px]',
            ringCount: 4,
            rippleSize: 156,
            durationSeconds: 1.6,
        };
    }

    if (rank !== null && rank >= 3) {
        return {
            color: '#a855f7',
            label: `震度${maxIntensity}`,
            markerSize: 28,
            fontClassName: 'text-[10px]',
            ringCount: 3,
            rippleSize: 132,
            durationSeconds: 2.1,
        };
    }

    if (rank !== null && rank >= 1) {
        return {
            color: '#38bdf8',
            label: `震度${maxIntensity}`,
            markerSize: 24,
            fontClassName: 'text-[11px]',
            ringCount: 2,
            rippleSize: 108,
            durationSeconds: 2.8,
        };
    }

    return {
        color: '#e0faff',
        label: '震度不明',
        markerSize: 22,
        fontClassName: 'text-[10px]',
        ringCount: 2,
        rippleSize: 96,
        durationSeconds: 3.2,
    };
}

function pinPlacement(pin: EarthquakeMapPin, displayOrder: number): PinPlacement | null {
    /*
     * DB/DTO では latitude / longitude を string のまま扱います。
     * React の投影計算に入るこの境界だけで Number() に変換し、欠損や不正値の pin は
     * 表示対象から外して画面全体が壊れないようにします。
     */
    const latitude = Number(pin.latitude);
    const longitude = Number(pin.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
    }

    const point = projectCoordinateToMap({ latitude, longitude });

    return {
        displayOrder,
        eventKey: pin.eventId ?? `source-${pin.sourceEntryId}`,
        pin,
        xPercent: (point.x / mapViewBox.width) * 100,
        yPercent: (point.y / mapViewBox.height) * 100,
        visual: earthquakeVisual(pin.maxIntensity),
    };
}

export default function JapanSimpleMap({
    pins,
    layers,
    selectedPin,
    onSelectPin,
}: JapanSimpleMapProps) {
    /*
     * JapanSimpleMap は渡された pins を、SVG と同じ viewBox 比率で absolute 配置します。
     * 表示件数、震度フィルター、日付範囲、詳細パネルは親コンポーネント側の責務です。
     *
     * ここでは地図そのものの横幅を親幅に収めることだけを保証します。
     * 波紋やピンは absolute / overflow-visible の見た目を使うため、外側ラッパーで overflow-hidden と
     * min-w-0 を持たせ、演出の広がりがスマホの横スクロール幅として計算されないようにしています。
     */
    const pinPlacements = useMemo(
        () => pins
            .map((pin, index) => pinPlacement(pin, index + 1))
            .filter((placement): placement is PinPlacement => placement !== null),
        [pins],
    );

    return (
        <div className="relative flex min-h-[430px] w-full min-w-0 items-center justify-center overflow-hidden">
            <div className="relative aspect-[560/760] h-full max-h-[650px] w-full min-w-0 max-w-[560px]">
                <svg
                    className="pointer-events-none absolute inset-0 h-full w-full overflow-visible drop-shadow-[0_22px_48px_rgba(2,24,45,0.3)]"
                    viewBox={`0 0 ${mapViewBox.width} ${mapViewBox.height}`}
                    role="img"
                    aria-label="日本地図"
                >
                    <defs>
                        <linearGradient id="japan-map-land" x1="0" x2="1" y1="0" y2="1">
                            <stop offset="0" stopColor="#f8feff" stopOpacity="0.98" />
                            <stop offset="0.58" stopColor="#d9fbff" stopOpacity="0.88" />
                            <stop offset="1" stopColor="#a8eef7" stopOpacity="0.74" />
                        </linearGradient>
                        <filter id="japan-map-soft-glow" x="-18%" y="-18%" width="136%" height="136%">
                            <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#e6fdff" floodOpacity="0.22" />
                        </filter>
                    </defs>

                    <g
                        fill="url(#japan-map-land)"
                        filter="url(#japan-map-soft-glow)"
                        stroke="#ffffff"
                        strokeLinejoin="round"
                        strokeOpacity="0.74"
                        strokeWidth="2.2"
                    >
                        {japanLandPaths.map((path, index) => (
                            <path key={index} d={path} />
                        ))}
                    </g>

                    <PlateBoundaryLayer visible={layers.showPlateBoundaries} />
                </svg>

                <div
                    className="pointer-events-none absolute inset-0"
                    data-pin-layer
                    data-pin-count={pinPlacements.length}
                >
                    <style>
                        {`
                                @keyframes quake-map-db-ripple {
                                    0% {
                                        opacity: 0;
                                        transform: translate(-50%, -50%) scale(0.18);
                                    }
                                    12% {
                                        opacity: 0.72;
                                    }
                                    72% {
                                        opacity: 0.24;
                                    }
                                    100% {
                                        opacity: 0;
                                        transform: translate(-50%, -50%) scale(1);
                                    }
                                }

                                @media (prefers-reduced-motion: reduce) {
                                    .quake-map-db-ripple {
                                        animation: none !important;
                                        opacity: 0.38 !important;
                                        transform: translate(-50%, -50%) scale(0.76) !important;
                                    }
                                }
                            `}
                    </style>

                    {pinPlacements.map(({ displayOrder, eventKey, pin, xPercent, yPercent, visual }) => (
                        <div key={eventKey}>
                            {layers.showRipples && (
                                <EarthquakeMapRipple
                                    eventKey={eventKey}
                                    xPercent={xPercent}
                                    yPercent={yPercent}
                                    visual={visual}
                                />
                            )}
                            {layers.showPins && (
                                <EarthquakeMapPinMarker
                                    pin={pin}
                                    displayOrder={displayOrder}
                                    xPercent={xPercent}
                                    yPercent={yPercent}
                                    visual={visual}
                                    selected={selectedPin?.eventId === pin.eventId
                                        && selectedPin?.sourceEntryId === pin.sourceEntryId}
                                    showIntensityLabel={layers.showIntensityLabels}
                                    onSelect={onSelectPin}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {pinPlacements.length === 0 && (
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 rounded-lg border border-white/25 bg-slate-950/42 px-4 py-5 text-center text-sm font-semibold leading-6 text-cyan-50 shadow-[0_18px_42px_rgba(2,24,45,0.18)] backdrop-blur-md">
                    保存済みの地震ピンはありません。
                </div>
            )}
        </div>
    );
}
