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
 * Repository が返した XML body を読み、Atom feed / entry の表層項目だけを DTO に詰めます。
 * 今回は取得確認が目的なので、entry が指す個別 XML 電文の Report / Control / Head / Body 解析、
 * EventID 重複判定、EarthquakeMapPinDTO 変換、DB 保存はここでは行いません。
 */
class EarthquakeXmlPreviewService
{
    /*
     * JMA の feed は Atom namespace 配下に title / updated / entry が入ります。
     * SimpleXML は namespace を明示して children() を取らないと entry を読み落とすため、
     * namespace URI を定数化して parse 処理の意図を残します。
     */
    private const ATOM_NAMESPACE = 'http://www.w3.org/2005/Atom';

    public function __construct(
        private readonly EarthquakeXmlRepositoryInterface $repository,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function fetchHighFrequencyFeedPreview(): array
    {
        /*
         * Service は Repository から受け取った transport result を読み、
         * QuakeWave Preview 画面で確認したい範囲だけを DTO に移します。
         * この段階では個別 XML 電文の Report/Control/Head/Body 解析や map pin 変換は行いません。
         */
        $transport = $this->repository->fetchHighFrequencyFeed();

        if (! ($transport['success'] ?? false)) {
            return $this->failurePreview($transport, $this->safeErrorMessage($transport['error_message'] ?? null));
        }

        try {
            $feed = $this->parseAtomFeed((string) ($transport['body'] ?? ''));
        } catch (Throwable) {
            return $this->failurePreview($transport, 'JMA earthquake XML feed could not be parsed.');
        }

        return [
            'endpoint' => $transport['endpoint'],
            'method' => $transport['method'],
            'success' => true,
            'statusCode' => $transport['status_code'],
            'fetchedAt' => $transport['fetched_at'],
            'responseTimeMs' => $transport['response_time_ms'],
            'error' => null,
            'feed' => $feed->toArray(),
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
