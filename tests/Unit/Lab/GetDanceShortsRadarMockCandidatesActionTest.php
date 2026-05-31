<?php

namespace Tests\Unit\Lab;

use App\Actions\Lab\Queries\GetDanceShortsRadarMockCandidatesAction;
use Tests\TestCase;

class GetDanceShortsRadarMockCandidatesActionTest extends TestCase
{
    public function test_it_groups_mock_candidates_by_region_and_sorts_by_display_priority(): void
    {
        $props = app(GetDanceShortsRadarMockCandidatesAction::class)->execute();

        $this->assertSame(['JP', 'US', 'KR'], array_column($props['regions'], 'code'));
        $this->assertSame(['JP', 'US', 'KR'], array_keys($props['candidatesByRegion']));

        $this->assertSame(
            [
                '放課後スタジオのミラー振付 Shorts',
                '駅前ステップを3人で合わせる Shorts',
                'サビ前だけを切り出した15秒振付 Shorts',
            ],
            array_column($props['candidatesByRegion']['JP'], 'title'),
        );

        $this->assertSame(
            [
                '週末ルーフトップのペアダンス Shorts',
                'ワンカウント遅らせるシャッフル Shorts',
                '手元クラップから始まるダンス Shorts',
            ],
            array_column($props['candidatesByRegion']['US'], 'title'),
        );

        $this->assertSame(
            [
                '練習室フォーメーション切り替え Shorts',
                'ポイント振付だけを反復する Shorts',
                'サイドカメラで見せる8カウント Shorts',
            ],
            array_column($props['candidatesByRegion']['KR'], 'title'),
        );
    }
}
