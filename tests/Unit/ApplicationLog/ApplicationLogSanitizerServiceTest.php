<?php

namespace Tests\Unit\ApplicationLog;

use App\Models\ApplicationErrorLog;
use App\Services\ApplicationLog\ApplicationLogSanitizerService;
use Tests\TestCase;

class ApplicationLogSanitizerServiceTest extends TestCase
{
    public function test_it_checks_and_normalizes_allowed_level_and_status_values(): void
    {
        $service = new ApplicationLogSanitizerService;

        $this->assertTrue($service->isAllowedLevel('critical'));
        $this->assertTrue($service->isAllowedLevel('error'));
        $this->assertFalse($service->isAllowedLevel('debug'));
        $this->assertSame('warning', $service->normalizeLevel('WARNING'));
        $this->assertSame('error', $service->normalizeLevel('debug'));

        $this->assertTrue($service->isAllowedStatus('success'));
        $this->assertTrue($service->isAllowedStatus('failed'));
        $this->assertFalse($service->isAllowedStatus('timeout'));
        $this->assertSame('skipped', $service->normalizeStatus('SKIPPED'));
        $this->assertSame('pending', $service->normalizeStatus('timeout'));
    }

    public function test_it_removes_secret_like_values_from_messages_and_urls(): void
    {
        $service = new ApplicationLogSanitizerService;

        $message = $service->sanitizeRequiredMessage(
            'token=secret-token Authorization:Bearer abc.def user@example.test payload={"name":"Taro"}',
        );
        $url = $service->sanitizeUrl(
            'https://example.test/api/search?api_key=secret-key&keyword=dance&session=secret-session',
        );

        $this->assertStringNotContainsString('secret-token', $message);
        $this->assertStringNotContainsString('abc.def', $message);
        $this->assertStringNotContainsString('user@example.test', $message);
        $this->assertStringNotContainsString('secret-key', (string) $url);
        $this->assertStringNotContainsString('secret-session', (string) $url);
        $this->assertStringContainsString('api_key=[redacted]', (string) $url);
        $this->assertStringContainsString('keyword=dance', (string) $url);
    }

    public function test_it_keeps_file_paths_to_project_relative_or_basename_scope(): void
    {
        $service = new ApplicationLogSanitizerService;

        $this->assertSame(
            'app/Services/DanceShortsRadarService.php',
            $service->sanitizeFile(base_path('app/Services/DanceShortsRadarService.php')),
        );
        $this->assertSame(
            'app/Actions/FetchRisingCandidatesAction.php',
            $service->sanitizeFile('/var/www/app/Actions/FetchRisingCandidatesAction.php'),
        );
        $this->assertSame(
            'outside.php',
            $service->sanitizeFile('/srv/private/outside.php'),
        );
    }

    public function test_only_unresolved_error_logs_can_be_resolved(): void
    {
        $service = new ApplicationLogSanitizerService;
        $log = new ApplicationErrorLog;

        $this->assertTrue($service->canResolveErrorLog($log));

        $log->resolved_at = now();

        $this->assertFalse($service->canResolveErrorLog($log));
    }
}
