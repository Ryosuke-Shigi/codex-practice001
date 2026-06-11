<?php

namespace App\Http\Requests\DanceShortsAnalyzer;

use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerAnalyzeInputDTO;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Analyze 画面の query parameter 形式だけを検証する Request です。
 *
 * 選択動画や region の初期値解決は Query Action 側の責務として分けます。
 */
class DanceShortsAnalyzerAnalyzeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Analyze 画面で受け取る query parameter の形式だけを検証します。
     *
     * active_video_id が未指定の場合に先頭 video_id を使う判断や、region の初期選択は
     * Action 側で扱います。
     *
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'video_ids' => ['nullable', 'array', 'max:'.DanceShortsAnalyzerAnalyzeInputDTO::MAX_VIDEO_IDS],
            'video_ids.*' => ['integer', 'distinct', 'exists:dance_short_videos,id'],
            'active_video_id' => ['nullable', 'integer', 'exists:dance_short_videos,id'],
        ];
    }

    /**
     * @return array<int, int>
     */
    public function videoIds(): array
    {
        $videoIds = $this->validated('video_ids') ?? [];

        if (! is_array($videoIds)) {
            return [];
        }

        return array_values(array_map(
            fn (mixed $videoId): int => (int) $videoId,
            $videoIds,
        ));
    }

    public function activeVideoId(): ?int
    {
        $activeVideoId = $this->validated('active_video_id');

        return $activeVideoId === null ? null : (int) $activeVideoId;
    }
}
