<?php

namespace App\Exceptions\Operations\ServerHealth;

use RuntimeException;

class InvalidServerHealthReportRecipientsException extends RuntimeException
{
    public static function notConfigured(): self
    {
        return new self('通知先設定エラー: 通知先が設定されていません。');
    }

    public static function invalidAddressIncluded(): self
    {
        return new self('通知先設定エラー: 不正なメールアドレスが含まれています。');
    }
}
