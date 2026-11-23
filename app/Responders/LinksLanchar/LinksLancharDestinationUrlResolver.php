<?php

namespace App\Responders\LinksLanchar;

use Illuminate\Contracts\Routing\UrlGenerator;

final readonly class LinksLancharDestinationUrlResolver implements LinkDestinationUrlResolver
{
    public function __construct(private UrlGenerator $urls) {}

    public function resolve(string $reference): string
    {
        return $this->urls->route('links-lanchars.show', ['linksLancharKey' => $reference], false);
    }
}
