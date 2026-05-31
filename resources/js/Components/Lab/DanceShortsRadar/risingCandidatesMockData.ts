import type { DanceShortsRisingCandidate } from './types';

/*
 * 上昇候補タブ専用のフロントモックデータです。
 *
 * YouTube API、DB、実ランキング判定には接続せず、表示密度と文言の確認だけに使います。
 * 既存の PHP Action が返す地域別モックとは分けておきます。
 * 上昇候補は「海外で先行して伸びていて、日本ではまだ伸びきっていないかもしれない」という
 * 別の観測軸を持つため、地域別ランキングの candidate 型へ混ぜると後続の責務境界が曖昧になります。
 *
 * source_region は海外側の先行地域、japan_status は日本側での観測状態を表します。
 * view_count_delta と view_growth_rate は将来、選択中の集計期間に応じてサーバー側で計算される想定ですが、
 * 今回は固定値を表示して UI の読みやすさだけを確認します。
 */
export const risingCandidateMockData: DanceShortsRisingCandidate[] = [
    {
        title: '韓国練習室発のポイント振付 Shorts',
        source_region: 'KR',
        source_region_label: '韓国',
        japan_status: '日本では上位表示前の観測候補',
        view_count_delta: 286000,
        view_growth_rate: 38.4,
        thumbnail_url: '/images/dance-shorts-radar/mock-kr.svg',
        youtube_url:
            'https://www.youtube.com/shorts/mock-rising-kr-point-step',
        tags: ['海外先行', 'K-POP文脈', 'ポイント振付'],
        observation_note:
            '韓国側で視聴数増加が大きく、日本側ではまだ伸びきっていない可能性がある優先観測候補です。',
    },
    {
        title: 'アメリカ発のクラップ入りシャッフル Shorts',
        source_region: 'US',
        source_region_label: 'アメリカ',
        japan_status: '日本未上昇の注目候補',
        view_count_delta: 214500,
        view_growth_rate: 31.8,
        thumbnail_url: '/images/dance-shorts-radar/mock-us.svg',
        youtube_url:
            'https://www.youtube.com/shorts/mock-rising-us-clap-shuffle',
        tags: ['海外先行', '手元クラップ', '短尺振付'],
        observation_note:
            'アメリカ側で伸びている兆候があり、日本向けランキングではまだ余地がある候補として扱います。',
    },
    {
        title: '韓国サイドカメラ構図の8カウント Shorts',
        source_region: 'KR',
        source_region_label: '韓国',
        japan_status: '日本でこれから伸びる可能性がある候補',
        view_count_delta: 168200,
        view_growth_rate: 24.6,
        thumbnail_url: '/images/dance-shorts-radar/mock-kr.svg',
        youtube_url:
            'https://www.youtube.com/shorts/mock-rising-kr-side-camera',
        tags: ['海外先行', '8カウント', 'カメラ構図'],
        observation_note:
            '同系統の構図が海外側で先行しており、日本側の反応を継続して見たい候補です。',
    },
];
