<?php

namespace Tests\Feature\ApplicationLog;

use App\Models\ApplicationErrorLog;
use App\Models\ApplicationIntegrationLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ApplicationLogsPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_logs_page_returns_api_and_error_tabs_with_separated_rows(): void
    {
        ApplicationIntegrationLog::query()->create([
            'integration_type' => 'external_api',
            'service_name' => 'YouTube API',
            'action' => 'rising candidates',
            'status' => 'success',
            'message' => '取得完了',
            'method' => 'GET',
            'response_status' => 200,
            'occurred_at' => '2026-06-18 16:30:00',
        ]);
        ApplicationErrorLog::query()->create([
            'level' => 'error',
            'message' => 'DanceShortsRadar集計で例外発生',
            'exception_class' => 'RuntimeException',
            'file' => 'app/Services/DanceShortsRadarService.php',
            'line' => 128,
            'method' => 'GET',
            'occurred_at' => '2026-06-18 16:35:00',
        ]);

        $this
            ->get('/projects/logs?tab=error')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Hub', false)
                ->where('projectId', 'logs')
                ->where('applicationLogs.activeTab', 'error')
                ->where('applicationLogs.resolveConfirmationKeyword', 'resolve')
                ->where('applicationLogs.tabs.0.label', 'API連携')
                ->where('applicationLogs.tabs.1.label', 'エラー')
                ->has('applicationLogs.api.rows', 1)
                ->where('applicationLogs.api.rows.0.status', 'success')
                ->where('applicationLogs.api.rows.0.occurredAt', '2026-06-18 16:30')
                ->where('applicationLogs.api.rows.0.content', 'YouTube API / rising candidates / 取得完了')
                ->has('applicationLogs.error.rows', 1)
                ->where('applicationLogs.error.rows.0.level', 'error')
                ->where('applicationLogs.error.rows.0.occurredAt', '2026-06-18 16:35')
                ->where('applicationLogs.error.rows.0.content', 'DanceShortsRadar集計で例外発生 / RuntimeException / app/Services/DanceShortsRadarService.php:128')
                ->where('applicationLogs.error.rows.0.location', 'app/Services/DanceShortsRadarService.php:128')
                ->where('applicationLogs.error.rows.0.canResolve', true)
            );
    }

    public function test_project_select_and_logs_project_hub_entry_are_available(): void
    {
        $this
            ->get('/projects')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Select', false)
            );

        $this
            ->get('/projects/logs')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Hub', false)
                ->where('projectId', 'logs')
                ->where('applicationLogs.tabs.0.label', 'API連携')
                ->where('applicationLogs.tabs.1.label', 'エラー')
            );
    }

    public function test_error_log_cannot_be_marked_resolved_without_confirmation(): void
    {
        $log = ApplicationErrorLog::query()->create([
            'level' => 'error',
            'message' => '未対応エラー',
            'occurred_at' => '2026-06-18 10:00:00',
        ]);

        $this
            ->from('/projects/logs?tab=error')
            ->post('/application-error-logs/'.$log->getKey().'/resolve')
            ->assertRedirect('/projects/logs?tab=error')
            ->assertSessionHasErrors('confirmation');

        $this->assertNull($log->refresh()->resolved_at);
    }

    public function test_error_log_cannot_be_marked_resolved_with_invalid_confirmation(): void
    {
        $log = ApplicationErrorLog::query()->create([
            'level' => 'error',
            'message' => '未対応エラー',
            'occurred_at' => '2026-06-18 10:00:00',
        ]);

        $this
            ->from('/projects/logs?tab=error')
            ->post('/application-error-logs/'.$log->getKey().'/resolve', [
                'confirmation' => 'wrong',
            ])
            ->assertRedirect('/projects/logs?tab=error')
            ->assertSessionHasErrors('confirmation');

        $this->assertNull($log->refresh()->resolved_at);
    }

    public function test_unresolved_error_log_can_be_marked_resolved_with_confirmation_keyword(): void
    {
        $log = ApplicationErrorLog::query()->create([
            'level' => 'error',
            'message' => '未対応エラー',
            'occurred_at' => '2026-06-18 10:00:00',
        ]);

        $this
            ->post('/application-error-logs/'.$log->getKey().'/resolve', [
                'confirmation' => 'resolve',
            ])
            ->assertRedirect('/projects/logs?tab=error');

        $this->assertDatabaseHas('application_error_logs', [
            'id' => $log->getKey(),
            'resolved_by' => null,
        ]);
        $this->assertNotNull($log->refresh()->resolved_at);
    }

    public function test_confirmation_value_is_not_stored_in_log_tables(): void
    {
        $log = ApplicationErrorLog::query()->create([
            'level' => 'error',
            'message' => '未対応エラー',
            'occurred_at' => '2026-06-18 10:00:00',
        ]);

        $this->post('/application-error-logs/'.$log->getKey().'/resolve', [
            'confirmation' => 'resolve',
        ]);

        $this->assertFalse(Schema::hasColumn('application_error_logs', 'confirmation'));
        $this->assertFalse(Schema::hasColumn('application_integration_logs', 'confirmation'));
    }

    public function test_api_integration_logs_do_not_have_resolve_route(): void
    {
        $log = ApplicationIntegrationLog::query()->create([
            'integration_type' => 'external_api',
            'action' => 'rising candidates',
            'status' => 'failed',
            'occurred_at' => '2026-06-18 10:00:00',
        ]);

        $this
            ->post('/application-integration-logs/'.$log->getKey().'/resolve')
            ->assertNotFound();

        $this->assertFalse(Schema::hasColumn('application_integration_logs', 'resolved_at'));
        $this->assertFalse(Schema::hasColumn('application_integration_logs', 'resolved_by'));
    }

    public function test_resolving_missing_error_log_returns_not_found(): void
    {
        $this
            ->post('/application-error-logs/999999/resolve', [
                'confirmation' => 'resolve',
            ])
            ->assertNotFound();
    }
}
