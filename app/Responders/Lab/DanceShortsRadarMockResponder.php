<?php

namespace App\Responders\Lab;

use Inertia\Inertia;
use Inertia\Response;

/*
 * Dance Shorts Radar モック画面用 Responder です。
 *
 * Responder は Inertia component 名と props の受け渡しだけを担当します。
 * ここに候補の並び替えや文言判定を入れると、Action / React component との境界が曖昧になるため、
 * 「Action が返した props をそのままページへ渡す」だけに留めています。
 */
final readonly class DanceShortsRadarMockResponder
{
    /**
     * @param  array{
     *     regionTabs: array<int, array{code: string, label: string, description: string}>,
     *     regions: array<int, array{code: string, label: string, description: string}>,
     *     candidatesByRegion: array<string, array<int, array<string, mixed>>>,
     *     allCandidates: array<int, array<string, mixed>>,
     *     mockNotice: string
     * }  $props
     */
    public function index(array $props): Response
    {
        return Inertia::render('Lab/DanceShortsRadarMock', $props);
    }
}
