<?php

namespace App\Services\ApiCatalog;

use App\DTO\ApiCatalog\Sync\ApiCatalogItemDTO;
use App\DTO\ApiCatalog\Sync\ApiCatalogSyncResultDTO;
use App\Models\ApiCatalogCache;
use App\Repositories\ApiCatalog\ApiCatalogCacheRepositoryInterface;
use App\Repositories\ApiCatalog\ApisGuruRepositoryInterface;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use InvalidArgumentException;
use JsonException;
use Throwable;

class ApiCatalogSyncService
{
    private const TEXT_COLUMN_MAX_BYTES = 65535;

    public function __construct(
        private readonly ApisGuruRepositoryInterface $apisGuruRepository,
        private readonly ApiCatalogCacheRepositoryInterface $cacheRepository,
    ) {}

    public function sync(): ApiCatalogSyncResultDTO
    {
        $apiList = $this->apisGuruRepository->fetchList();
        $syncedAt = CarbonImmutable::now();

        $totalCount = count($apiList);
        $insertedCount = 0;
        $updatedCount = 0;
        $skippedCount = 0;
        $failedCount = 0;
        $activeApiKeys = [];

        foreach ($apiList as $apiKey => $apiPayload) {
            if (! is_string($apiKey)) {
                $failedCount++;

                continue;
            }

            $activeApiKeys[] = $apiKey;

            if (! is_array($apiPayload)) {
                $failedCount++;

                continue;
            }

            try {
                $item = $this->makeItemDTO($apiKey, $apiPayload);
                $existing = $this->cacheRepository->findByApiKey($item->apiKey);

                if ($existing === null) {
                    $this->cacheRepository->insert($item, $syncedAt);
                    $insertedCount++;

                    continue;
                }

                if ($this->shouldUpdate($existing, $item)) {
                    $this->cacheRepository->update($existing, $item, $syncedAt);
                    $updatedCount++;

                    continue;
                }

                $skippedCount++;
            } catch (Throwable) {
                $failedCount++;
            }
        }

        $inactiveCount = $this->cacheRepository->markMissingAsInactive($activeApiKeys, $syncedAt);

        return new ApiCatalogSyncResultDTO(
            totalCount: $totalCount,
            insertedCount: $insertedCount,
            updatedCount: $updatedCount,
            skippedCount: $skippedCount,
            inactiveCount: $inactiveCount,
            failedCount: $failedCount,
        );
    }

    /**
     * @param  array<string, mixed>  $apiPayload
     *
     * @throws JsonException
     */
    private function makeItemDTO(string $apiKey, array $apiPayload): ApiCatalogItemDTO
    {
        if ($apiKey === '') {
            throw new InvalidArgumentException('API key must not be empty.');
        }

        [$providerKey, $serviceKey] = $this->splitApiKey($apiKey);
        $preferredVersion = $this->stringOrNull($apiPayload['preferred'] ?? null);
        $preferredPayload = $this->preferredVersionPayload($apiPayload, $preferredVersion);
        $info = $this->arrayOrEmpty($preferredPayload['info'] ?? null);

        return new ApiCatalogItemDTO(
            apiKey: $apiKey,
            providerKey: $providerKey,
            serviceKey: $serviceKey,
            title: $this->stringOrNull($info['title'] ?? null),
            description: $this->textOrNull($info['description'] ?? null),
            preferredVersion: $preferredVersion,
            openapiJsonUrl: $this->stringOrNull($preferredPayload['swaggerUrl'] ?? null),
            openapiYamlUrl: $this->stringOrNull($preferredPayload['swaggerYamlUrl'] ?? null),
            openapiVersion: $this->stringOrNull($preferredPayload['openapiVer'] ?? null),
            sourceLatestUpdatedAt: $this->sourceLatestUpdatedAt($preferredPayload['updated'] ?? null),
            payloadHash: $this->payloadHash($apiPayload),
        );
    }

    /**
     * @return array{0: string, 1: string|null}
     */
    private function splitApiKey(string $apiKey): array
    {
        $parts = explode(':', $apiKey, 2);
        $providerKey = $parts[0];

        if ($providerKey === '') {
            throw new InvalidArgumentException('Provider key must not be empty.');
        }

        $serviceKey = isset($parts[1]) && $parts[1] !== '' ? $parts[1] : null;

        return [$providerKey, $serviceKey];
    }

    /**
     * @param  array<string, mixed>  $apiPayload
     * @return array<string, mixed>
     */
    private function preferredVersionPayload(array $apiPayload, ?string $preferredVersion): array
    {
        $versions = $apiPayload['versions'] ?? null;

        if (! is_array($versions) || $preferredVersion === null) {
            return [];
        }

        $preferredPayload = $versions[$preferredVersion] ?? null;

        return is_array($preferredPayload) ? $preferredPayload : [];
    }

    /**
     * @return array<string, mixed>
     */
    private function arrayOrEmpty(mixed $value): array
    {
        return is_array($value) ? $value : [];
    }

    private function stringOrNull(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value)) {
            $value = trim($value);

            return $value !== '' ? $value : null;
        }

        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }

        return null;
    }

    private function textOrNull(mixed $value): ?string
    {
        $text = $this->stringOrNull($value);

        if ($text === null) {
            return null;
        }

        return mb_strcut($text, 0, self::TEXT_COLUMN_MAX_BYTES, 'UTF-8');
    }

    private function sourceLatestUpdatedAt(mixed $value): ?CarbonImmutable
    {
        $updatedAt = $this->stringOrNull($value);

        if ($updatedAt === null) {
            return null;
        }

        try {
            return CarbonImmutable::parse($updatedAt)->utc();
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @param  array<string, mixed>  $apiPayload
     *
     * @throws JsonException
     */
    private function payloadHash(array $apiPayload): string
    {
        return hash(
            'sha256',
            json_encode(
                $this->canonicalize($apiPayload),
                JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION,
            ),
        );
    }

    private function canonicalize(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        if (! array_is_list($value)) {
            ksort($value);
        }

        foreach ($value as $key => $item) {
            $value[$key] = $this->canonicalize($item);
        }

        return $value;
    }

    private function shouldUpdate(ApiCatalogCache $existing, ApiCatalogItemDTO $item): bool
    {
        return $existing->payload_hash !== $item->payloadHash
            || ! $this->sameDate($existing->source_latest_updated_at, $item->sourceLatestUpdatedAt)
            || $existing->is_active !== true;
    }

    private function sameDate(?CarbonInterface $existing, ?CarbonInterface $incoming): bool
    {
        return $this->dateForComparison($existing) === $this->dateForComparison($incoming);
    }

    private function dateForComparison(?CarbonInterface $date): ?string
    {
        return $date?->format('Y-m-d H:i:s');
    }
}
