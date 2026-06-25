<?php

namespace Tests\Unit\Operations\ServerHealth;

use App\DTO\Operations\ServerHealth\DailyServerHealthReportDTO;
use App\DTO\Operations\ServerHealth\DiskUsageReportDTO;
use App\DTO\Operations\ServerHealth\MySqlUsageReportDTO;
use App\Notifications\Operations\ServerHealth\DailyServerHealthReportNotification;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\AnonymousNotifiable;
use Tests\TestCase;

class DailyServerHealthReportNotificationTest extends TestCase
{
    public function test_notification_is_queued_mail_only_and_uses_plain_text_view(): void
    {
        $notification = new DailyServerHealthReportNotification($this->report());
        $notifiable = (new AnonymousNotifiable)->route('mail', 'ops@example.test');

        $this->assertInstanceOf(ShouldQueue::class, $notification);
        $this->assertSame(['mail'], $notification->via($notifiable));

        $mail = $notification->toMail($notifiable);

        $this->assertSame('【Portfolio Health】サーバー容量レポート 2026-06-25 06:00', $mail->subject);
        $this->assertSame([
            'html' => null,
            'text' => 'notifications.operations.server-health.daily-server-health-report-text',
        ], $mail->view);
        $this->assertArrayHasKey('report', $mail->viewData);
    }

    public function test_plain_text_view_contains_only_capacity_values_and_status(): void
    {
        $text = view('notifications.operations.server-health.daily-server-health-report-text', [
            'report' => $this->report(),
        ])->render();

        $this->assertSame(<<<'TEXT'
サーバー容量:
- 総容量: 100.00 GB
- 使用量: 85.00 GB
- 空き容量: 15.00 GB
- 使用率: 85%

MySQL:
- DB使用量: 2.25 GB
- binlog容量: 1.50 GB

判定:
CRITICAL
TEXT, trim($text));
    }

    public function test_plain_text_view_marks_unavailable_binlog_capacity(): void
    {
        $text = view('notifications.operations.server-health.daily-server-health-report-text', [
            'report' => new DailyServerHealthReportDTO(
                reportedAt: CarbonImmutable::parse('2026-06-25 06:00:00', 'Asia/Tokyo'),
                diskUsage: new DiskUsageReportDTO(100.0, 70.0, 30.0, 70),
                mySqlUsage: new MySqlUsageReportDTO(2.25, null),
                status: 'WARNING',
            ),
        ])->render();

        $this->assertStringContainsString('- binlog容量: 取得不可', $text);
    }

    private function report(): DailyServerHealthReportDTO
    {
        return new DailyServerHealthReportDTO(
            reportedAt: CarbonImmutable::parse('2026-06-25 06:00:00', 'Asia/Tokyo'),
            diskUsage: new DiskUsageReportDTO(100.0, 85.0, 15.0, 85),
            mySqlUsage: new MySqlUsageReportDTO(2.25, 1.5),
            status: 'CRITICAL',
        );
    }
}
