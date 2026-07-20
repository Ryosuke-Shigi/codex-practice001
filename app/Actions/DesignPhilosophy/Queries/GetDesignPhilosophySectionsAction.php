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
         * 固定9章のメタデータを config から取得し、対応する key と enabled で表示対象を選び、
         * sort_order 順の DTO へ変換して Responder へ渡します。
         * 章内のカードや一覧は、Frontend表示契約に閉じた型付き固定データとして React 側が持ちます。
         */
        $sections = config('design_philosophy.sections', []);

        if (! is_array($sections)) {
            return [];
        }

        /*
         * config は固定9章の並び替えや除外の編集点です。
         * Action は対応する固定keyの表示対象だけを DTO 化し、Inertia props の整形は Responder に渡します。
         *
         * enabled=false の除外は「表示対象を選ぶ」ユースケース手順としてここで行います。
         * DTO は表示可否を判断せず、すでに表示対象になった1件分の値だけを保持します。
         */
        return collect($sections)
            ->filter(fn (mixed $section): bool => is_array($section)
                && ($section['enabled'] ?? false) === true
                && DesignPhilosophySectionDTO::supportsKey($section['key'] ?? null))
            ->sortBy(fn (array $section): int => (int) $section['sort_order'])
            ->values()
            ->map(fn (array $section): DesignPhilosophySectionDTO => DesignPhilosophySectionDTO::fromConfig($section))
            ->all();
    }
}
