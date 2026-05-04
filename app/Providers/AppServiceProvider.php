<?php

namespace App\Providers;

use App\Repositories\ApiCatalog\ApisGuruRepository;
use App\Repositories\ApiCatalog\ApisGuruRepositoryInterface;
use App\Repositories\ApiPreview\ApisGuruPreviewRepository;
use App\Repositories\ApiPreview\ApisGuruPreviewRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        /*
         * ApiCatalog 側は API Discovery Hub 本体用の依存です。
         * Preview 側の bind を追加しても、既存の本体用 bind は変更しません。
         */
        $this->app->bind(ApisGuruRepositoryInterface::class, ApisGuruRepository::class);

        /*
         * ApiPreview 側は開発補助画面専用の依存です。
         * Action は Interface に依存し、実 HTTP 通信は ApisGuruPreviewRepository が担当します。
         */
        $this->app->bind(ApisGuruPreviewRepositoryInterface::class, ApisGuruPreviewRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
