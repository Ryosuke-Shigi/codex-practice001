<?php

namespace App\Http\Requests\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingConditionDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * DanceShortsRadar ランキング画面の query parameter を検証する Request です。
 *
 * tab / comparisonDays / sort / window の形式と許可値だけを確認します。
 * active region の解決やランキング条件の正規化は Query Action / Service 側へ残します。
 */
class DanceShortVideoRankingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        /*
         * Request は query parameter の形式と許可値だけを検証します。
         * region が active region かどうか、未指定時にどの region を選ぶかは Query Action 側へ残します。
         */
        return [
            /*
             * region は URL に残るタブ選択値です。
             * ここでは RISING / ALL / JP / US / KR という入力形式の許可だけを行い、
             * RISING / ALL を DB region として扱うかどうかの判断はしません。
             */
            'tab' => ['nullable', 'string', Rule::in(DanceShortVideoRankingPageInputDTO::ALLOWED_REGION_QUERY_VALUES)],
            'region' => ['nullable', 'string', Rule::in(DanceShortVideoRankingPageInputDTO::ALLOWED_REGION_QUERY_VALUES)],
            'comparisonDays' => ['nullable', 'integer', Rule::in(DanceShortVideoRankingConditionDTO::ALLOWED_COMPARISON_DAYS)],
            'comparison_days' => ['nullable', 'integer', Rule::in(DanceShortVideoRankingConditionDTO::ALLOWED_COMPARISON_DAYS)],
            'sort' => ['nullable', 'string', Rule::in(DanceShortVideoRankingConditionDTO::ALLOWED_SORT_KEYS)],
            'sort_key' => ['nullable', 'string', Rule::in(DanceShortVideoRankingConditionDTO::ALLOWED_SORT_KEYS)],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
            'selectedVideoId' => ['nullable', 'integer', 'min:1'],
            'selected_video_id' => ['nullable', 'integer', 'min:1'],
            'startRank' => ['nullable', 'integer'],
            'start_rank' => ['nullable', 'integer'],
            'windowSize' => ['nullable', 'integer'],
            'window_size' => ['nullable', 'integer'],
        ];
    }

    public function regionCode(): ?string
    {
        $region = $this->validated('tab') ?? $this->validated('region');

        if (! is_string($region)) {
            return null;
        }

        $trimmedRegion = trim($region);

        return $trimmedRegion === '' ? null : $trimmedRegion;
    }

    public function comparisonDays(): int
    {
        $comparisonDays = $this->validated('comparisonDays') ?? $this->validated('comparison_days');

        return $comparisonDays === null
            ? DanceShortVideoRankingConditionDTO::DEFAULT_COMPARISON_DAYS
            : (int) $comparisonDays;
    }

    public function limit(): int
    {
        $limit = $this->validated('limit');

        return $limit === null
            ? DanceShortVideoRankingConditionDTO::DEFAULT_LIMIT
            : (int) $limit;
    }

    public function sortKey(): string
    {
        $sortKey = $this->validated('sort') ?? $this->validated('sort_key');

        return is_string($sortKey) && $sortKey !== ''
            ? $sortKey
            : DanceShortVideoRankingConditionDTO::DEFAULT_SORT_KEY;
    }

    public function startRank(): int
    {
        $startRank = $this->validated('startRank') ?? $this->validated('start_rank');

        return $startRank === null ? 1 : (int) $startRank;
    }

    public function selectedVideoId(): ?int
    {
        $selectedVideoId = $this->validated('selectedVideoId') ?? $this->validated('selected_video_id');

        return $selectedVideoId === null ? null : (int) $selectedVideoId;
    }

    public function windowSize(): int
    {
        $windowSize = $this->validated('windowSize') ?? $this->validated('window_size');

        return $windowSize === null ? 5 : (int) $windowSize;
    }
}
