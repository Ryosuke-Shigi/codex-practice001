<?php

namespace App\DTO\DanceShortsRadar\Sync;

use Carbon\CarbonInterface;

/*
 * YouTube search.list に渡す検索条件だけを運ぶ DTO です。
 *
 * keyword / regionCode / relevanceLanguage など、検索対象を絞るために
 * Action や後続 Service が組み立てた値を Repository へ渡す境界にします。
 * API キー、part、type のような YouTube API 呼び出し自体の固定値は
 * Repository 側の責務なので、この DTO には持たせません。
 *
 * DTO の責務は値保持と API query 用配列への変換までです。
 * DB取得、Shorts判定、保存可否、増加量計算、表示用ラベル生成は行いません。
 */
final readonly class DanceShortSearchConditionDTO
{
    public function __construct(
        public string $keyword,
        public string $regionCode,
        public string $relevanceLanguage,
        public int $maxResults,
        public CarbonInterface $publishedAfter,
        public string $videoDuration,
    ) {
    }

    /**
     * search.list の可変 query parameter に変換します。
     *
     * publishedAfter は YouTube Data API が受け取れる RFC3339 形式へそろえます。
     * videoDuration=short は「4分未満」の検索条件にすぎないため、
     * この変換では Shorts 確定扱いにはしません。
     *
     * @return array{
     *     q: string,
     *     regionCode: string,
     *     relevanceLanguage: string,
     *     maxResults: int,
     *     publishedAfter: string,
     *     videoDuration: string
     * }
     */
    public function toArray(): array
    {
        return [
            'q' => $this->keyword,
            'regionCode' => $this->regionCode,
            'relevanceLanguage' => $this->relevanceLanguage,
            'maxResults' => $this->maxResults,
            'publishedAfter' => $this->publishedAfter->toRfc3339String(),
            'videoDuration' => $this->videoDuration,
        ];
    }
}
