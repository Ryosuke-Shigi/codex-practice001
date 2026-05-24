<?php

namespace Tests\Feature\Lab;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ApiDiscoveryHubPpTest extends TestCase
{
    public function test_api_discovery_hub_pp_page_is_available(): void
    {
        /*
         * 紹介LPはDBや外部APIを触らない静的Inertiaページです。
         * そのためFeatureテストでは、HTTP 200 と期待component名を固定し、
         * ルート削除やcomponent名変更による導線破壊を検知します。
         */
        $this
            ->get('/lab/api-discovery-hub-pp')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/ApiDiscoveryHubPp', false)
            );
    }
}
