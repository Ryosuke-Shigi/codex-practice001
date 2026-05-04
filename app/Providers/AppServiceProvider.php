<?php

namespace App\Providers;

use App\Repositories\ApiCatalog\ApisGuruRepository;
use App\Repositories\ApiCatalog\ApisGuruRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(ApisGuruRepositoryInterface::class, ApisGuruRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
