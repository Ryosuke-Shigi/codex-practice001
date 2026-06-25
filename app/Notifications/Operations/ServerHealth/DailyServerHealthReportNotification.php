<?php

namespace App\Notifications\Operations\ServerHealth;

use App\DTO\Operations\ServerHealth\DailyServerHealthReportDTO;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * サーバー容量日次レポートを mail channel で通知する Notification です。
 *
 * 容量取得、判定、通知先解決は持たず、DailyServerHealthReportDTO を件名と本文へ変換します。
 */
class DailyServerHealthReportNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly DailyServerHealthReportDTO $report,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('【Portfolio Health】サーバー容量レポート '.$this->report->reportedAt->format('Y-m-d H:i'))
            ->text('notifications.operations.server-health.daily-server-health-report-text', [
                'report' => $this->report,
            ]);
    }
}
