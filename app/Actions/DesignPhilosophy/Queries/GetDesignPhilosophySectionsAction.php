<?php

namespace App\Actions\DesignPhilosophy\Queries;

use App\DTO\DesignPhilosophy\Sections\DesignPhilosophySectionDTO;

final readonly class GetDesignPhilosophySectionsAction
{
    /**
     * @return array<int, DesignPhilosophySectionDTO>
     */
    public function execute(): array
    {
        /*
         * Design Philosophy LP は DB や CMS を持たない紹介ページです。
         * そのため、本文データの唯一の入口を config に固定します。
         *
         * React 側へ固定配列を置くと、Laravel の Feature テストで
         * enabled / sort_order / props 形状を守りにくくなるため、
         * ここで config を読んで DTO に変換してから Responder へ渡します。
         */
        $sections = config('design_philosophy.sections', []);

        if (! is_array($sections)) {
            return [];
        }

        /*
         * config は並び替えや除外の編集点です。
         * Action は表示対象だけを sort_order 順に DTO 化し、Inertia props の整形は Responder に渡します。
         *
         * enabled=false の除外は「表示対象を選ぶ」ユースケース手順としてここで行います。
         * DTO は表示可否を判断せず、すでに表示対象になった1件分の値だけを保持します。
         */
        return collect($sections)
            ->filter(fn (mixed $section): bool => is_array($section) && ($section['enabled'] ?? false) === true)
            ->sortBy(fn (array $section): int => (int) $section['sort_order'])
            ->values()
            ->map(fn (array $section): DesignPhilosophySectionDTO => DesignPhilosophySectionDTO::fromConfig($section))
            ->all();
    }
}
