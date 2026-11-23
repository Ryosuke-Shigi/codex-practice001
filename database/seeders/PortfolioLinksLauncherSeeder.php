<?php

namespace Database\Seeders;

use App\Models\Link;
use App\Models\LinkPage;
use App\Models\LinksLauncher;
use App\Support\Portfolio\PortfolioLinksLauncherDefinition;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use LogicException;

final class PortfolioLinksLauncherSeeder extends Seeder
{
    /**
     * @param  list<string>|null  $deletedLinkKeys  論理削除するLinkの固有キー
     * @param  list<string>|null  $deletedLinksLauncherKeys  論理削除する本体の固有キー
     */
    public function __construct(
        private readonly ?array $deletedLinkKeys = null,
        private readonly ?array $deletedLinksLauncherKeys = null,
    ) {}

    public function run(): void
    {
        DB::transaction(function (): void {
            $launcher = LinksLauncher::withTrashed()
                ->lockForUpdate()
                ->firstOrCreate(['links_launcher_key' => PortfolioLinksLauncherDefinition::LINKS_LAUNCHER_KEY]);

            $priority = 0;
            foreach (PortfolioLinksLauncherDefinition::links() as $projectId => $definition) {
                $priority++;
                $link = Link::withTrashed()->firstOrNew(['link_key' => $definition['link_key']]);
                if ($link->trashed()) {
                    continue;
                }

                $destinationUrl = PortfolioLinksLauncherDefinition::destinationUrlForProject($projectId);
                if ($destinationUrl === null) {
                    throw new LogicException('初期定義の行き先がありません。');
                }

                $page = LinkPage::query()->firstOrCreate(['url' => $destinationUrl]);
                $link->fill([
                    ...$definition,
                    'owner_links_launcher_key' => $launcher->links_launcher_key,
                    'destination_links_launcher_key' => null,
                    'destination_page_id' => $page->getKey(),
                    'priority' => $priority,
                ]);

                // 同じ登録内容で更新日時が変わり、表示順に影響することを防ぐ。
                if (! $link->exists || $link->isDirty()) {
                    $link->save();
                }
            }

            // 論理削除済みは通常スコープで除外し、再実行時に削除日時を更新しない。
            $deletedLinkKeys = $this->deletedLinkKeys ?? PortfolioLinksLauncherDefinition::DELETED_LINK_KEYS;
            if ($deletedLinkKeys !== []) {
                Link::query()->whereIn('link_key', $deletedLinkKeys)->delete();
            }

            $deletedLinksLauncherKeys = $this->deletedLinksLauncherKeys ?? PortfolioLinksLauncherDefinition::DELETED_LINKS_LAUNCHER_KEYS;
            if ($deletedLinksLauncherKeys !== []) {
                LinksLauncher::query()->whereIn('links_launcher_key', $deletedLinksLauncherKeys)->delete();
            }
        }, 3);
    }
}
