<?php

namespace App\Http\Requests\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingConditionDTO;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'region' => ['nullable', 'string', 'max:20', 'regex:/\A[A-Za-z0-9_-]+\z/'],
            'comparisonDays' => ['nullable', 'integer', Rule::in(DanceShortVideoRankingConditionDTO::ALLOWED_COMPARISON_DAYS)],
            'comparison_days' => ['nullable', 'integer', Rule::in(DanceShortVideoRankingConditionDTO::ALLOWED_COMPARISON_DAYS)],
            'sort' => ['nullable', 'string', Rule::in(DanceShortVideoRankingConditionDTO::ALLOWED_SORT_KEYS)],
            'sort_key' => ['nullable', 'string', Rule::in(DanceShortVideoRankingConditionDTO::ALLOWED_SORT_KEYS)],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }

    public function regionCode(): ?string
    {
        $region = $this->validated('region');

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
}
