<?php

namespace App\Responders\LinksLauncher;

interface LinkDestinationUrlResolver
{
    /**
     * 取得済みの行き先の参照値を、遷移に使えるURLに変換します。
     */
    public function resolve(string $reference): ?string;
}
