<?php

namespace Tests\Feature\Storage;

use App\Services\Storage\ApplicationFileStorageService;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ApplicationFileStorageServiceTest extends TestCase
{
    public function test_put_writes_to_fake_s3_and_returns_stored_file_dto(): void
    {
        Storage::fake('s3');

        $storedFile = $this->service()->put(
            contents: 'hello s3 foundation',
            path: 'event-cards/card.txt',
            originalName: 'card.txt',
            mimeType: 'text/plain',
            size: 19,
            disk: 's3',
            prefix: 'lumilabo',
            visibility: 'private',
        );

        Storage::disk('s3')->assertExists('lumilabo/event-cards/card.txt');

        $this->assertSame('hello s3 foundation', Storage::disk('s3')->get($storedFile->path));
        $this->assertSame('private', Storage::disk('s3')->getVisibility($storedFile->path));
        $this->assertSame([
            'disk' => 's3',
            'path' => 'lumilabo/event-cards/card.txt',
            'original_name' => 'card.txt',
            'mime_type' => 'text/plain',
            'size' => 19,
            'visibility' => 'private',
            'url' => null,
            'temporary_url' => null,
        ], $storedFile->toArray());
    }

    public function test_exists_and_delete_use_fake_s3_without_external_connection(): void
    {
        Storage::fake('s3');

        $this->service()->put(
            contents: 'delete me',
            path: 'attachments/delete-me.txt',
            originalName: 'delete-me.txt',
            mimeType: 'text/plain',
            size: 9,
            disk: 's3',
            prefix: 'lumilabo',
        );

        $this->assertTrue($this->service()->exists(
            path: 'attachments/delete-me.txt',
            disk: 's3',
            prefix: 'lumilabo',
        ));

        $this->assertTrue($this->service()->delete(
            path: 'attachments/delete-me.txt',
            disk: 's3',
            prefix: 'lumilabo',
        ));

        $this->assertFalse($this->service()->exists(
            path: 'attachments/delete-me.txt',
            disk: 's3',
            prefix: 'lumilabo',
        ));
    }

    public function test_get_reads_from_fake_s3_without_external_connection(): void
    {
        Storage::fake('s3');

        $this->service()->put(
            contents: 'read me',
            path: 'storage-smoke-tests/read-me.txt',
            originalName: 'read-me.txt',
            mimeType: 'text/plain',
            size: 7,
            disk: 's3',
            prefix: 'system',
        );

        $this->assertSame('read me', $this->service()->get(
            path: 'storage-smoke-tests/read-me.txt',
            disk: 's3',
            prefix: 'system',
        ));
    }

    private function service(): ApplicationFileStorageService
    {
        return app(ApplicationFileStorageService::class);
    }
}
