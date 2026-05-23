<?php

namespace App\Services\Earthquake;

use App\DTO\Earthquake\Map\EarthquakeMapPinDTO;
use RuntimeException;
use SimpleXMLElement;
use Throwable;

class EarthquakeDetailXmlParseService
{
    private const JMAXML_INFORMATION_NAMESPACE = 'http://xml.kishou.go.jp/jmaxml1/informationBasis1/';
    private const JMAXML_SEISMOLOGY_NAMESPACE = 'http://xml.kishou.go.jp/jmaxml1/body/seismology1/';
    private const JMAXML_ELEMENT_NAMESPACE = 'http://xml.kishou.go.jp/jmaxml1/elementBasis1/';

    public function parse(string $body, int $sourceEntryId, ?string $fallbackTitle = null): EarthquakeMapPinDTO
    {
        /*
         * 個別 XML 電文から地図ピンに必要な最小項目だけを取り出します。
         * raw XML 全文は保存せず、座標は rawCoordinate と正規化済みの文字列 latitude / longitude に分けます。
         *
         * ここでは地図表示へ必要な値だけに限定します。
         * Report 全体の完全なドメインモデル化、震度観測点一覧、津波/警報情報の詳細解析は
         * 後続フェーズに残し、map pin の入力DTOを作る責務に絞ります。
         */
        $previous = libxml_use_internal_errors(true);
        libxml_clear_errors();

        try {
            $xml = simplexml_load_string($body, SimpleXMLElement::class, LIBXML_NONET | LIBXML_NOCDATA);

            if (! $xml instanceof SimpleXMLElement) {
                throw new RuntimeException('JMA earthquake detail XML parse failed.');
            }

            $head = $xml->children(self::JMAXML_INFORMATION_NAMESPACE)->Head;
            $bodyNode = $xml->children(self::JMAXML_SEISMOLOGY_NAMESPACE)->Body;
            $earthquake = $bodyNode->Earthquake;
            $hypocenterArea = $earthquake->Hypocenter->Area;
            $coordinateNode = $hypocenterArea->children(self::JMAXML_ELEMENT_NAMESPACE)->Coordinate;
            $rawCoordinate = $this->nullableText($coordinateNode);
            $coordinate = $this->parseJmaCoordinate($rawCoordinate);
            $magnitude = $earthquake->children(self::JMAXML_ELEMENT_NAMESPACE)->Magnitude;
            $maxIntensity = isset($bodyNode->Intensity->Observation->MaxInt)
                ? $this->nullableText($bodyNode->Intensity->Observation->MaxInt)
                : null;

            return new EarthquakeMapPinDTO(
                eventId: $this->nullableText($head->EventID),
                sourceEntryId: $sourceEntryId,
                title: $this->nullableText($head->Title) ?? $fallbackTitle,
                areaName: $this->nullableText($hypocenterArea->Name),
                headline: $this->nullableText($head->Headline->Text),
                rawCoordinate: $rawCoordinate,
                latitude: $coordinate['latitude'],
                longitude: $coordinate['longitude'],
                depthMeter: $coordinate['depthMeter'],
                magnitude: $this->normalizedDecimal($this->nullableText($magnitude), 1),
                maxIntensity: $maxIntensity,
                occurredAt: $this->nullableText($earthquake->OriginTime)
                    ?? $this->nullableText($earthquake->ArrivalTime),
                reportedAt: $this->nullableText($head->ReportDateTime)
                    ?? $this->nullableText($head->TargetDateTime),
                comment: $this->nullableText($head->Comment->Text)
                    ?? $this->nullableText($head->Headline->Text),
            );
        } catch (Throwable $exception) {
            throw new RuntimeException('JMA earthquake detail XML could not be parsed.', 0, $exception);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }
    }

    public function isMappable(EarthquakeMapPinDTO $pin): bool
    {
        /*
         * 第2段階では「地図に置ける」ことを latitude / longitude と最大震度の有無で判断します。
         * 震度のない電文は、震源座標があっても地震マップ上の震度ピンとしては保存しません。
         */
        return $pin->latitude !== null
            && trim($pin->latitude) !== ''
            && $pin->longitude !== null
            && trim($pin->longitude) !== ''
            && $pin->maxIntensity !== null
            && trim($pin->maxIntensity) !== '';
    }

    /**
     * @return array{latitude: string|null, longitude: string|null, depthMeter: int|null}
     */
    private function parseJmaCoordinate(?string $rawCoordinate): array
    {
        /*
         * JMA 座標は +41.0+142.5-50000/ のように緯度・経度・深さ(m)を連結します。
         * DB decimal へ渡す値も PHP DTO 上では string のまま扱い、Model 側で float cast しません。
         * これは DECIMAL の桁をアプリ側で勝手に丸めたり、float 表現の誤差を混ぜたりしないためです。
         */
        if ($rawCoordinate === null || ! preg_match('/^([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)?\//', $rawCoordinate, $matches)) {
            return [
                'latitude' => null,
                'longitude' => null,
                'depthMeter' => null,
            ];
        }

        return [
            'latitude' => $this->normalizedDecimal($matches[1], 7),
            'longitude' => $this->normalizedDecimal($matches[2], 7),
            'depthMeter' => isset($matches[3]) ? abs((int) round((float) $matches[3])) : null,
        ];
    }

    private function text(SimpleXMLElement|string|null $value): string
    {
        return trim((string) $value);
    }

    private function nullableText(SimpleXMLElement|string|null $value): ?string
    {
        $text = $this->text($value);

        return $text === '' ? null : $text;
    }

    private function normalizedDecimal(?string $value, int $scale): ?string
    {
        if ($value === null || ! is_numeric($value)) {
            return null;
        }

        return number_format((float) $value, $scale, '.', '');
    }
}
