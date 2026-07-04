<?php

namespace App\Http\Requests\Earthquake;

use Illuminate\Foundation\Http\FormRequest;

/**
 * QuakeWave Preview の同期 status API query を解釈する Request です。
 *
 * 既存の `syncRunId` と旧 `sync_id` の両方を受け取り、IDなしの場合は null status として扱います。
 */
class QuakeWaveSyncStatusRequest extends FormRequest
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
         * 既存APIは不正・未指定のIDを 422 にせず syncStatus: null として返します。
         * ここでは形式を厳しく変えず、alias 解釈だけを Request 境界へ寄せます。
         */
        return [];
    }

    public function syncRunId(): ?int
    {
        $syncRunId = $this->integer('syncRunId');

        if ($syncRunId > 0) {
            return $syncRunId;
        }

        $legacySyncRunId = $this->integer('sync_id');

        return $legacySyncRunId > 0 ? $legacySyncRunId : null;
    }
}
