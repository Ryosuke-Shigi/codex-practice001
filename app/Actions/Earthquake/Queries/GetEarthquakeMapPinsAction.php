<?php

namespace App\Actions\Earthquake\Queries;

use App\DTO\Earthquake\Map\EarthquakeMapPinListDTO;
use App\DTO\Earthquake\Map\EarthquakeMapPinListQueryDTO;
use App\Repositories\Earthquake\EarthquakeMapPinRepositoryInterface;

/**
 * Japan Quake Wave Map の表示対象 pin を取得する Query Action です。
 *
 * Controller から Query DTO を受け取り、Repository へ取得を委譲します。
 * feed取得、XML解析、pin生成、Inertia props 整形はこの Action に置きません。
 */
class GetEarthquakeMapPinsAction
{
    public function __construct(
        private readonly EarthquakeMapPinRepositoryInterface $mapPinRepository,
    ) {}

    /**
     * 地図表示に必要な pin list DTO を返します。
     */
    public function execute(EarthquakeMapPinListQueryDTO $query): EarthquakeMapPinListDTO
    {
        /*
         * Query Action は /quakewave-preview/map の表示に必要な読み取り手順だけを持ちます。
         * DB保存、外部XML取得、震度別の見た目計算は別レイヤーに置き、ここでは
         * Repository から表示対象 pin DTO を取り出して Controller へ返します。
         *
         * この Action を挟むことで、今後「表示対象の期間を絞る」「limit を画面要件ごとに変える」
         * といった読み取り手順を Controller に漏らさず追加できます。第1段階では最新順の
         * 取得だけに留め、feed entry 取込や map pin 生成 Job へは一切接続しません。
         */
        return $this->mapPinRepository->toMapPinListDTO($query);
    }
}
