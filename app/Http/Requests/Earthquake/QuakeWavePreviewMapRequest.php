<?php

namespace App\Http\Requests\Earthquake;

use App\DTO\Earthquake\Map\EarthquakeMapPinListQueryDTO;
use Illuminate\Foundation\Http\FormRequest;

class QuakeWavePreviewMapRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        /*
         * Request は日付入力の形式だけを検証します。
         * 期間を使ったDB取得条件の組み立ては Repository に渡す Query DTO 側へ寄せます。
         */
        return [
            'startDate' => ['nullable', 'date_format:Y-m-d'],
            'endDate' => ['nullable', 'date_format:Y-m-d'],
        ];
    }

    public function toQueryDTO(): EarthquakeMapPinListQueryDTO
    {
        return EarthquakeMapPinListQueryDTO::forMap(
            startDate: $this->validated('startDate'),
            endDate: $this->validated('endDate'),
        );
    }
}
