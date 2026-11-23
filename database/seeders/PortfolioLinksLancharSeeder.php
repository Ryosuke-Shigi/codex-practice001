<?php

namespace Database\Seeders;

use App\Models\Link;
use App\Models\LinkPage;
use App\Models\LinksLanchar;
use App\Support\Portfolio\PortfolioLinksLancharDefinition;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use LogicException;

final class PortfolioLinksLancharSeeder extends Seeder
{
    /**
     * @param  list<string>|null  $deletedLinkKeys  論理削除するLinkの固有キー
     * @param  list<string>|null  $deletedLinksLancharKeys  論理削除する本体の固有キー
     */
    public function __construct(
        private readonly ?array $deletedLinkKeys = null,
        private readonly ?array $deletedLinksLancharKeys = null,
    ) {}

    public function run(): void
    {
        DB::transaction(function (): void {
            $launcher = LinksLanchar::withTrashed()
                ->lockForUpdate()
                ->firstOrCreate(['links_lanchar_key' => PortfolioLinksLancharDefinition::LINKS_LANCHAR_KEY]);

            $priority = 0;
            foreach (PortfolioLinksLancharDefinition::links() as $projectId => $definition) {
                $priority++;
                $link = Link::withTrashed()->firstOrNew(['link_key' => $definition['link_key']]);
                if ($link->trashed()) {
                    continue;
                }

                $destinationUrl = PortfolioLinksLancharDefinition::destinationUrlForProject($projectId);
                if ($destinationUrl === null) {
                    throw new LogicException('初期定義の行き先がありません。');
                }

                $page = LinkPage::query()->firstOrCreate(['url' => $destinationUrl]);
                $link->fill([
                    ...$definition,
                    'owner_links_lanchar_key' => $launcher->links_lanchar_key,
                    'destination_links_lanchar_key' => null,
                    'destination_page_id' => $page->getKey(),
                    'priority' => $priority,
                ]);

                // 同じ登録内容で更新日時が変わり、表示順に影響することを防ぐ。
                if (! $link->exists || $link->isDirty()) {
                    $link->save();
                }
            }

            // 論理削除済みは通常スコープで除外し、再実行時に削除日時を更新しない。
            $deletedLinkKeys = $this->deletedLinkKeys ?? PortfolioLinksLancharDefinition::DELETED_LINK_KEYS;
            if ($deletedLinkKeys !== []) {
                Link::query()->whereIn('link_key', $deletedLinkKeys)->delete();
            }

            $deletedLinksLancharKeys = $this->deletedLinksLancharKeys ?? PortfolioLinksLancharDefinition::DELETED_LINKS_LANCHAR_KEYS;
            if ($deletedLinksLancharKeys !== []) {
                LinksLanchar::query()->whereIn('links_lanchar_key', $deletedLinksLancharKeys)->delete();
            }
        }, 3);
    }
}
