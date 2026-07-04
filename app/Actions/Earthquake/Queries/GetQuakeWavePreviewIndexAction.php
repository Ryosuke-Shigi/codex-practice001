<?php

namespace App\Actions\Earthquake\Queries;

use App\DTO\Earthquake\Preview\QuakeWavePreviewIndexResultDTO;
use App\Factories\Earthquake\EarthquakeVisualPreviewFactory;
use App\Repositories\Earthquake\EarthquakeFeedEntryRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;

final readonly class GetQuakeWavePreviewIndexAction
{
    public function __construct(
        private EarthquakeVisualPreviewFactory $visualPreviewFactory,
        private EarthquakeFeedEntryRepositoryInterface $feedEntryRepository,
        private EarthquakeFeedEntrySyncRunRepositoryInterface $syncRunRepository,
        private EarthquakeMapPinRepositoryInterface $mapPinRepository,
        private EarthquakeMapPinSyncRunRepositoryInterface $mapPinSyncRunRepository,
    ) {}

    public function execute(): QuakeWavePreviewIndexResultDTO
    {
        /*
         * QuakeWave Preview の開発入口に必要な読み取り手順をここに集めます。
         * Controller は HTTP 入口、Responder は Inertia props 整形に限定したいので、
         * 固定カード、表示確認用 preview DTO、保存済み feed / map pin、sync run 履歴の取得は
         * Query Action の責務としてまとめます。ここでは DB 更新や Job 起動は行いません。
         */
        return new QuakeWavePreviewIndexResultDTO(
            mocks: $this->mocks(),
            visualPreview: $this->visualPreviewFactory->makeDefault(),
            savedFeedEntries: $this->feedEntryRepository->latest(20),
            feedEntrySyncRuns: $this->syncRunRepository->latest(10),
            savedMapPins: $this->mapPinRepository->latest(20),
            mapPinSyncRuns: $this->mapPinSyncRunRepository->latest(10),
        );
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function mocks(): array
    {
        /*
         * preview 用の固定入口です。
         * mock / XML preview はドメインモデル化するほどの業務概念ではないため、過剰に
         * Repository や DTO を増やさず、この開発入口の Query Action 内に閉じています。
         * ただし Controller に配列定義を戻さないことで、HTTP 入口の薄さは保ちます。
         */
        return [
            [
                'id' => 'map-display',
                'title' => '地震情報MAPモック',
                'summary' => '仮データで震源ピン・波紋・震度表示・プレート境界線の見え方を確認します。',
                'status' => 'Mock',
                'href' => '/quakewave-preview/map/mock',
            ],
            [
                'id' => 'xml-preview',
                'title' => 'XML取得プレビュー',
                'summary' => '気象庁の地震火山情報 Atom フィードを取得し、entry の title / updated / link を確認します。',
                'status' => 'Ready',
                'href' => '/quakewave-preview/xml',
            ],
        ];
    }
}
