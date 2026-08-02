<?php

namespace App\DTO\ApplicationLog;

/**
 * アプリログ専用ページで受け付ける query 条件です。
 */
final readonly class ApplicationLogIndexInputDTO
{
    public const DEFAULT_LIMIT = 20;

    public const DEFAULT_TAB = 'api';

    /**
     * @var array<int, string>
     */
    public const ALLOWED_TABS = [
        'api',
        'error',
    ];

    public function __construct(
        public string $activeTab = self::DEFAULT_TAB,
        public int $limit = self::DEFAULT_LIMIT,
    ) {}
}
