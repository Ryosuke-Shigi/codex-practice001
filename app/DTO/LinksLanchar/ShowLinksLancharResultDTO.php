<?php

namespace App\DTO\LinksLanchar;

/**
 * 公開中の結果だけに本体と所属Linkの値を含めます。
 */
final readonly class ShowLinksLancharResultDTO
{
    /**
     * @param  list<LinkSnapshotDTO>  $links
     */
    public function __construct(
        public LinksLancharReadStatus $status,
        public ?LinksLancharSnapshotDTO $linksLanchar = null,
        public array $links = [],
        public ?string $selectedLinkKey = null,
    ) {}
}
