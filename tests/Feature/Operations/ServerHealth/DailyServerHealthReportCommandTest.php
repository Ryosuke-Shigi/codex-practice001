<?php

namespace Tests\Feature\Operations\ServerHealth;

use App\Notifications\Operations\ServerHealth\DailyServerHealthReportNotification;
use App\Repositories\Operations\ServerHealth\DiskUsageRepositoryInterface;
use App\Repositories\Operations\ServerHealth\MySqlUsageRepositoryInterface;
use Illuminate\Mail\Transport\ArrayTransport;
use Illuminate\Notifications\SendQueuedNotifications;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;
use Symfony\Component\Mime\Email;
use Tests\TestCase;

class DailyServerHealthReportCommandTest extends TestCase
{
    public const GB = 1073741824;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow(Carbon::parse('2026-06-25 06:00:00', 'Asia/Tokyo'));

        config([
            'mail.default' => 'array',
            'notifications.operations.server_health.daily_report.mail_to' => [],
        ]);
        $this->app->make('mail.manager')->forgetMailers();
        $this->bindUsageRepositories();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_command_queues_notification_for_each_recipient(): void
    {
        Queue::fake();
        config([
            'notifications.operations.server_health.daily_report.mail_to' => [
                'first@example.test',
                'second@example.test',
            ],
        ]);

        $this
            ->artisan('health:send-daily-server-report')
            ->expectsOutput('Daily server health report notification queued.')
            ->expectsOutput('判定: WARNING')
            ->assertExitCode(0);

        Queue::assertPushed(SendQueuedNotifications::class, 2);
        Queue::assertPushed(
            SendQueuedNotifications::class,
            fn (SendQueuedNotifications $job): bool => $this->queuedNotificationMatches($job, 'first@example.test'),
        );
        Queue::assertPushed(
            SendQueuedNotifications::class,
            fn (SendQueuedNotifications $job): bool => $this->queuedNotificationMatches($job, 'second@example.test'),
        );
    }

    public function test_sync_command_sends_immediately_without_queue_worker(): void
    {
        Queue::fake();
        config([
            'notifications.operations.server_health.daily_report.mail_to' => [
                'first@example.test',
                'second@example.test',
            ],
        ]);

        $this
            ->artisan('health:send-daily-server-report --sync')
            ->expectsOutput('Daily server health report notification sent.')
            ->expectsOutput('判定: WARNING')
            ->assertExitCode(0);

        Queue::assertNotPushed(SendQueuedNotifications::class);

        $messages = $this->sentArrayMessages();
        $this->assertCount(2, $messages);

        $firstMessage = $messages->first()->getOriginalMessage();
        $this->assertInstanceOf(Email::class, $firstMessage);
        $this->assertSame('first@example.test', $firstMessage->getTo()[0]->getAddress());
        $this->assertSame('【Portfolio Health】サーバー容量レポート 2026-06-25 06:00', $firstMessage->getSubject());
        $this->assertStringContainsString('サーバー容量:', (string) $firstMessage->getTextBody());
        $this->assertStringContainsString('判定:', (string) $firstMessage->getTextBody());
    }

    public function test_command_fails_without_recipients_and_does_not_send_successfully(): void
    {
        Queue::fake();

        $this
            ->artisan('health:send-daily-server-report')
            ->expectsOutput('通知先設定エラー: 通知先が設定されていません。')
            ->assertExitCode(1);

        Queue::assertNotPushed(SendQueuedNotifications::class);
        $this->assertCount(0, $this->sentArrayMessages());
    }

    public function test_command_fails_with_invalid_recipient_and_does_not_send_partial_notification(): void
    {
        Queue::fake();
        config([
            'notifications.operations.server_health.daily_report.mail_to' => [
                'valid@example.test',
                'not-an-email',
            ],
        ]);

        $this
            ->artisan('health:send-daily-server-report')
            ->expectsOutput('通知先設定エラー: 不正なメールアドレスが含まれています。')
            ->assertExitCode(1);

        Queue::assertNotPushed(SendQueuedNotifications::class);
        $this->assertCount(0, $this->sentArrayMessages());
    }

    public function test_binlog_unavailable_does_not_stop_notification_queueing(): void
    {
        Queue::fake();
        $this->bindUsageRepositories(binlogBytes: null);
        config(['notifications.operations.server_health.daily_report.mail_to' => ['ops@example.test']]);

        $this
            ->artisan('health:send-daily-server-report')
            ->expectsOutput('Daily server health report notification queued.')
            ->assertExitCode(0);

        Queue::assertPushed(SendQueuedNotifications::class, 1);
    }

    private function bindUsageRepositories(?int $binlogBytes = self::GB): void
    {
        $this->app->instance(DiskUsageRepositoryInterface::class, new class implements DiskUsageRepositoryInterface
        {
            /**
             * @return array{total_bytes: int, free_bytes: int}
             */
            public function getUsageBytes(): array
            {
                return [
                    'total_bytes' => 100 * DailyServerHealthReportCommandTest::GB,
                    'free_bytes' => 20 * DailyServerHealthReportCommandTest::GB,
                ];
            }
        });

        $this->app->instance(MySqlUsageRepositoryInterface::class, new class($binlogBytes) implements MySqlUsageRepositoryInterface
        {
            public function __construct(
                private readonly ?int $binlogBytes,
            ) {}

            public function getDatabaseUsageBytes(): int
            {
                return 2 * DailyServerHealthReportCommandTest::GB;
            }

            public function getBinaryLogUsageBytes(): ?int
            {
                return $this->binlogBytes;
            }
        });
    }

    private function queuedNotificationMatches(SendQueuedNotifications $job, string $recipient): bool
    {
        $notifiable = $job->notifiables->first();

        return $job->notification instanceof DailyServerHealthReportNotification
            && $job->channels === ['mail']
            && ($notifiable->routes['mail'] ?? null) === $recipient;
    }

    private function sentArrayMessages()
    {
        $transport = $this->app->make('mail.manager')->mailer()->getSymfonyTransport();

        $this->assertInstanceOf(ArrayTransport::class, $transport);

        return $transport->messages();
    }
}
