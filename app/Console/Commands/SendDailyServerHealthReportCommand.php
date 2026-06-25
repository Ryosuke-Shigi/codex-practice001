<?php

namespace App\Console\Commands;

use App\Actions\Operations\ServerHealth\Commands\SendDailyServerHealthReportAction;
use App\Exceptions\Operations\ServerHealth\InvalidServerHealthReportRecipientsException;
use Illuminate\Console\Command;

/**
 * DailyServerHealthReport の手動実行入口です。
 *
 * CLI option の解釈と結果表示だけを担当し、容量取得・判定・通知処理は Action へ委譲します。
 */
class SendDailyServerHealthReportCommand extends Command
{
    protected $signature = 'health:send-daily-server-report {--sync : Send the notification immediately without a queue worker.}';

    protected $description = 'Send the daily server and MySQL capacity health report notification.';

    public function handle(SendDailyServerHealthReportAction $action): int
    {
        $sync = (bool) $this->option('sync');

        try {
            $report = $action->execute(sync: $sync);
        } catch (InvalidServerHealthReportRecipientsException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->info($sync
            ? 'Daily server health report notification sent.'
            : 'Daily server health report notification queued.'
        );
        $this->line('判定: '.$report->status);

        return self::SUCCESS;
    }
}
