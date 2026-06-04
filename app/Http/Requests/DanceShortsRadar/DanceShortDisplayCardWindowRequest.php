<?php

namespace App\Http\Requests\DanceShortsRadar;

/*
 * 表示カード window API 専用の Request です。
 *
 * 追加読み込みでも初期ページ表示と同じ tab / comparisonDays / sort / startRank /
 * windowSize / selectedVideoId を受け取るため、形式バリデーションと legacy query の吸収は
 * DanceShortVideoRankingRequest に寄せています。このクラスを分けておくことで、
 * route / Controller 上では「ページ表示」ではなく「カード window 取得」の入口だと
 * 読み取れるようにしています。
 */
class DanceShortDisplayCardWindowRequest extends DanceShortVideoRankingRequest
{
}
