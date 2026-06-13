<?php

namespace App\Factories\Earthquake;

use App\DTO\Earthquake\Preview\EarthquakeExtractedEntryListDTO;
use App\DTO\Earthquake\Preview\EarthquakePinPreviewDTO;
use App\DTO\Earthquake\Preview\EarthquakeRipplePreviewDTO;
use App\DTO\Earthquake\Preview\EarthquakeVisualPreviewDTO;

/**
 * QuakeWave Preview の visualPreview props 用 DTO を組み立てる Factory です。
 *
 * ここでは XML 取得や entry 抽出は行わず、抽出済み entry を受け取って
 * ピン見本 / 波紋見本の DTO を生成することだけに責務を絞ります。
 */
class EarthquakeVisualPreviewFactory
{
    /**
     * Preview 入口で使う既定の visualPreview DTO を生成します。
     */
    public function makeDefault(): EarthquakeVisualPreviewDTO
    {
        /*
         * /quakewave-preview の入口画面では、まだ XML 取得結果と visual preview を接続しません。
         * routes/web.php から DTO の直接 new を消すため、空の抽出済み entry list を Factory 内で用意します。
         */
        return $this->make(new EarthquakeExtractedEntryListDTO([]));
    }

    /**
     * 抽出済み entry list から表示確認用の visualPreview DTO を生成します。
     */
    public function make(EarthquakeExtractedEntryListDTO $entries): EarthquakeVisualPreviewDTO
    {
        /*
         * 現段階では震度別デザインの確認が主目的です。
         * 抽出済み entry が渡された場合も、Factory は抽出ロジックを持たず、
         * latest() の有無だけを見て「最新 entry 連動の余地」を残した DTO を作ります。
         */
        $latest = $entries->latest();
        $primaryLabel = $latest === null ? '震度7' : '最新地震entry';

        /*
         * ここで返す値は「震度別デザイン確認用」の固定サンプルです。
         * 抽出済み entry の件数やタイトルから震度を推定しないことで、Factory に業務判断を入れず、
         * 本番の EarthquakeMapPinDTO 変換とは別物であることを保ちます。
         */
        return new EarthquakeVisualPreviewDTO(
            pins: [
                new EarthquakePinPreviewDTO(label: $primaryLabel, maxIntensity: '7', color: '#ef4444', sizeLabel: 'large'),
                new EarthquakePinPreviewDTO(label: '震度6強', maxIntensity: '6+', color: '#f43f5e', sizeLabel: 'large'),
                new EarthquakePinPreviewDTO(label: '震度5強', maxIntensity: '5+', color: '#a855f7', sizeLabel: 'medium'),
                new EarthquakePinPreviewDTO(label: '震度4', maxIntensity: '4', color: '#38bdf8', sizeLabel: 'small'),
            ],
            ripples: [
                new EarthquakeRipplePreviewDTO(label: '強い波紋', maxIntensity: '7', color: '#ef4444', size: 112, duration: '1.6s', ringCount: 4),
                new EarthquakeRipplePreviewDTO(label: '中間波紋', maxIntensity: '5+', color: '#a855f7', size: 92, duration: '2.2s', ringCount: 3),
                new EarthquakeRipplePreviewDTO(label: '弱い波紋', maxIntensity: '4', color: '#38bdf8', size: 76, duration: '2.8s', ringCount: 2),
            ],
        );
    }
}
