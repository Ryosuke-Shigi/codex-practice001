<?php

namespace App\Responders\DesignPhilosophy;

use App\DTO\DesignPhilosophy\Sections\DesignPhilosophySectionDTO;
use Inertia\Inertia;
use Inertia\Response;

final readonly class DesignPhilosophyResponder
{
    /**
     * @param  array<int, DesignPhilosophySectionDTO>  $sections
     */
    public function index(array $sections): Response
    {
        /*
         * Responder は Inertia へ返す出力形式だけを整えます。
         * ここでは component 名と sections props の形を固定し、
         * config の取得や表示順の判断は Action 側に残します。
         */
        return Inertia::render('DesignPhilosophy/Index', [
            'sections' => array_map(
                fn (DesignPhilosophySectionDTO $section): array => $section->toArray(),
                $sections,
            ),
        ]);
    }
}
