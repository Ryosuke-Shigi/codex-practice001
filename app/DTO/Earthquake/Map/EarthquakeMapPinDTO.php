<?php

namespace App\DTO\Earthquake\Map;

final readonly class EarthquakeMapPinDTO
{
    public function __construct(
        public ?string $eventId,
        public int $sourceEntryId,
        public ?string $title,
        public ?string $areaName,
        public ?string $headline,
        public ?string $rawCoordinate,
        public ?string $latitude,
        public ?string $longitude,
        public ?int $depthMeter,
        public ?string $magnitude,
        public ?string $maxIntensity,
        public ?string $occurredAt,
        public ?string $reportedAt,
        public ?string $comment,
    ) {
    }

    /**
     * @return array<string, int|string|null>
     */
    public function toArray(): array
    {
        return [
            'eventId' => $this->eventId,
            'sourceEntryId' => $this->sourceEntryId,
            'title' => $this->title,
            'areaName' => $this->areaName,
            'headline' => $this->headline,
            'rawCoordinate' => $this->rawCoordinate,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'depthMeter' => $this->depthMeter,
            'magnitude' => $this->magnitude,
            'maxIntensity' => $this->maxIntensity,
            'occurredAt' => $this->occurredAt,
            'reportedAt' => $this->reportedAt,
            'comment' => $this->comment,
        ];
    }
}
