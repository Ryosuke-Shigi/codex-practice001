<?php

namespace App\DTO\DesignPhilosophy\Sections;

use InvalidArgumentException;

final readonly class DesignPhilosophySectionDTO
{
    private const SECTION_KEYS = [
        'hero',
        'principles',
        'human-ai-roles',
        'ai-development-flow',
        'architecture',
        'development-stages',
        'quality-gates',
        'improvement-loop',
        'closing',
    ];

    /*
     * この DTO は LP の1セクション分を運ぶデータキャリアです。
     * DB 取得、表示可否判断、Inertia レスポンス生成は持たせず、
     * config 由来の値を React が受け取りやすい camelCase の props へ写すところまでに限定します。
     */
    private function __construct(
        public string $key,
        public int $sortOrder,
        public string $eyebrow,
        public string $title,
        public string $lead,
        public string $body,
    ) {}

    /**
     * @param  array<string, mixed>  $section
     */
    public static function fromConfig(array $section): self
    {
        /*
         * 固定9章の key だけを受け入れ、config ファイル側は Laravel の慣例に合わせて snake_case を使います。
         * React props 側では camelCase を使いたいので、この生成境界で名前を写し替えます。
         *
         * enabled は Action が表示対象を選ぶための制御値であり、
         * 画面表示に必要な値ではないため DTO には保持しません。
         */
        $key = $section['key'] ?? null;

        if (! self::supportsKey($key)) {
            throw new InvalidArgumentException('Unsupported design philosophy section key.');
        }

        return new self(
            key: $key,
            sortOrder: (int) $section['sort_order'],
            eyebrow: (string) ($section['eyebrow'] ?? ''),
            title: (string) $section['title'],
            lead: (string) $section['lead'],
            body: (string) $section['body'],
        );
    }

    public static function supportsKey(mixed $key): bool
    {
        return is_string($key) && in_array($key, self::SECTION_KEYS, true);
    }

    /**
     * @return array{
     *     key: 'hero'|'principles'|'human-ai-roles'|'ai-development-flow'|'architecture'|'development-stages'|'quality-gates'|'improvement-loop'|'closing',
     *     sortOrder: int,
     *     eyebrow: string,
     *     title: string,
     *     lead: string,
     *     body: string
     * }
     */
    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'sortOrder' => $this->sortOrder,
            'eyebrow' => $this->eyebrow,
            'title' => $this->title,
            'lead' => $this->lead,
            'body' => $this->body,
        ];
    }
}
