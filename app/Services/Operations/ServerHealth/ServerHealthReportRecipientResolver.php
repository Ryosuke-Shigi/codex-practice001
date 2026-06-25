<?php

namespace App\Services\Operations\ServerHealth;

use App\Exceptions\Operations\ServerHealth\InvalidServerHealthReportRecipientsException;

/**
 * DailyServerHealthReport の通知先 config を検証する Service です。
 *
 * env は直接読まず、config から渡された配列を通知可能な宛先リストへ正規化します。
 */
class ServerHealthReportRecipientResolver
{
    /**
     * @return list<string>
     */
    public function resolveDailyReportMailRecipients(): array
    {
        $configuredRecipients = config('notifications.operations.server_health.daily_report.mail_to', []);

        if (! is_array($configuredRecipients)) {
            throw InvalidServerHealthReportRecipientsException::invalidAddressIncluded();
        }

        $recipients = [];

        foreach ($configuredRecipients as $recipient) {
            if (! is_scalar($recipient)) {
                throw InvalidServerHealthReportRecipientsException::invalidAddressIncluded();
            }

            $email = trim((string) $recipient);

            if ($email === '') {
                continue;
            }

            $recipients[] = $email;
        }

        $recipients = array_values(array_unique($recipients));

        if ($recipients === []) {
            throw InvalidServerHealthReportRecipientsException::notConfigured();
        }

        foreach ($recipients as $recipient) {
            if (filter_var($recipient, FILTER_VALIDATE_EMAIL) === false) {
                throw InvalidServerHealthReportRecipientsException::invalidAddressIncluded();
            }
        }

        return $recipients;
    }
}
