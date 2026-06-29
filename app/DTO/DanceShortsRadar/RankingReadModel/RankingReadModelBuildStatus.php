<?php

namespace App\DTO\DanceShortsRadar\RankingReadModel;

/**
 * ランキング read model build の status 定数です。
 */
final class RankingReadModelBuildStatus
{
    public const BUILDING = 'building';

    public const ACTIVE = 'active';

    public const SUPERSEDED = 'superseded';

    public const FAILED = 'failed';

    private function __construct() {}
}
