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
use App\Repositories\DanceShortsAnalyzer\DanceShortsAnalyzerVideoRepository;
use App\Repositories\DanceShortsAnalyzer\DanceShortsAnalyzerVideoRepositoryInterface;
use App\Repositories\DanceShortsRadar\DanceShortSearchTargetRepository;
use App\Repositories\DanceShortsRadar\DanceShortSearchTargetRepositoryInterface;
use App\Repositories\DanceShortsRadar\DanceShortVideoCategoryRepository;
use App\Repositories\DanceShortsRadar\DanceShortVideoCategoryRepositoryInterface;
use App\Repositories\DanceShortsRadar\DanceShortVideoRepository;
use App\Repositories\DanceShortsRadar\DanceShortVideoRepositoryInterface;
use App\Repositories\DanceShortsRadar\DanceShortVideoRegionRepository;
use App\Repositories\DanceShortsRadar\DanceShortVideoRegionRepositoryInterface;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepository;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepository;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeFeedEntryRepository;
use App\Repositories\Earthquake\EarthquakeFeedEntryRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepository;
use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeDetailXmlRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinRepository;
use App\Repositories\Earthquake\EarthquakeMapPinRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepository;
use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeXmlRepositoryInterface;
use App\Repositories\Earthquake\JmaEarthquakeDetailXmlRepository;
use App\Repositories\Earthquake\JmaEarthquakeXmlRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Repository interface と実装の対応をアプリ全体で固定します。
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
         * DanceShortsAnalyzer 側は保存済み動画の検索だけを担当します。
         * Search + Cards の PRODUCT 入口では YouTube API、snapshot、region、search_keywords を読みません。
         */
        $this->app->bind(DanceShortsAnalyzerVideoRepositoryInterface::class, DanceShortsAnalyzerVideoRepository::class);

        /*
         * DanceShortsRadar 側の YouTube 関連依存です。
         * 地域別カテゴリは youtube_category_id と region_code の複合条件で Repository から取得します。
         * YouTubeVideoApiRepository は YouTube Data API v3 への HTTP 通信と DTO 変換だけを担当し、
         * DB保存、snapshot保存、Shorts判定、増加量計算は後続の Service / Repository に分けます。
         */
        $this->app->bind(DanceShortSearchTargetRepositoryInterface::class, DanceShortSearchTargetRepository::class);
        $this->app->bind(DanceShortVideoCategoryRepositoryInterface::class, DanceShortVideoCategoryRepository::class);
        $this->app->bind(DanceShortVideoRepositoryInterface::class, DanceShortVideoRepository::class);
        $this->app->bind(DanceShortVideoRegionRepositoryInterface::class, DanceShortVideoRegionRepository::class);
        $this->app->bind(DanceShortVideoSnapshotRepositoryInterface::class, DanceShortVideoSnapshotRepository::class);
        $this->app->bind(YouTubeVideoApiRepositoryInterface::class, YouTubeVideoApiRepository::class);

        /*
         * QuakeWave Preview 側の XML 取得依存です。
         * 地図表示や DB 保存とは切り離し、JMA Atom feed の HTTP 取得だけを Repository に任せます。
         */
        $this->app->bind(EarthquakeXmlRepositoryInterface::class, JmaEarthquakeXmlRepository::class);
        $this->app->bind(EarthquakeFeedEntryRepositoryInterface::class, EarthquakeFeedEntryRepository::class);
        $this->app->bind(EarthquakeFeedEntrySyncRunRepositoryInterface::class, EarthquakeFeedEntrySyncRunRepository::class);
        $this->app->bind(EarthquakeDetailXmlRepositoryInterface::class, JmaEarthquakeDetailXmlRepository::class);
        $this->app->bind(EarthquakeMapPinRepositoryInterface::class, EarthquakeMapPinRepository::class);
        $this->app->bind(EarthquakeMapPinSyncRunRepositoryInterface::class, EarthquakeMapPinSyncRunRepository::class);
    }

    /**
     * 起動時に追加初期化が必要になった場合の入口です。
     */
    public function boot(): void
    {
        //
    }
}
