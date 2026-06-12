<?php

namespace App\Services\Earthquake;

use App\DTO\Earthquake\Preview\EarthquakeXmlEntryPreviewDTO;
use App\DTO\Earthquake\Preview\EarthquakeXmlEntryPreviewListDTO;
use App\DTO\Earthquake\Preview\EarthquakeXmlFeedPreviewDTO;
use App\Repositories\Earthquake\EarthquakeXmlRepositoryInterface;
use SimpleXMLElement;
use Throwable;

/*
 * JMA Atom feed を「Preview 画面で読める形」に変換する Service です。
 *
 * Repository が返した XML body を読み、Atom feed / entry の表層項目を DTO に詰めます。
 * MAP Preview では entry が指す個別 XML 電文から座標・最大震度などの最小項目だけ読みますが、
 * DB 保存、Queue/Scheduler、EarthquakeMapPinDTO への本格変換はここでは行いません。
 */
class EarthquakeXmlPreviewService
{
    /*
     * JMA の feed は Atom namespace 配下に title / updated / entry が入ります。
     * SimpleXML は namespace を明示して children() を取らないと entry を読み落とすため、
     * namespace URI を定数化して parse 処理の意図を残します。
     */
    private const ATOM_NAMESPACE = 'http://www.w3.org/2005/Atom';

    private const JMAXML_INFORMATION_NAMESPACE = 'http://xml.kishou.go.jp/jmaxml1/informationBasis1/';

    private const JMAXML_SEISMOLOGY_NAMESPACE = 'http://xml.kishou.go.jp/jmaxml1/body/seismology1/';

    private const JMAXML_ELEMENT_NAMESPACE = 'http://xml.kishou.go.jp/jmaxml1/elementBasis1/';

    public function __construct(
        private readonly EarthquakeXmlRepositoryInterface $repository,
        private readonly EarthquakeEntryExtractService $entryExtractService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function fetchHighFrequencyFeedPreview(): array
    {
        return $this->fetchParsedFeedPreview()['preview'];
    }

    public function parseHighFrequencyFeedBody(string $body): EarthquakeXmlFeedPreviewDTO
    {
        /*
         * Feed entry 同期でも Preview と同じ Atom parsing を使います。
         * XML 取得や DB 保存は呼び出し側 Service の責務に残し、ここでは feed DTO 化だけを再利用します。
         */
        return $this->parseAtomFeed($body);
    }

    /**
     * @return array{preview: array<string, mixed>, feed: EarthquakeXmlFeedPreviewDTO|null}
     */
    private function fetchParsedFeedPreview(): array
    {
        /*
         * Service は Repository から受け取った transport result を読み、
         * QuakeWave Preview 画面で確認したい範囲だけを DTO に移します。
         * この段階では個別 XML 電文の Report/Control/Head/Body 解析や map pin 変換は行いません。
         */
        $transport = $this->repository->fetchHighFrequencyFeed();

        if (! ($transport['success'] ?? false)) {
            return [
                'preview' => $this->failurePreview($transport, $this->safeErrorMessage($transport['error_message'] ?? null)),
                'feed' => null,
            ];
        }

        try {
            $feed = $this->parseAtomFeed((string) ($transport['body'] ?? ''));
        } catch (Throwable) {
            return [
                'preview' => $this->failurePreview($transport, 'JMA earthquake XML feed could not be parsed.'),
                'feed' => null,
            ];
        }

        return [
            'preview' => [
                'endpoint' => $transport['endpoint'],
                'method' => $transport['method'],
                'success' => true,
                'statusCode' => $transport['status_code'],
                'fetchedAt' => $transport['fetched_at'],
                'responseTimeMs' => $transport['response_time_ms'],
                'error' => null,
                'feed' => $feed->toArray(),
            ],
            'feed' => $feed,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function fetchLatestHighFrequencyEntryPreview(): array
    {
        /*
         * MAP 表示用には Atom feed 全件を React へ渡しません。
         * parse 済み DTO を EarthquakeEntryExtractService に渡して地震系 entry だけへ絞り、
         * その中の最新 1 件だけを props 化します。
         */
        $result = $this->fetchParsedFeedPreview();
        $preview = $result['preview'];
        $feed = $result['feed'];
        $extractedEntries = $feed instanceof EarthquakeXmlFeedPreviewDTO
            ? $this->entryExtractService->extractAll($feed->entries)
            : null;
        $latestEntry = $extractedEntries?->latest();
        $earthquakeReport = $latestEntry?->xmlUrl === null
            ? null
            : $this->fetchEarthquakeReportPreview($latestEntry->xmlUrl);

        return [
            'success' => $preview['success'],
            'statusCode' => $preview['statusCode'],
            'fetchedAt' => $preview['fetchedAt'],
            'responseTimeMs' => $preview['responseTimeMs'],
            'error' => $preview['error'],
            'feedTitle' => $feed?->feedTitle,
            'feedUpdatedAt' => $feed?->feedUpdatedAt,
            'entryCount' => $extractedEntries?->count() ?? 0,
            'entry' => $latestEntry?->toArray(),
            'earthquake' => $earthquakeReport['earthquake'] ?? null,
            'earthquakeError' => $earthquakeReport['error'] ?? null,
        ];
    }

    /**
     * @param  array<string, mixed>  $latestFeedEntryPreview
     * @return array<int, array<string, mixed>>
     */
    public function previewPinsFromLatestEntryPreview(array $latestFeedEntryPreview): array
    {
        $entry = $latestFeedEntryPreview['entry'] ?? null;

        if (! ($latestFeedEntryPreview['success'] ?? false) || ! is_array($entry)) {
            return [];
        }

        $earthquake = $latestFeedEntryPreview['earthquake'] ?? null;
        $occurredAt = $entry['updatedAt']
            ?? $entry['publishedAt']
            ?? $latestFeedEntryPreview['feedUpdatedAt']
            ?? $latestFeedEntryPreview['fetchedAt'];
        $latitude = is_array($earthquake) && is_numeric($earthquake['latitude'] ?? null)
            ? (float) $earthquake['latitude']
            : 36.2048;
        $longitude = is_array($earthquake) && is_numeric($earthquake['longitude'] ?? null)
            ? (float) $earthquake['longitude']
            : 138.2529;

        return [
            [
                /*
                 * React 側の地図レイヤーは EarthquakeMapPin 形の props だけを見ます。
                 * 個別 XML が読めた場合は EventID / 震源座標 / 最大震度も事実データとして使い、
                 * 読めない場合だけ Atom entry 由来の情報と仮座標に戻します。
                 */
                'eventId' => (string) ($earthquake['eventId'] ?? $entry['id'] ?? 'jma-latest-preview'),
                'title' => (string) ($entry['title'] ?? 'JMA 最新情報'),
                /*
                 * 個別 XML の Coordinate は +41.0+142.5-50000/ のような形式です。
                 * 解析できたら青森県東方沖など実際の震央に置き、失敗時のみ仮座標へ戻します。
                 */
                'latitude' => $latitude,
                'longitude' => $longitude,
                'occurredAt' => $earthquake['originTime'] ?? $occurredAt,
                /*
                 * 最大震度は Atom feed entry ではなく個別 XML の Intensity/Observation/MaxInt にあります。
                 * 読めた場合は 1, 2, 3, 4, 5-, 5+ などをそのまま渡します。
                 */
                'maxIntensity' => (string) ($earthquake['maxIntensity'] ?? '?'),
                'magnitude' => $earthquake['magnitude'] ?? null,
                'depthKm' => $earthquake['depthKm'] ?? null,
                'areaName' => (string) ($earthquake['areaName'] ?? '震源位置未解析'),
                'headline' => (string) ($earthquake['headline'] ?? 'Atom feed の最新 entry から作った MAP 表示確認用ピンです。'),
            ],
        ];
    }

    /**
     * @return array{earthquake: array<string, mixed>|null, error: array<string, mixed>|null}
     */
    private function fetchEarthquakeReportPreview(string $xmlUrl): array
    {
        /*
         * MAP Preview で位置と震度が仮表示のままだと、最新 entry が反映されたか判断しづらくなります。
         * ここでは個別 XML を一度だけ取得し、地図表示に必要な最小項目だけを読みます。
         */
        $transport = $this->repository->fetchXmlDocument($xmlUrl);

        if (! ($transport['success'] ?? false)) {
            return [
                'earthquake' => null,
                'error' => [
                    'status' => $transport['status_code'],
                    'message' => $this->safeErrorMessage($transport['error_message'] ?? null),
                ],
            ];
        }

        try {
            return [
                'earthquake' => $this->parseEarthquakeReport((string) ($transport['body'] ?? '')),
                'error' => null,
            ];
        } catch (Throwable) {
            return [
                'earthquake' => null,
                'error' => [
                    'status' => $transport['status_code'],
                    'message' => 'JMA earthquake XML document could not be parsed.',
                ],
            ];
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function parseEarthquakeReport(string $body): array
    {
        /*
         * 個別 XML は Report / Control / Head / Body がそれぞれ namespace を持ちます。
         * SimpleXML では namespace ごとに children() を切り替え、座標や M は jmx_eb 側から読みます。
         */
        $previous = libxml_use_internal_errors(true);
        libxml_clear_errors();

        try {
            $xml = simplexml_load_string($body, SimpleXMLElement::class, LIBXML_NONET | LIBXML_NOCDATA);

            if (! $xml instanceof SimpleXMLElement) {
                throw new \RuntimeException('JMA earthquake report XML parse failed.');
            }

            $head = $xml->children(self::JMAXML_INFORMATION_NAMESPACE)->Head;
            $bodyNode = $xml->children(self::JMAXML_SEISMOLOGY_NAMESPACE)->Body;
            $earthquake = $bodyNode->Earthquake;
            $hypocenterArea = $earthquake->Hypocenter->Area;
            $elementChildren = $hypocenterArea->children(self::JMAXML_ELEMENT_NAMESPACE);
            $coordinateNode = $elementChildren->Coordinate;
            $coordinate = $this->parseJmaCoordinate($this->nullableText($coordinateNode));
            $magnitude = $earthquake->children(self::JMAXML_ELEMENT_NAMESPACE)->Magnitude;

            return [
                'eventId' => $this->nullableText($head->EventID),
                'reportTitle' => $this->nullableText($head->Title),
                'originTime' => $this->nullableText($earthquake->OriginTime),
                'areaName' => $this->nullableText($hypocenterArea->Name),
                'latitude' => $coordinate['latitude'],
                'longitude' => $coordinate['longitude'],
                'depthKm' => $coordinate['depthKm'],
                'coordinateDescription' => $this->nullableText($coordinateNode->attributes()['description'] ?? null),
                'magnitude' => $this->nullableFloat($magnitude),
                'maxIntensity' => $this->nullableText($bodyNode->Intensity->Observation->MaxInt),
                'headline' => $this->nullableText($head->Headline->Text),
            ];
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }
    }

    /**
     * @return array{latitude: float|null, longitude: float|null, depthKm: float|null}
     */
    private function parseJmaCoordinate(?string $rawCoordinate): array
    {
        /*
         * JMA の震源座標は +41.0+142.5-50000/ のように
         * 緯度・経度・深さ(m) が符号付き数値で連結されています。
         */
        if ($rawCoordinate === null || ! preg_match('/^([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)?\//', $rawCoordinate, $matches)) {
            return [
                'latitude' => null,
                'longitude' => null,
                'depthKm' => null,
            ];
        }

        return [
            'latitude' => (float) $matches[1],
            'longitude' => (float) $matches[2],
            'depthKm' => isset($matches[3]) ? abs((float) $matches[3]) / 1000 : null,
        ];
    }

    private function parseAtomFeed(string $body): EarthquakeXmlFeedPreviewDTO
    {
        /*
         * Preview で外部 XML を読むため、LIBXML_NONET を付けて XML 内からの外部参照取得を抑えます。
         * パースエラーは例外全文を画面へ出さず、呼び出し側で短い message に丸めます。
         */
        $previous = libxml_use_internal_errors(true);
        libxml_clear_errors();

        try {
            $xml = simplexml_load_string($body, SimpleXMLElement::class, LIBXML_NONET | LIBXML_NOCDATA);

            if (! $xml instanceof SimpleXMLElement) {
                throw new \RuntimeException('Atom XML parse failed.');
            }

            $feed = $xml->children(self::ATOM_NAMESPACE);
            $entries = [];

            /*
             * ここでは Atom entry の一覧確認に必要な項目だけを抜きます。
             * title / updated / published / link / category / author が読めれば、
             * 次段階で個別 XML 電文を取りに行く対象を判断できます。
             */
            foreach ($feed->entry as $entry) {
                $entryChildren = $entry->children(self::ATOM_NAMESPACE);
                $entries[] = new EarthquakeXmlEntryPreviewDTO(
                    id: $this->text($entryChildren->id),
                    title: $this->text($entryChildren->title),
                    updatedAt: $this->nullableText($entryChildren->updated),
                    publishedAt: $this->nullableText($entryChildren->published),
                    xmlUrl: $this->entryXmlUrl($entryChildren),
                    rawCategory: $this->entryCategories($entryChildren),
                    rawAuthor: $this->entryAuthor($entryChildren),
                );
            }

            return new EarthquakeXmlFeedPreviewDTO(
                feedTitle: $this->nullableText($feed->title),
                feedUpdatedAt: $this->nullableText($feed->updated),
                entries: new EarthquakeXmlEntryPreviewListDTO($entries),
            );
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }
    }

    private function entryXmlUrl(SimpleXMLElement $entry): ?string
    {
        /*
         * Atom link は複数付く可能性があります。
         * 今回は「個別 XML 電文を後で取りに行ける URL」を確認したいので、
         * application/xml または alternate の href を優先して採用します。
         */
        foreach ($entry->link as $link) {
            $attributes = $link->attributes();
            $href = $this->nullableText($attributes['href'] ?? null);
            $type = $this->nullableText($attributes['type'] ?? null);
            $rel = $this->nullableText($attributes['rel'] ?? null);

            if ($href === null) {
                continue;
            }

            if ($type === 'application/xml' || $rel === 'alternate') {
                return $href;
            }
        }

        return null;
    }

    private function entryCategories(SimpleXMLElement $entry): ?string
    {
        /*
         * category は今後のフィルタや表示種別の候補ですが、現段階では正規化しません。
         * JMA feed から読めた生の term/label を Preview 画面に並べ、仕様確認の材料にします。
         */
        $categories = [];

        foreach ($entry->category as $category) {
            $attributes = $category->attributes();
            $term = $this->nullableText($attributes['term'] ?? null);
            $label = $this->nullableText($attributes['label'] ?? null);
            $categories[] = $label !== null && $term !== null ? "{$label} ({$term})" : ($label ?? $term);
        }

        $categories = array_values(array_filter($categories, fn (?string $category): bool => $category !== null));

        return $categories === [] ? null : implode(', ', $categories);
    }

    private function entryAuthor(SimpleXMLElement $entry): ?string
    {
        /*
         * author は Atom namespace の name を優先します。
         * feed によって構造差が出ても Preview が落ちにくいよう、最後に author 要素の文字列も見ます。
         */
        $author = $entry->author->children(self::ATOM_NAMESPACE);

        return $this->nullableText($author->name) ?? $this->nullableText($entry->author);
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

    private function nullableFloat(SimpleXMLElement|string|null $value): ?float
    {
        $text = $this->nullableText($value);

        return is_numeric($text) ? (float) $text : null;
    }

    /**
     * @param  array<string, mixed>  $transport
     * @return array<string, mixed>
     */
    private function failurePreview(array $transport, string $message): array
    {
        /*
         * React 側は result.error の有無だけでエラー区画を出せるようにします。
         * status は HTTP response がない場合 null になり、message は safeErrorMessage() で短く丸めます。
         */
        return [
            'endpoint' => $transport['endpoint'],
            'method' => $transport['method'],
            'success' => false,
            'statusCode' => $transport['status_code'],
            'fetchedAt' => $transport['fetched_at'],
            'responseTimeMs' => $transport['response_time_ms'],
            'error' => [
                'status' => $transport['status_code'],
                'message' => $message,
            ],
            'feed' => null,
        ];
    }

    private function safeErrorMessage(mixed $message): string
    {
        /*
         * 通信例外には環境依存のパスや長い TLS/DNS 詳細が含まれることがあります。
         * Preview 画面では調査の入口として十分な長さに切り詰め、詳細ログの代わりにはしません。
         */
        $message = is_string($message) ? trim($message) : '';

        if ($message === '') {
            return 'JMA earthquake XML feed could not be fetched.';
        }

        return mb_strimwidth($message, 0, 180, '...');
    }
}
