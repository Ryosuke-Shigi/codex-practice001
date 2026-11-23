<?php

namespace App\Responders\LinksLauncher;

final class PageDestinationUrlResolver implements LinkDestinationUrlResolver
{
    public function resolve(string $reference): ?string
    {
        // ブラウザーで別の解釈をされる参照は、保存値を変更せず無効として扱う。
        if (preg_match('/[\x00-\x20\x7f]/', $reference) || str_contains($reference, '\\')) {
            return null;
        }

        if (str_starts_with($reference, '/')) {
            return str_starts_with($reference, '//') ? null : $reference;
        }

        if (! preg_match('/^https?:\/\//i', $reference) || filter_var($reference, FILTER_VALIDATE_URL) === false) {
            return null;
        }

        return $reference;
    }
}
