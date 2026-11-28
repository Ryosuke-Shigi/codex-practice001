import type { DesignPhilosophySection, DesignPhilosophySectionKey } from './designPhilosophyTypes';

type Chapter = Exclude<DesignPhilosophySectionKey, 'hero'>;
type Topic = {
    id: string;
    title: string;
    summary: string;
    image: 'architecture-layers' | 'change-module' | 'understanding-notes' | 'development-quality' | 'human-ai-handoff';
    chapters: readonly Chapter[];
};

const topics = [
    {
        id: 'philosophy-architecture',
        title: 'アーキテクチャ',
        summary: '責務を分け、変更の影響範囲を明確にする。',
        image: 'architecture-layers',
        chapters: ['architecture'],
    },
    {
        id: 'philosophy-change',
        title: '変更への対応',
        summary: '必要な部分を変更できる構造にする。',
        image: 'change-module',
        chapters: ['architecture'],
    },
    {
        id: 'philosophy-understanding',
        title: '理解再起動',
        summary: '時間が経過しても、設計意図を理解し直せるようにする。',
        image: 'understanding-notes',
        chapters: ['architecture'],
    },
    {
        id: 'philosophy-quality',
        title: '開発と品質',
        summary: '構想から完成まで、段階ごとに確かめる。',
        image: 'development-quality',
        chapters: ['development-stages', 'improvement-loop'],
    },
    {
        id: 'philosophy-ai',
        title: 'AI駆動開発・ハーネス',
        summary: 'AIを活用しながら、人が設計と完成の判断を持つ。',
        image: 'human-ai-handoff',
        chapters: ['principles', 'human-ai-roles', 'ai-development-flow', 'quality-gates', 'closing'],
    },
] as const satisfies readonly Topic[];

export type PhilosophyTopicImage = typeof topics[number]['image'];
export type PhilosophyTopicDetailKey = Chapter | 'change-module' | 'understanding-notes';

const previousGroups = {
    roles: ['human-ai-roles', 'ai-development-flow'],
    structure: ['architecture'],
    checks: ['quality-gates', 'principles', 'improvement-loop', 'closing'],
    stages: ['development-stages'],
} as const satisfies Record<string, readonly [Chapter, ...Chapter[]]>;

/** propsの有効キーと受信順から、節の詳細と旧リンクの配置先を決めます。 */
export function buildPhilosophyTopics(sections: readonly DesignPhilosophySection[]) {
    const enabled = sections.flatMap(({ key }) => key === 'hero' ? [] : [key]);
    const aliasesByChapter = new Map<Chapter, string[]>();

    for (const [alias, [primary, ...fallbacks]] of Object.entries(previousGroups)) {
        const target = enabled.includes(primary)
            ? primary
            : enabled.find(chapter => fallbacks.some(fallback => fallback === chapter));
        if (!target) continue;
        aliasesByChapter.set(target, [...(aliasesByChapter.get(target) ?? []), alias]);
    }

    return topics.flatMap(topic => {
        const chapters = enabled.filter(chapter => topic.chapters.some(key => key === chapter));
        if (chapters.length === 0) return [];

        return [{
            ...topic,
            details: chapters.map(chapter => {
                // 変更・理解の節は表示設定だけを共有し、旧章アンカーはアーキテクチャに残します。
                if (topic.image === 'change-module' || topic.image === 'understanding-notes') {
                    return { key: topic.image, id: undefined, aliases: [] };
                }
                return { key: chapter, id: chapter, aliases: aliasesByChapter.get(chapter) ?? [] };
            }),
        }];
    });
}
