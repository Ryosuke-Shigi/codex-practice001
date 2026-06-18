<?php

namespace App\Services\ApplicationLog;

use App\Models\ApplicationErrorLog;

/**
 * アプリログとして保存できる値の許可判定と安全な整形を担当します。
 *
 * DB保存や取得は Repository、Event から DTO への接続は Listener に残し、この Service は
 * level / status の許可値、秘密情報の除去、ERROR 対応済み可否だけを扱います。
 */
final class ApplicationLogSanitizerService
{
    /**
     * @var array<int, string>
     */
    public const ALLOWED_ERROR_LEVELS = [
        'critical',
        'error',
        'warning',
        'info',
    ];

    /**
     * @var array<int, string>
     */
    public const ALLOWED_INTEGRATION_STATUSES = [
        'success',
        'failed',
        'skipped',
        'pending',
    ];

    private const DEFAULT_ERROR_LEVEL = 'error';

    private const DEFAULT_INTEGRATION_STATUS = 'pending';

    /**
     * @var array<int, string>
     */
    private const SENSITIVE_QUERY_KEYS = [
        'api_key',
        'apikey',
        'key',
        'token',
        'access_token',
        'refresh_token',
        'authorization',
        'cookie',
        'session',
        'password',
        'secret',
        'signature',
    ];

    public function isAllowedLevel(string $level): bool
    {
        return in_array($level, self::ALLOWED_ERROR_LEVELS, true);
    }

    public function isAllowedStatus(string $status): bool
    {
        return in_array($status, self::ALLOWED_INTEGRATION_STATUSES, true);
    }

    public function normalizeLevel(?string $level): string
    {
        $normalized = strtolower(trim((string) $level));

        return $this->isAllowedLevel($normalized)
            ? $normalized
            : self::DEFAULT_ERROR_LEVEL;
    }

    public function normalizeStatus(?string $status): string
    {
        $normalized = strtolower(trim((string) $status));

        return $this->isAllowedStatus($normalized)
            ? $normalized
            : self::DEFAULT_INTEGRATION_STATUS;
    }

    public function sanitizeMessage(?string $message, int $maxLength = 1000): ?string
    {
        if ($message === null) {
            return null;
        }

        $trimmed = trim($message);

        if ($trimmed === '') {
            return null;
        }

        return $this->limitText($this->redactSensitiveText($trimmed), $maxLength);
    }

    public function sanitizeRequiredMessage(string $message, int $maxLength = 1000): string
    {
        return $this->sanitizeMessage($message, $maxLength) ?? 'Application error occurred.';
    }

    /**
     * URL は path と安全な query の確認に留め、認証値になりやすい query value は保存前に伏せます。
     */
    public function sanitizeUrl(?string $url): ?string
    {
        if ($url === null) {
            return null;
        }

        $trimmed = trim($url);

        if ($trimmed === '') {
            return null;
        }

        $parts = parse_url($trimmed);

        if ($parts === false) {
            return $this->limitText($this->redactSensitiveText($trimmed), 500);
        }

        $rebuilt = '';

        if (isset($parts['scheme'])) {
            $rebuilt .= $parts['scheme'].'://';
        }

        if (isset($parts['host'])) {
            $rebuilt .= $parts['host'];
        }

        if (isset($parts['port'])) {
            $rebuilt .= ':'.$parts['port'];
        }

        $rebuilt .= $parts['path'] ?? '';

        if (isset($parts['query']) && $parts['query'] !== '') {
            $rebuilt .= '?'.$this->sanitizeQueryString($parts['query']);
        }

        return $this->limitText($this->redactSensitiveText($rebuilt), 500);
    }

    public function sanitizeFile(?string $file): ?string
    {
        if ($file === null) {
            return null;
        }

        $normalized = str_replace('\\', '/', trim($file));

        if ($normalized === '') {
            return null;
        }

        $basePath = str_replace('\\', '/', base_path()).'/';

        if (str_starts_with($normalized, $basePath)) {
            return $this->limitText(ltrim(substr($normalized, strlen($basePath)), '/'), 255);
        }

        /*
         * Docker / host の絶対パスは環境差が出やすいため、app 配下を見つけた場合は
         * プロジェクト相対へ寄せ、見つからない外部パスは basename だけを残します。
         */
        $appPosition = strpos($normalized, '/app/');

        if ($appPosition !== false) {
            return $this->limitText(ltrim(substr($normalized, $appPosition + 1), '/'), 255);
        }

        return $this->limitText(basename($normalized), 255);
    }

    public function normalizeMethod(?string $method): ?string
    {
        if ($method === null) {
            return null;
        }

        $normalized = strtoupper(trim($method));

        return $normalized === '' ? null : $this->limitText($normalized, 16);
    }

    public function canResolveErrorLog(ApplicationErrorLog $log): bool
    {
        return $log->resolved_at === null;
    }

    /**
     * query の key は残して調査の手掛かりにし、value だけを伏せます。
     * URL 全体を捨てると外部連携先の切り分けが難しくなるためです。
     */
    private function sanitizeQueryString(string $query): string
    {
        $safeParts = [];

        foreach (explode('&', $query) as $part) {
            if ($part === '') {
                continue;
            }

            [$key, $value] = array_pad(explode('=', $part, 2), 2, '');
            $decodedKey = strtolower(rawurldecode($key));

            $safeParts[] = in_array($decodedKey, self::SENSITIVE_QUERY_KEYS, true)
                ? $key.'=[redacted]'
                : $this->redactSensitiveText($key.($value === '' ? '' : '='.$value));
        }

        return implode('&', $safeParts);
    }

    private function redactSensitiveText(string $value): string
    {
        /*
         * payload 全文を構造解析して保存する責務は持ちません。
         * 保存対象に混ざりやすい token / email 風の断片だけを最後の防波堤として伏せます。
         */
        $patterns = [
            '/Bearer\s+[A-Za-z0-9._~+\/=-]+/i' => 'Bearer [redacted]',
            '/(api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|cookie|session|password|secret|token)(\s*[:=]\s*)([^\s&,"\']+)/i' => '$1$2[redacted]',
            '/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i' => '[redacted-email]',
        ];

        $redacted = $value;

        foreach ($patterns as $pattern => $replacement) {
            $next = preg_replace($pattern, $replacement, $redacted);
            $redacted = is_string($next) ? $next : $redacted;
        }

        return $redacted;
    }

    private function limitText(string $value, int $maxLength): string
    {
        return mb_strlen($value) > $maxLength
            ? mb_substr($value, 0, $maxLength)
            : $value;
    }
}
