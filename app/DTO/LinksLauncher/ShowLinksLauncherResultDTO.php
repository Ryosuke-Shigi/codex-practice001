<?php

namespace App\DTO\LinksLauncher;

/**
 * 公開中の結果だけに本体と所属Linkの値を含めます。
 */
final readonly class ShowLinksLauncherResultDTO
{
    /**
     * @param  list<LinkSnapshotDTO>  $links
     */
    public function __construct(
        public LinksLauncherReadStatus $status,
        public ?LinksLauncherSnapshotDTO $linksLauncher = null,
        public array $links = [],
        public ?string $selectedLinkKey = null,
    ) {}
}
