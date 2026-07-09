<?php

namespace Tests\Feature\Storage;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;
use Tests\TestCase;

class StorageSmokeTestCommandTest extends TestCase
{
    protected function tearDown(): void
    {
        Str::createUuidsNormally();

        parent::tearDown();
    }

    public function test_command_writes_reads_and_deletes_temporary_object_on_fake_s3(): void
    {
        Storage::fake('s3');
        Str::createUuidsUsing(fn () => Uuid::fromString('00000000-0000-4000-8000-000000000001'));

        $path = 'system/storage-smoke-tests/00000000-0000-4000-8000-000000000001.txt';

        $this
            ->artisan('storage:smoke-test --disk=s3')
            ->expectsOutput("Storage smoke test started. disk=s3 path={$path}")
            ->expectsOutput('write: ok')
            ->expectsOutput('exists_after_write: ok')
            ->expectsOutput('read: ok')
            ->expectsOutput('delete: ok')
            ->expectsOutput('exists_after_delete: ok')
            ->expectsOutput("Storage smoke test completed. disk=s3 path={$path}")
            ->assertExitCode(0);

        Storage::disk('s3')->assertMissing($path);
        $this->assertSame([], Storage::disk('s3')->allFiles('system/storage-smoke-tests'));
    }
}
