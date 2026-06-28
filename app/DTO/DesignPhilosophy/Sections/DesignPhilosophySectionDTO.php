<?php

namespace App\DTO\DesignPhilosophy\Sections;

final readonly class DesignPhilosophySectionDTO
{
    /*
     * この DTO は LP の1セクション分を運ぶデータキャリアです。
     * DB 取得、表示可否判断、Inertia レスポンス生成は持たせず、
     * config 由来の値を React が受け取りやすい camelCase の props へ写すところまでに限定します。
     */
    public function __construct(
        public string $key,
        public int $sortOrder,
        public string $eyebrow,
        public string $visualType,
        public string $icon,
        public string $title,
        public string $lead,
        public string $body,
        public string $proofLabel,
        public string $proofText,
        public array $items,
        public ?string $leftLabel,
        public ?string $rightLabel,
        public array $leftItems,
        public array $rightItems,
    ) {}

    /**
     * @param  array<string, mixed>  $section
     */
    public static function fromConfig(array $section): self
    {
        /*
         * config ファイル側は Laravel の慣例に合わせて snake_case を使います。
         * React props 側では camelCase を使いたいので、この生成境界で名前を写し替えます。
         *
         * enabled は Action が表示対象を選ぶための制御値であり、
         * 画面表示に必要な値ではないため DTO には保持しません。
         */
        return new self(
            key: (string) $section['key'],
            sortOrder: (int) $section['sort_order'],
            eyebrow: (string) ($section['eyebrow'] ?? ''),
            visualType: (string) ($section['visual_type'] ?? 'statement'),
            icon: (string) ($section['icon'] ?? 'Compass'),
            title: (string) $section['title'],
            lead: (string) $section['lead'],
            body: (string) $section['body'],
            proofLabel: (string) $section['proof_label'],
            proofText: (string) $section['proof_text'],
            items: self::normalizeItems($section['items'] ?? []),
            leftLabel: isset($section['left_label']) ? (string) $section['left_label'] : null,
            rightLabel: isset($section['right_label']) ? (string) $section['right_label'] : null,
            leftItems: self::normalizeTextList($section['left_items'] ?? []),
            rightItems: self::normalizeTextList($section['right_items'] ?? []),
        );
    }

    /**
     * @return array{
     *     key: string,
     *     sortOrder: int,
     *     eyebrow: string,
     *     visualType: string,
     *     icon: string,
     *     title: string,
     *     lead: string,
     *     body: string,
     *     proofLabel: string,
     *     proofText: string,
     *     items: array<int, array{label: string, description: string}>,
     *     leftLabel: string|null,
     *     rightLabel: string|null,
     *     leftItems: array<int, string>,
     *     rightItems: array<int, string>
     * }
     */
    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'sortOrder' => $this->sortOrder,
            'eyebrow' => $this->eyebrow,
            'visualType' => $this->visualType,
            'icon' => $this->icon,
            'title' => $this->title,
            'lead' => $this->lead,
            'body' => $this->body,
            'proofLabel' => $this->proofLabel,
            'proofText' => $this->proofText,
            'items' => $this->items,
            'leftLabel' => $this->leftLabel,
            'rightLabel' => $this->rightLabel,
            'leftItems' => $this->leftItems,
            'rightItems' => $this->rightItems,
        ];
    }

    /**
     * @return array<int, array{label: string, description: string}>
     */
    private static function normalizeItems(mixed $items): array
    {
        if (! is_array($items)) {
            return [];
        }

        $normalized = [];

        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $normalized[] = [
                'label' => (string) ($item['label'] ?? ''),
                'description' => (string) ($item['description'] ?? ''),
            ];
        }

        return $normalized;
    }

    /**
     * @return array<int, string>
     */
    private static function normalizeTextList(mixed $items): array
    {
        if (! is_array($items)) {
            return [];
        }

        $normalized = [];

        foreach ($items as $item) {
            $value = (string) $item;

            if ($value === '') {
                continue;
            }

            $normalized[] = $value;
        }

        return $normalized;
    }
}
