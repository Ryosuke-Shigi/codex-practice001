<?php

namespace App\Responders\LinksLanchar;

interface LinkDestinationUrlResolver
{
    /**
     * 取得済みの行き先の参照値を、遷移に使えるURLに変換します。
     */
    public function resolve(string $reference): ?string;
}
