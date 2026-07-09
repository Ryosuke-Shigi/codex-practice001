<?php

namespace Tests\Unit\Storage;

use App\Repositories\Storage\FileStorageRepositoryInterface;
use App\Services\Storage\ApplicationFileStorageService;
use Carbon\CarbonImmutable;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class ApplicationFileStorageServiceTest extends TestCase
{
    public function test_put_normalizes_prefix_and_returns_temporary_url_metadata(): void
    {
        $expiresAt = CarbonImmutable::parse('2026-07-09 12:00:00', 'Asia/Tokyo');
        $repository = $this->createMock(FileStorageRepositoryInterface::class);

        $repository
            ->expects($this->once())
            ->method('put')
            ->with('s3', 'lumilabo/events/photos/photo.jpg', 'image-bytes', 'private')
            ->willReturn(true);

        $repository
            ->expects($this->once())
            ->method('temporaryUrl')
            ->with('s3', 'lumilabo/events/photos/photo.jpg', $expiresAt)
            ->willReturn('https://example.test/temporary/photo.jpg');

        $repository
            ->expects($this->never())
            ->method('url');

        $storedFile = $this->service($repository)->put(
            contents: 'image-bytes',
            path: '/photos/photo.jpg',
            originalName: ' photo.jpg ',
            mimeType: ' image/jpeg ',
            size: 10,
            prefix: 'lumilabo/events/',
            temporaryUrlExpiresAt: $expiresAt,
        );

        $this->assertSame('s3', $storedFile->disk);
        $this->assertSame('lumilabo/events/photos/photo.jpg', $storedFile->path);
        $this->assertSame('photo.jpg', $storedFile->originalName);
        $this->assertSame('image/jpeg', $storedFile->mimeType);
        $this->assertSame(10, $storedFile->size);
        $this->assertSame('private', $storedFile->visibility);
        $this->assertNull($storedFile->url);
        $this->assertSame('https://example.test/temporary/photo.jpg', $storedFile->temporaryUrl);
    }

    public function test_put_rejects_dot_segments_before_calling_storage_repository(): void
    {
        $repository = $this->createMock(FileStorageRepositoryInterface::class);
        $repository->expects($this->never())->method('put');

        $this->expectException(InvalidArgumentException::class);

        $this->service($repository)->put(
            contents: 'content',
            path: '../secret.txt',
            originalName: 'secret.txt',
            mimeType: 'text/plain',
            size: 7,
        );
    }

    public function test_put_raises_when_storage_repository_fails(): void
    {
        $repository = $this->createMock(FileStorageRepositoryInterface::class);

        $repository
            ->expects($this->once())
            ->method('put')
            ->willReturn(false);

        $this->expectException(RuntimeException::class);

        $this->service($repository)->put(
            contents: 'content',
            path: 'docs/report.txt',
            originalName: 'report.txt',
            mimeType: 'text/plain',
            size: 7,
        );
    }

    private function service(FileStorageRepositoryInterface $repository): ApplicationFileStorageService
    {
        return new ApplicationFileStorageService($repository);
    }
}
