<?php

namespace App\Providers;

use App\Repositories\ApiCatalog\ApisGuruRepository;
use App\Repositories\ApiCatalog\ApisGuruRepositoryInterface;
use App\Repositories\ApiCatalog\ApiCatalogCacheRepository;
use App\Repositories\ApiCatalog\ApiCatalogCacheRepositoryInterface;
use App\Repositories\ApiCatalog\ApiCatalogNoteRepository;
use App\Repositories\ApiCatalog\ApiCatalogNoteRepositoryInterface;
use App\Repositories\ApiCatalog\ApiCatalogSyncStatusRepository;
use App\Repositories\ApiCatalog\ApiCatalogSyncStatusRepositoryInterface;
use App\Repositories\ApiPreview\ApisGuruPreviewRepository;
use App\Repositories\ApiPreview\ApisGuruPreviewRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeFeedEntryRepository;
use App\Repositories\Earthquake\EarthquakeFeedEntryRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepository;
use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeXmlRepositoryInterface;
use App\Repositories\Earthquake\JmaEarthquakeXmlRepository;
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
         * Preview 側の Repository / DTO / Responder とは切り離します。
         */
        $this->app->bind(ApisGuruRepositoryInterface::class, ApisGuruRepository::class);
        $this->app->bind(ApiCatalogCacheRepositoryInterface::class, ApiCatalogCacheRepository::class);
        $this->app->bind(ApiCatalogNoteRepositoryInterface::class, ApiCatalogNoteRepository::class);
        $this->app->bind(ApiCatalogSyncStatusRepositoryInterface::class, ApiCatalogSyncStatusRepository::class);

        /*
         * ApiPreview 側は開発補助画面専用の依存です。
         * Action は Interface に依存し、実 HTTP 通信は ApisGuruPreviewRepository が担当します。
         */
        $this->app->bind(ApisGuruPreviewRepositoryInterface::class, ApisGuruPreviewRepository::class);

        /*
         * QuakeWave Preview 側の XML 取得依存です。
         * 地図表示や DB 保存とは切り離し、JMA Atom feed の HTTP 取得だけを Repository に任せます。
         */
        $this->app->bind(EarthquakeXmlRepositoryInterface::class, JmaEarthquakeXmlRepository::class);
        $this->app->bind(EarthquakeFeedEntryRepositoryInterface::class, EarthquakeFeedEntryRepository::class);
        $this->app->bind(EarthquakeFeedEntrySyncRunRepositoryInterface::class, EarthquakeFeedEntrySyncRunRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
