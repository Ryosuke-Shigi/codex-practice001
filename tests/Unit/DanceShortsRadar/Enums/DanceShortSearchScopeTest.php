<?php

namespace Tests\Unit\DanceShortsRadar\Enums;

use App\Enums\DanceShortsRadar\DanceShortSearchScope;
use PHPUnit\Framework\TestCase;

class DanceShortSearchScopeTest extends TestCase
{
    public function test_values_are_fixed_for_database_scope(): void
    {
        $this->assertSame('standard', DanceShortSearchScope::Standard->value);
        $this->assertSame('expanded', DanceShortSearchScope::Expanded->value);
    }
}
