<?php

namespace App\Services\Earthquake;

use App\DTO\Earthquake\Preview\EarthquakeExtractedEntryDTO;
use App\DTO\Earthquake\Preview\EarthquakeExtractedEntryListDTO;
use App\DTO\Earthquake\Preview\EarthquakeXmlEntryPreviewDTO;
use App\DTO\Earthquake\Preview\EarthquakeXmlEntryPreviewListDTO;

/**
 * JMA Atom entry 一覧から、地震系 entry だけを抽出する Preview Service です。
 *
 * Repository は XML 取得だけ、EarthquakeXmlPreviewService は Atom XML の表層 parsing、
 * この Service は entry の暫定抽出だけを担当します。個別 XML 電文の本文解析、
 * DB 保存、地図 pin 変換、表示 DTO 生成はここには置きません。
 */
class EarthquakeEntryExtractService
{
    /*
     * 暫定の地震系キーワードです。
     * 個別 XML の Control/Head/Body を読む前なので、まず Atom entry の title/category だけで
     * Preview に必要な候補を絞ります。確定分類ロジックに育てる場合も、この Service 内で差し替えます。
     */
    private const INCLUDE_TERMS = ['地震', '震源', '震度', '津波'];

    public function extractAll(EarthquakeXmlEntryPreviewListDTO $entries): EarthquakeExtractedEntryListDTO
    {
        /*
         * ListDTO の items は DTO の配列として受け取り、配列のまま文字列検索しないようにします。
         * これにより XML parse 結果の形が変わっても、型の入口で壊れ方が分かりやすくなります。
         */
        $items = array_values(array_filter(
            $entries->items,
            fn (EarthquakeXmlEntryPreviewDTO $entry): bool => $this->isEarthquakeEntry($entry),
        ));

        return new EarthquakeExtractedEntryListDTO(array_map(
            fn (EarthquakeXmlEntryPreviewDTO $entry): EarthquakeExtractedEntryDTO => EarthquakeExtractedEntryDTO::fromXmlEntryPreview($entry),
            $items,
        ));
    }

    public function extractLatest(EarthquakeXmlEntryPreviewListDTO $entries): ?EarthquakeExtractedEntryDTO
    {
        return $this->latestFromExtractedEntries($this->extractAll($entries));
    }

    public function latestFromExtractedEntries(EarthquakeExtractedEntryListDTO $entries): ?EarthquakeExtractedEntryDTO
    {
        if ($entries->items === []) {
            return null;
        }

        $items = $entries->items;

        /*
         * updatedAt を優先し、なければ publishedAt で比較します。
         * strtotime() できない entry は timestamp 0 として扱い、自然に後ろへ回します。
         * 最新候補の選択は DTO ではなく、entry 抽出 Service のルールとして固定します。
         */
        usort(
            $items,
            fn (EarthquakeExtractedEntryDTO $left, EarthquakeExtractedEntryDTO $right): int => $this->entryTimestamp($right) <=> $this->entryTimestamp($left),
        );

        return $items[0];
    }

    private function isEarthquakeEntry(EarthquakeXmlEntryPreviewDTO $entry): bool
    {
        $title = $entry->title;
        $category = $entry->rawCategory ?? '';

        /*
         * title に火山が出ているものは、地震波 preview の対象から外します。
         * rawCategory には JMA 側の広い分類として「地震火山関連」が入ることがあるため、
         * rawCategory の火山だけで即除外すると「震源・震度に関する情報」まで落としてしまいます。
         */
        if ($this->contains($title, '火山')) {
            return false;
        }

        $titleHasTarget = $this->containsAny($title, self::INCLUDE_TERMS);
        $categoryHasTarget = $this->containsAny($category, self::INCLUDE_TERMS);

        if (! $titleHasTarget && ! $categoryHasTarget) {
            return false;
        }

        /*
         * rawCategory だけで地震系に見えるが同時に火山も含む場合は、広い分類の可能性が高いため
         * title 側にも地震/震源/震度/津波の手がかりがある entry だけ採用します。
         */
        if (! $titleHasTarget && $this->contains($category, '火山')) {
            return false;
        }

        return true;
    }

    /**
     * @param  array<int, string>  $needles
     */
    private function containsAny(string $haystack, array $needles): bool
    {
        foreach ($needles as $needle) {
            if ($this->contains($haystack, $needle)) {
                return true;
            }
        }

        return false;
    }

    private function contains(string $haystack, string $needle): bool
    {
        // JMA の日本語 title/category をそのまま判定するため、mb_strpos() を使います。
        return mb_strpos($haystack, $needle) !== false;
    }

    private function entryTimestamp(EarthquakeExtractedEntryDTO $entry): int
    {
        /*
         * updatedAt / publishedAt は JMA Atom 由来の文字列なので、Preview 段階では timestamp 化に留めます。
         */
        $value = $entry->updatedAt ?? $entry->publishedAt;
        $timestamp = is_string($value) ? strtotime($value) : false;

        return $timestamp === false ? 0 : $timestamp;
    }
}
