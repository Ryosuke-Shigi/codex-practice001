<?php

namespace App\Actions\Operations\ServerHealth\Commands;

use App\DTO\Operations\ServerHealth\DailyServerHealthReportDTO;
use App\Notifications\Operations\ServerHealth\DailyServerHealthReportNotification;
use App\Services\Operations\ServerHealth\DiskUsageReportService;
use App\Services\Operations\ServerHealth\MySqlUsageReportService;
use App\Services\Operations\ServerHealth\ServerHealthReportRecipientResolver;
use App\Services\Operations\ServerHealth\ServerHealthStatusService;
use Carbon\CarbonImmutable;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;

/**
 * DailyServerHealthReport を取得・判定・通知する Command Action です。
 *
 * 容量取得は各 Service / Repository、判定は ServerHealthStatusService、通知先検証は
 * ServerHealthReportRecipientResolver に委譲し、ここではユースケース手順だけを扱います。
 */
class SendDailyServerHealthReportAction
{
    public function __construct(
        private readonly DiskUsageReportService $diskUsageReportService,
        private readonly MySqlUsageReportService $mySqlUsageReportService,
        private readonly ServerHealthStatusService $statusService,
        private readonly ServerHealthReportRecipientResolver $recipientResolver,
    ) {}

    public function execute(bool $sync = false): DailyServerHealthReportDTO
    {
        $diskUsage = $this->diskUsageReportService->getReport();
        $mySqlUsage = $this->mySqlUsageReportService->getReport();
        $report = new DailyServerHealthReportDTO(
            reportedAt: CarbonImmutable::now((string) config('app.timezone', 'Asia/Tokyo')),
            diskUsage: $diskUsage,
            mySqlUsage: $mySqlUsage,
            status: $this->statusService->determine($diskUsage),
        );

        $notifiables = array_map(
            fn (string $recipient): AnonymousNotifiable => (new AnonymousNotifiable)->route('mail', $recipient),
            $this->recipientResolver->resolveDailyReportMailRecipients(),
        );

        $notification = new DailyServerHealthReportNotification($report);

        if ($sync) {
            Notification::sendNow($notifiables, $notification);

            return $report;
        }

        Notification::send($notifiables, $notification);

        return $report;
    }
}
