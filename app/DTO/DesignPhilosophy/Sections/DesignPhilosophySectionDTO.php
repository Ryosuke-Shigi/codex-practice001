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
        public string $title,
        public string $lead,
        public string $body,
        public string $proofLabel,
        public string $proofText,
    ) {
    }

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
            title: (string) $section['title'],
            lead: (string) $section['lead'],
            body: (string) $section['body'],
            proofLabel: (string) $section['proof_label'],
            proofText: (string) $section['proof_text'],
        );
    }

    /**
     * @return array{
     *     key: string,
     *     sortOrder: int,
     *     title: string,
     *     lead: string,
     *     body: string,
     *     proofLabel: string,
     *     proofText: string
     * }
     */
    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'sortOrder' => $this->sortOrder,
            'title' => $this->title,
            'lead' => $this->lead,
            'body' => $this->body,
            'proofLabel' => $this->proofLabel,
            'proofText' => $this->proofText,
        ];
    }
}
