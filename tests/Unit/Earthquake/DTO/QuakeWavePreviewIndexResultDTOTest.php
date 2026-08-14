<?php

namespace Tests\Unit\Earthquake\DTO;

use App\DTO\Earthquake\Preview\EarthquakePinPreviewDTO;
use App\DTO\Earthquake\Preview\EarthquakeRipplePreviewDTO;
use App\DTO\Earthquake\Preview\EarthquakeVisualPreviewDTO;
use App\DTO\Earthquake\Preview\QuakeWavePreviewIndexResultDTO;
use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncResultDTO;
use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use Tests\TestCase;

class QuakeWavePreviewIndexResultDTOTest extends TestCase
{
    public function test_sync_run_helpers_keep_responder_boundary_shape(): void
    {
        $dto = new QuakeWavePreviewIndexResultDTO(
            mocks: [
                [
                    'id' => 'xml-preview',
                    'title' => 'XML取得プレビュー',
                    'summary' => 'Atom feed を確認します。',
                    'status' => 'Ready',
                    'href' => '/quakewave-preview/xml',
                ],
            ],
            visualPreview: new EarthquakeVisualPreviewDTO(
                pins: [
                    new EarthquakePinPreviewDTO(
                        label: '震度7',
                        maxIntensity: '7',
                        color: '#ef4444',
                        sizeLabel: 'large',
                    ),
                ],
                ripples: [
                    new EarthquakeRipplePreviewDTO(
                        label: '強い波紋',
                        maxIntensity: '7',
                        color: '#ef4444',
                        size: 112,
                        duration: '1.6s',
                        ringCount: 4,
                    ),
                ],
            ),
            savedFeedEntries: [],
            feedEntrySyncRuns: [
                new EarthquakeFeedEntrySyncResultDTO(
                    syncRunId: 10,
                    status: EarthquakeFeedEntrySyncResultDTO::STATUS_PENDING,
                    totalCount: 0,
                    insertedCount: 0,
                    updatedCount: 0,
                    skippedCount: 0,
                    failedCount: 0,
                    errorMessage: null,
                    startedAt: null,
                    finishedAt: null,
                    changedEntryIds: [101],
                ),
            ],
            savedMapPins: [],
            mapPinSyncRuns: [
                new EarthquakeMapPinSyncResultDTO(
                    syncRunId: 20,
                    status: EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED,
                    totalCount: 3,
                    insertedCount: 1,
                    updatedCount: 1,
                    skippedCount: 1,
                    failedCount: 0,
                    errorMessage: null,
                    startedAt: null,
                    finishedAt: null,
                ),
            ],
        );

        $this->assertSame('XML取得プレビュー', $dto->mocks[0]['title']);
        $this->assertSame('震度7', $dto->visualPreview->toArray()['pins'][0]['label']);
        $this->assertSame([
            [
                'syncRunId' => 10,
                'status' => 'pending',
                'isRunning' => true,
                'totalCount' => 0,
                'insertedCount' => 0,
                'updatedCount' => 0,
                'skippedCount' => 0,
                'failedCount' => 0,
                'errorMessage' => null,
                'startedAt' => null,
                'finishedAt' => null,
            ],
        ], $dto->feedEntrySyncRunsToArray());
        $this->assertSame([
            [
                'syncRunId' => 20,
                'status' => 'completed',
                'isRunning' => false,
                'totalCount' => 3,
                'insertedCount' => 1,
                'updatedCount' => 1,
                'skippedCount' => 1,
                'failedCount' => 0,
                'errorMessage' => null,
                'startedAt' => null,
                'finishedAt' => null,
            ],
        ], $dto->mapPinSyncRunsToArray());
    }
}
