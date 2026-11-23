<?php

namespace App\Support\Portfolio;

/**
 * 既存ポートフォリオの作品順・遷移先・採用素材を初期データへ対応づけます。
 */
final class PortfolioLinksLancharDefinition
{
    // 初期定義で一度取得したUUID。再登録や表示内容の更新で変更しない。
    public const LINKS_LANCHAR_KEY = 'a93e9333-f36b-4cb8-8b4d-9cbbb1a44973';

    // 初期定義から外しただけでは削除せず、削除対象のUUIDをここへ記載する。
    public const DELETED_LINK_KEYS = [];

    public const DELETED_LINKS_LANCHAR_KEYS = [];

    private const ASSET_ROOT = '/images/links-lanchar/portfolio/';

    private const LINKS = [
        'api-discovery-hub' => [
            'link_key' => 'fc17a8ad-71ee-4267-9b13-199de53588bd',
            'title' => 'API Discovery Hub',
            'description' => '公開APIカタログを取得・検索・保存・調査できるポートフォリオProjectです。',
            'lucide_icon_name' => 'Globe2',
            'background_color' => '#0e1b2b',
            'sphere_color' => '#22d3ee',
            'selection_image_reference' => self::ASSET_ROOT.'api-discovery-hub/selection-v1.gif',
            'selection_image_poster_reference' => self::ASSET_ROOT.'api-discovery-hub/selection-poster-v1.png',
            'background_image_reference' => self::ASSET_ROOT.'api-discovery-hub/background-v1.gif',
            'background_image_poster_reference' => self::ASSET_ROOT.'api-discovery-hub/background-poster-v1.png',
            'icon_image_reference' => self::ASSET_ROOT.'api-discovery-hub/icon-globe-search-v1.png',
            'background_effect_name' => 'aquaParticles',
        ],
        'dance-shorts-radar' => [
            'link_key' => '85120ed9-0e99-4ebd-b718-79d2ec92afae',
            'title' => 'DanceShortsRadar',
            'description' => 'YouTube Shorts のダンス候補を収集し、地域別ランキングと snapshot 差分を確認するProjectです。',
            'lucide_icon_name' => 'Radar',
            'background_color' => '#10131f',
            'sphere_color' => '#14b8a6',
            'selection_image_reference' => self::ASSET_ROOT.'dance-shorts-radar/selection-v1.gif',
            'selection_image_poster_reference' => self::ASSET_ROOT.'dance-shorts-radar/selection-v1.png',
            'background_image_reference' => self::ASSET_ROOT.'dance-shorts-radar/background-v1.gif',
            'background_image_poster_reference' => self::ASSET_ROOT.'dance-shorts-radar/background-v1.png',
            'icon_image_reference' => self::ASSET_ROOT.'dance-shorts-radar/icon-radar-v1.png',
        ],
        'dance-shorts-analyzer' => [
            'link_key' => '2c5862b2-2d33-44dc-96e9-774258515151',
            'title' => 'DanceShortsAnalyzer',
            'description' => '保存済み動画を検索・選択し、snapshot の推移と差分を比較分析するProjectです。',
            'lucide_icon_name' => 'BarChart3',
            'background_color' => '#10131f',
            'sphere_color' => '#ff4f8b',
            'selection_image_reference' => self::ASSET_ROOT.'dance-shorts-analyzer/selection-v2.gif',
            'selection_image_poster_reference' => self::ASSET_ROOT.'dance-shorts-analyzer/selection-poster-v2.png',
            'background_image_reference' => self::ASSET_ROOT.'dance-shorts-analyzer/background-v1.gif',
            'background_image_poster_reference' => self::ASSET_ROOT.'dance-shorts-analyzer/background-poster-v1.png',
            'icon_image_reference' => self::ASSET_ROOT.'dance-shorts-analyzer/icon-bar-chart-v1.png',
        ],
        'japan-quake-wave-map' => [
            'link_key' => '0005d739-0dbd-451b-a0bf-85391fd2ca52',
            'title' => 'Japan Quake Wave Map',
            'description' => '気象庁XML由来の地震情報を保存し、震源・震度・波紋を地図上で確認するProjectです。',
            'lucide_icon_name' => 'Radar',
            'background_color' => '#13211f',
            'sphere_color' => '#38bdf8',
            'selection_image_reference' => self::ASSET_ROOT.'japan-quake-wave-map/selection-v1.gif',
            'selection_image_poster_reference' => self::ASSET_ROOT.'japan-quake-wave-map/selection-v1.png',
            'background_image_reference' => self::ASSET_ROOT.'japan-quake-wave-map/background-v2.gif',
            'background_image_poster_reference' => self::ASSET_ROOT.'japan-quake-wave-map/background-poster-v1.png',
            'icon_image_reference' => self::ASSET_ROOT.'japan-quake-wave-map/icon-radar-v1.png',
        ],
        'lumilab' => [
            'link_key' => 'da18de98-536e-400e-b43c-ec62eea8a101',
            'title' => 'LumiLab',
            'description' => 'LumiLabは案件システムを最初のサブシステムとして育てる上位プロダクトです。',
            'lucide_icon_name' => 'Lightbulb',
            'background_color' => '#111827',
            'sphere_color' => '#facc15',
        ],
        'construction-order' => [
            'link_key' => '750108e6-c508-427a-9470-fa3772d4b8e2',
            'title' => '工事発注管理',
            'description' => '案件、作業カード、見積・請求・領収の流れを、現場向けの入力体験として整理するProjectです。',
            'lucide_icon_name' => 'Building2',
            'background_color' => '#12201c',
            'sphere_color' => '#4ade80',
        ],
        'event-card-calendar' => [
            'link_key' => '37f167be-6f93-48eb-9385-edfaa5d88b8c',
            'title' => 'イベント・カードカレンダー',
            'description' => 'イベントを背景・生成元として扱い、入金・出金・請求カードをカレンダー、表、可視化へ広げる構想Projectです。',
            'lucide_icon_name' => 'CalendarDays',
            'background_color' => '#111716',
            'sphere_color' => '#f59e0b',
        ],
        'logs' => [
            'link_key' => '0f174154-65ed-4747-8fda-6ebb25057468',
            'title' => 'アプリログ',
            'description' => 'アプリ内で保存したAPI連携ログとエラーログを確認するための入口です。',
            'lucide_icon_name' => 'ClipboardList',
            'background_color' => '#111827',
            'sphere_color' => '#f97316',
        ],
    ];

    /**
     * @return array<string, array{link_key: string, title: string, description: string, lucide_icon_name: string, background_color: string, sphere_color: string, selection_image_reference?: string, selection_image_poster_reference?: string, background_image_reference?: string, background_image_poster_reference?: string, icon_image_reference?: string, background_effect_name?: string}>
     */
    public static function links(): array
    {
        return self::LINKS;
    }

    public static function linkKeyForProject(string $projectId): ?string
    {
        return self::LINKS[$projectId]['link_key'] ?? null;
    }

    public static function destinationUrlForProject(string $projectId): ?string
    {
        if (! isset(self::LINKS[$projectId])) {
            return null;
        }

        return $projectId === 'logs'
            ? '/projects/logs'
            : '/projects?project='.rawurlencode($projectId).'&view=stages';
    }
}
