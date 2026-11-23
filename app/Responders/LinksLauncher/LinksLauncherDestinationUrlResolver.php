<?php

namespace App\Responders\LinksLauncher;

use Illuminate\Contracts\Routing\UrlGenerator;

final readonly class LinksLauncherDestinationUrlResolver implements LinkDestinationUrlResolver
{
    public function __construct(private UrlGenerator $urls) {}

    public function resolve(string $reference): string
    {
        return $this->urls->route('links-launchers.show', ['linksLauncherKey' => $reference], false);
    }
}
