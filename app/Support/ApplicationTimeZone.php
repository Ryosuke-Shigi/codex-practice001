<?php

namespace App\Support;

use Throwable;

final class ApplicationTimeZone
{
    public const FALLBACK = 'Asia/Tokyo';

    public static function name(): string
    {
        if (! function_exists('config')) {
            return self::FALLBACK;
        }

        try {
            $timezone = config('app.timezone', self::FALLBACK);
        } catch (Throwable) {
            return self::FALLBACK;
        }

        if (! is_string($timezone)) {
            return self::FALLBACK;
        }

        $timezone = trim($timezone);

        return $timezone === '' ? self::FALLBACK : $timezone;
    }
}
