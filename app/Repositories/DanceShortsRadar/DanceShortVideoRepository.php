<?php

namespace App\Repositories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSaveDTO;
use App\Models\DanceShortVideo;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

class DanceShortVideoRepository implements DanceShortVideoRepositoryInterface
{
    public function findByYoutubeVideoId(string $youtubeVideoId): ?DanceShortVideo
    {
        /*
         * 動画本体は地域に依存しない集約なので、youtube_video_id を一意キーとして扱います。
         * 同じ動画が JP / US / KR の検索結果に出ても、動画行は1件だけにし、
         * 地域ごとの観測値は snapshot 側で表現します。
         */
        return DanceShortVideo::query()
            ->where('youtube_video_id', $youtubeVideoId)
            ->first();
    }

    public function findByYoutubeVideoIdAndTrackingStatus(
        string $youtubeVideoId,
        string $trackingStatus,
    ): ?DanceShortVideo {
        /*
         * Repository は渡された tracking_status 条件で DB を絞るだけです。
         * どの状態を snapshot 保存対象にするかの判断は TrackingService 側に置きます。
         */
        return DanceShortVideo::query()
            ->where('youtube_video_id', $youtubeVideoId)
            ->where('tracking_status', $trackingStatus)
            ->first();
    }

    /**
     * @return array{
     *     video: DanceShortVideo,
     *     status: self::UPSERT_INSERTED|self::UPSERT_UPDATED|self::UPSERT_SKIPPED
     * }
     */
    public function upsert(DanceShortVideoSaveDTO $dto): array
    {
        /*
         * Repository は DB 反映と保存結果の分類だけを担当します。
         * 「Shorts として保存してよいか」「viewCount が必須か」の判断は Service 済みなので、
         * ここでは youtube_video_id unique を基準に insert / update / skip へ分けます。
         */
        $existing = $this->findByYoutubeVideoId($dto->youtube_video_id);

        if ($existing === null) {
            return [
                'video' => DanceShortVideo::query()->create($dto->toArray()),
                'status' => self::UPSERT_INSERTED,
            ];
        }

        if (! $this->shouldUpdate($existing, $dto)) {
            return [
                'video' => $existing,
                'status' => self::UPSERT_SKIPPED,
            ];
        }

        $existing->fill($dto->toArray());
        $existing->save();

        return [
            'video' => $existing->refresh(),
            'status' => self::UPSERT_UPDATED,
        ];
    }

    private function shouldUpdate(DanceShortVideo $existing, DanceShortVideoSaveDTO $dto): bool
    {
        /*
         * updated_at だけを動かす write を避けるため、保存予定 DTO と既存行の保存対象カラムを
         * 比較して実質差分がある場合だけ update します。statistics は動画本体に含めないため、
         * 再生数が変わっただけなら動画本体は skip し、snapshot の追加だけが行われます。
         */
        return $this->attributesForComparison($existing) !== $dto->toArray();
    }

    /**
     * @return array<string, mixed>
     */
    private function attributesForComparison(DanceShortVideo $video): array
    {
        /*
         * Eloquent の cast 後の値と DTO の保存配列を同じ形へそろえる比較用配列です。
         * published_at は秒精度の文字列、tags は添字配列に正規化し、DB ドライバや
         * JSON cast の都合で不要な update が発生しないようにします。
         */
        return [
            'youtube_video_id' => (string) $video->youtube_video_id,
            'title' => (string) $video->title,
            'description' => $video->description,
            'channel_id' => $video->channel_id,
            'channel_title' => $video->channel_title,
            'thumbnail_url' => $video->thumbnail_url,
            'published_at' => $this->dateForComparison($video->published_at),
            'url' => $video->url,
            'category_id' => $video->category_id,
            'tags' => $video->tags === null ? null : array_values($video->tags),
            'duration' => $video->duration,
            'default_language' => $video->default_language,
            'default_audio_language' => $video->default_audio_language,
            'live_broadcast_content' => $video->live_broadcast_content,
            'embeddable' => $video->embeddable,
        ];
    }

    private function dateForComparison(CarbonInterface|string|null $date): ?string
    {
        if ($date === null || $date === '') {
            return null;
        }

        if (is_string($date)) {
            return CarbonImmutable::parse($date)->format('Y-m-d H:i:s');
        }

        return $date->format('Y-m-d H:i:s');
    }
}
