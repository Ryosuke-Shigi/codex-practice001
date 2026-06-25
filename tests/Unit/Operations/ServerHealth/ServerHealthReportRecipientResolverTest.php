<?php

namespace Tests\Unit\Operations\ServerHealth;

use App\Exceptions\Operations\ServerHealth\InvalidServerHealthReportRecipientsException;
use App\Services\Operations\ServerHealth\ServerHealthReportRecipientResolver;
use Illuminate\Support\Env;
use Tests\TestCase;

class ServerHealthReportRecipientResolverTest extends TestCase
{
    public function test_resolver_normalizes_configured_mail_recipients(): void
    {
        config([
            'notifications.operations.server_health.daily_report.mail_to' => [
                ' first@example.test ',
                '',
                'second@example.test',
                'first@example.test',
            ],
        ]);

        $recipients = app(ServerHealthReportRecipientResolver::class)->resolveDailyReportMailRecipients();

        $this->assertSame(['first@example.test', 'second@example.test'], $recipients);
    }

    public function test_resolver_rejects_empty_recipients(): void
    {
        config(['notifications.operations.server_health.daily_report.mail_to' => []]);

        $this->expectException(InvalidServerHealthReportRecipientsException::class);
        $this->expectExceptionMessage('通知先設定エラー: 通知先が設定されていません。');

        app(ServerHealthReportRecipientResolver::class)->resolveDailyReportMailRecipients();
    }

    public function test_resolver_rejects_invalid_recipient_without_returning_partial_list(): void
    {
        config([
            'notifications.operations.server_health.daily_report.mail_to' => [
                'valid@example.test',
                'not-an-email',
            ],
        ]);

        $this->expectException(InvalidServerHealthReportRecipientsException::class);
        $this->expectExceptionMessage('通知先設定エラー: 不正なメールアドレスが含まれています。');

        app(ServerHealthReportRecipientResolver::class)->resolveDailyReportMailRecipients();
    }

    public function test_notifications_config_converts_comma_separated_env_to_unique_array(): void
    {
        putenv('OPERATIONS_SERVER_HEALTH_DAILY_REPORT_MAIL_TO=first@example.test, second@example.test, first@example.test, ');
        Env::enablePutenv();

        try {
            $config = require base_path('config/notifications.php');
        } finally {
            putenv('OPERATIONS_SERVER_HEALTH_DAILY_REPORT_MAIL_TO');
            Env::enablePutenv();
        }

        $this->assertSame(
            ['first@example.test', 'second@example.test'],
            $config['operations']['server_health']['daily_report']['mail_to'],
        );
    }
}
