// @vitest-environment jsdom

// @ts-expect-error Vitest runs in Node while the application tsconfig intentionally omits Node ambient types.
import { readFileSync } from 'node:fs';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DesignPhilosophyView from '@/Components/DesignPhilosophy/DesignPhilosophyView';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

vi.mock('@inertiajs/react', () => ({
    Link: ({
        children,
        href,
        ...props
    }: {
        children?: ReactNode;
        href: string;
    }) => (
        <a {...props} data-inertia-link="true" href={href}>
            {children}
        </a>
    ),
}));

const sections: DesignPhilosophySection[] = ([
    ['hero', 'ポートフォリオ／設計思想', '人間主導のAI開発設計思想'],
    ['principles', '01 / CORE PRINCIPLES', '品質を支える、8つの制御原則。'],
    ['human-ai-roles', '02 / HUMAN + AI', '判断と作業の責務を分ける。'],
    ['ai-development-flow', '03 / CONTROLLED FLOW', '速さではなく、制御できる流れをつくる。'],
    ['architecture', '04 / LARAVEL ARCHITECTURE', 'Laravelの責務を、変更理由で分ける。'],
    ['development-stages', '05 / DEVELOPMENT STAGES', '目的に合う段階だけを使う。'],
    ['quality-gates', '06 / QUALITY GATES', '変更内容に必要な品質ゲートを選ぶ。'],
    ['improvement-loop', '07 / CONTROLLED IMPROVEMENT', '問題を、次の品質へ戻す。'],
    ['closing', 'DESIGN PHILOSOPHY', '壊さず、迷わず、成長し続ける。'],
] as const).map(([key, eyebrow, title], index) => ({
    key,
    sortOrder: (index + 1) * 10,
    eyebrow,
    title,
    lead: `${title}の説明`,
    body: `${title}の本文`,
}));

let container: HTMLDivElement;
let root: Root;
const originalIntersectionObserver = window.IntersectionObserver;
const originalMatchMedia = window.matchMedia;
const designPhilosophyCss = readFileSync(
    'resources/js/Components/DesignPhilosophy/designPhilosophy.css',
    'utf8',
);

function render(ui: ReactNode) {
    act(() => root.render(ui));
}

function setIntersectionObserver(
    implementation: typeof IntersectionObserver | undefined,
) {
    if (implementation === undefined) {
        Reflect.deleteProperty(window, 'IntersectionObserver');

        return;
    }

    Object.defineProperty(window, 'IntersectionObserver', {
        configurable: true,
        writable: true,
        value: implementation,
    });
}

function setMotionPreferences(reducedMotion: boolean) {
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: (query: string) =>
            ({
                matches:
                    query === '(prefers-reduced-motion: reduce)' &&
                    reducedMotion,
                media: query,
                onchange: null,
                addEventListener: () => undefined,
                removeEventListener: () => undefined,
                addListener: () => undefined,
                removeListener: () => undefined,
                dispatchEvent: () => false,
            }) satisfies MediaQueryList,
    });
}

describe('DesignPhilosophyView', () => {
    beforeEach(() => {
        (
            globalThis as typeof globalThis & {
                IS_REACT_ACT_ENVIRONMENT: boolean;
            }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        setIntersectionObserver(originalIntersectionObserver);
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            writable: true,
            value: originalMatchMedia,
        });
    });

    it('人間主導の設計思想を9章の公開契約として描画する', () => {
        render(<DesignPhilosophyView sections={sections} />);

        expect(container.querySelectorAll('h1')).toHaveLength(1);
        expect(container.querySelector('h1')?.textContent).toBe(
            '人間主導のAI開発設計思想',
        );
        const heroSection = container.querySelector('.dp-hero');
        const heroSignals = heroSection?.querySelectorAll(
            '[aria-label="設計思想の特性"] li',
        );
        expect(
            Array.from(heroSignals ?? []).map((signal) => signal.textContent),
        ).toEqual([
            '人間主導',
            '契約駆動',
            '単一編集',
            '独立検証',
            '安全停止',
            '継続改善',
        ]);
        expect(heroSection?.textContent).not.toContain('TRACEABLE');
        expect(heroSection?.textContent).not.toContain('REVERSIBLE');
        expect(
            container.querySelector('a[href="#ai-development-flow"]'),
        ).not.toBeNull();
        expect(
            container.querySelector('a[href="#architecture"]'),
        ).not.toBeNull();
        expect(container.querySelector('a[href="/projects"]')).not.toBeNull();

        const principleSection = container.querySelector(
            '[aria-labelledby="design-philosophy-principles"]',
        );
        expect(principleSection?.querySelectorAll('article')).toHaveLength(8);
        [
            '人間主導',
            '契約駆動',
            '責務分離',
            '単一編集',
            '独立検証',
            '安全に止まる',
            '必要な工程だけを使う',
            '制御された継続改善',
        ].forEach((principle) =>
            expect(principleSection?.textContent).toContain(principle),
        );

        const roleSection = container.querySelector(
            '[aria-labelledby="design-philosophy-human-ai-roles"]',
        );
        expect(roleSection?.querySelectorAll('article')).toHaveLength(7);
        [
            '人間',
            'ChatGPT',
            '親Agent',
            'Specialist',
            'Writer',
            'Verifier',
            'Reviewer',
        ].forEach((role) => expect(roleSection?.textContent).toContain(role));

        const flowSection = container.querySelector(
            '[aria-labelledby="design-philosophy-ai-development-flow"]',
        );
        const flowRegion = flowSection?.querySelector<HTMLElement>(
            '[role="region"][tabindex="0"]',
        );
        expect(flowRegion).not.toBeNull();
        expect(flowRegion?.querySelectorAll('ol > li')).toHaveLength(11);
        expect(
            Array.from(flowRegion?.querySelectorAll('h3') ?? []).map(
                (heading) => heading.textContent,
            ),
        ).toEqual([
            '人間が構想を定める',
            'ChatGPTで壁打ちする',
            '目的・範囲・成功条件を固定',
            '作業契約を作る',
            '必要な専門役割だけを選ぶ',
            '親Agentが結果を統合',
            '単一Writerが実装',
            'Verifierが独立検証',
            'Reviewerが独立レビュー',
            '改善候補を評価',
            '完了・修正・別課題化・人間判断へ分岐',
        ]);

        expect(container.textContent).toContain('Action - Domain - Responder');
        const architectureSection = container.querySelector(
            '[aria-labelledby="design-philosophy-architecture"]',
        );
        [
            'HTTP・画面入口',
            'ユースケースの進行',
            '再利用できる業務判断',
            '事実と副作用の分離',
            'データ契約',
            '永続化と外部接続',
            '非同期実行',
            '出力と画面接続',
        ].forEach((responsibility) =>
            expect(architectureSection?.textContent).toContain(responsibility),
        );
        const architectureCards = architectureSection?.querySelectorAll(
            '[data-architecture-layer]',
        );
        expect(architectureCards).toHaveLength(3);
        expect(
            architectureSection?.querySelector(
                '[data-responsibility-category="entry"]',
            )?.textContent,
        ).toContain('Request / Controller');
        expect(
            architectureSection?.querySelector(
                '[data-responsibility-category="entry"]',
            )?.textContent,
        ).toContain('Page / Component');
        expect(
            architectureSection?.querySelector(
                '[data-responsibility-category="application"]',
            )?.textContent,
        ).toContain('Action');
        expect(
            architectureSection?.querySelector(
                '[data-responsibility-category="domain"]',
            )?.textContent,
        ).toContain('Service / Strategy');
        const infrastructureText = Array.from(
            architectureSection?.querySelectorAll(
                '[data-responsibility-category="infrastructure"]',
            ) ?? [],
        )
            .map((item) => item.textContent)
            .join(' ');
        expect(
            infrastructureText,
        ).toContain('Repository実装 / 外部Adapter');
        expect(infrastructureText).toContain('Queue / Job');
        expect(
            architectureSection?.querySelector(
                '[data-responsibility-category="output"]',
            )?.textContent,
        ).toContain('Responder');

        const developmentSection = container.querySelector(
            '[aria-labelledby="design-philosophy-development-stages"]',
        );
        ['IDEA BOARD', 'MOCK', 'PROTOTYPE', 'PRODUCT'].forEach((stage) =>
            expect(developmentSection?.textContent).toContain(stage),
        );
        expect(
            developmentSection?.querySelector('[data-stage-cards]'),
        ).not.toBeNull();
        expect(
            developmentSection?.querySelector('table[data-stage-table]'),
        ).not.toBeNull();
        expect(
            Array.from(
                developmentSection?.querySelectorAll(
                    'table[data-stage-table] thead th',
                ) ?? [],
            ).map((heading) => heading.textContent),
        ).toEqual([
            '段階',
            '目的',
            '扱うもの',
            '扱わないもの',
            '成果',
            '完了条件',
        ]);
        developmentSection
            ?.querySelectorAll('[data-stage-cards] article')
            .forEach((card) => {
                ['目的', '扱うもの', '扱わないもの', '成果', '完了条件'].forEach(
                    (label) => expect(card.textContent).toContain(label),
                );
            });

        const qualitySection = container.querySelector(
            '[aria-labelledby="design-philosophy-quality-gates"]',
        );
        expect(qualitySection?.querySelectorAll('article')).toHaveLength(9);
        ['非同期処理', '認証と認可', '運用、監視、復旧'].forEach((gate) =>
            expect(qualitySection?.textContent).toContain(gate),
        );

        const improvementLoop = container.querySelector(
            '[aria-labelledby="design-philosophy-improvement-loop"]',
        );
        expect(improvementLoop?.querySelectorAll('ol > li')).toHaveLength(7);
        ['原因を確認', '採用', '保留', '却下', '別課題化'].forEach((step) =>
            expect(improvementLoop?.textContent).toContain(step),
        );

        expect(container.querySelector('[data-hero-system-core]')).not.toBeNull();
        expect(
            architectureSection?.querySelector('[data-architecture-stack]'),
        ).not.toBeNull();

        const closingSection = container.querySelector(
            '[aria-labelledby="design-philosophy-closing"]',
        );
        expect(
            closingSection
                ?.querySelector('a[href="/projects"]')
                ?.getAttribute('data-inertia-link'),
        ).toBe('true');
        const projectReturnLink = closingSection?.querySelector(
            'a[href="/projects"]',
        );
        expect(projectReturnLink?.textContent?.trim()).toBe('戻る');
        expect(projectReturnLink?.getAttribute('aria-label')).toBe(
            'PROJECT選択へ戻る',
        );
        expect(projectReturnLink?.getAttribute('title')).toBe(
            'PROJECT選択へ戻る',
        );
        expect(
            projectReturnLink?.querySelector('.lucide-arrow-left'),
        ).not.toBeNull();
        expect(projectReturnLink?.querySelector('.lucide-arrow-right')).toBeNull();
        ['#architecture', '#improvement-loop'].forEach((href) => {
            const anchor = closingSection?.querySelector(`a[href="${href}"]`);

            expect(anchor).not.toBeNull();
            expect(anchor?.hasAttribute('data-inertia-link')).toBe(false);
        });
    });

    it('内部情報と制作事情を公開DOMへ出さない', () => {
        render(<DesignPhilosophyView sections={sections} />);

        [
            'luna_explorer',
            'architecture_specialist',
            'frontend_specialist',
            'browser_verifier',
            '18 SUBAGENTS',
            '18件を表示中',
            'reasoning effort',
            'sandbox',
            'runtime',
            '実装仕様',
            'Three.js',
            'React Component',
        ].forEach((privateCopy) =>
            expect(container.textContent).not.toContain(privateCopy),
        );
    });

    it('architecture詳細を入口・ADR・infrastructureへ誤分類せず表示する', () => {
        render(<DesignPhilosophyView sections={sections} />);

        const architectureSection = container.querySelector(
            '[aria-labelledby="design-philosophy-architecture"]',
        );
        const categoryText = (category: string) =>
            Array.from(
                architectureSection?.querySelectorAll(
                    `[data-responsibility-category="${category}"]`,
                ) ?? [],
            )
                .map((item) => item.textContent)
                .join(' ');

        expect(categoryText('entry')).toContain('Request / Controller');
        expect(categoryText('entry')).toContain('Page / Component');
        expect(categoryText('entry')).not.toContain('Action');
        expect(categoryText('application')).toContain('Action');
        expect(categoryText('domain')).toContain('Service / Strategy');
        expect(categoryText('domain')).toContain('Event / Listener');
        expect(categoryText('domain')).not.toContain('Queue / Job');
        expect(categoryText('infrastructure')).toContain(
            'Repository実装 / 外部Adapter',
        );
        expect(categoryText('infrastructure')).toContain('Queue / Job');
        expect(categoryText('output')).toContain('Responder');
    });

    it('4開発段階を同じ比較軸のカードと表へ展開する', () => {
        render(<DesignPhilosophyView sections={sections} />);

        const developmentSection = container.querySelector(
            '[aria-labelledby="design-philosophy-development-stages"]',
        );
        const comparisonLabels = [
            '目的',
            '扱うもの',
            '扱わないもの',
            '成果',
            '完了条件',
        ];

        developmentSection
            ?.querySelectorAll('[data-stage-cards] article')
            .forEach((card) => {
                comparisonLabels.forEach((label) =>
                    expect(card.textContent).toContain(label),
                );
            });
        expect(
            Array.from(
                developmentSection?.querySelectorAll(
                    'table[data-stage-table] thead th',
                ) ?? [],
            ).map((heading) => heading.textContent),
        ).toEqual(['段階', ...comparisonLabels]);
    });

    it('flowと開発段階を表示幅ごとに一つの読み順へ切り替える', () => {
        const tabletStart = designPhilosophyCss.indexOf(
            '@media (min-width: 640px) {',
        );
        const desktopStart = designPhilosophyCss.indexOf(
            '@media (min-width: 900px) {',
        );
        const landscapeStart = designPhilosophyCss.indexOf(
            '@media (min-width: 640px) and (orientation: landscape) and (max-height: 620px) {',
        );

        expect(tabletStart).toBeGreaterThan(0);
        expect(desktopStart).toBeGreaterThan(tabletStart);
        expect(landscapeStart).toBeGreaterThan(desktopStart);

        const baseCss = designPhilosophyCss.slice(0, tabletStart);
        const tabletCss = designPhilosophyCss.slice(
            tabletStart,
            desktopStart,
        );
        const desktopCss = designPhilosophyCss.slice(
            desktopStart,
            landscapeStart,
        );
        const landscapeCss = designPhilosophyCss.slice(landscapeStart);

        expect(baseCss).toMatch(
            /\.dp-flow-list\s*\{[^}]*grid-auto-flow:\s*row;/s,
        );
        expect(baseCss).not.toMatch(
            /\.dp-flow-region\s*\{[^}]*overflow-x:\s*auto;/s,
        );
        expect(tabletCss).toMatch(
            /\.dp-flow-list\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s,
        );
        expect(desktopCss).toMatch(
            /\.dp-flow-region\s*\{[^}]*overflow-x:\s*visible;/s,
        );
        expect(desktopCss).toMatch(
            /\.dp-flow-list\s*\{[^}]*grid-template-columns:\s*repeat\(4,/s,
        );
        expect(landscapeCss).toMatch(
            /\.dp-flow-region\s*\{[^}]*overflow-x:\s*auto;/s,
        );
        expect(landscapeCss).toMatch(/scroll-snap-type:\s*x mandatory;/);

        expect(baseCss).toMatch(
            /\.dp-stage-table-wrap\s*\{[^}]*display:\s*none;/s,
        );
        expect(desktopCss).toMatch(
            /\.dp-stage-grid\s*\{[^}]*display:\s*none;/s,
        );
        expect(desktopCss).toMatch(
            /\.dp-stage-table-wrap\s*\{[^}]*display:\s*block;/s,
        );
    });

    it('IntersectionObserverがない場合も全コンテンツを表示する', () => {
        setMotionPreferences(false);
        setIntersectionObserver(undefined);

        render(<DesignPhilosophyView sections={sections} />);

        expect(
            container.querySelectorAll('[data-reveal-state="pending"]'),
        ).toHaveLength(0);
        expect(container.querySelector('h1')?.textContent).toBe(
            '人間主導のAI開発設計思想',
        );
    });

    it('reduced motionではobserverを起動せず全コンテンツを表示する', () => {
        setMotionPreferences(true);
        let constructorCalls = 0;
        const CountingIntersectionObserver = function () {
            constructorCalls += 1;
        } as unknown as typeof IntersectionObserver;
        setIntersectionObserver(CountingIntersectionObserver);

        render(<DesignPhilosophyView sections={sections} />);

        expect(constructorCalls).toBe(0);
        expect(
            container.querySelectorAll('[data-reveal-state="pending"]'),
        ).toHaveLength(0);
        expect(container.querySelector('.dp-page')?.getAttribute(
            'data-reduced-motion',
        )).toBe('true');
    });

    it('observer生成が失敗してもCTAと本文を表示する', () => {
        setMotionPreferences(false);
        const ThrowingIntersectionObserver = function () {
            throw new Error('constructor failure');
        } as unknown as typeof IntersectionObserver;
        setIntersectionObserver(ThrowingIntersectionObserver);

        expect(() =>
            render(<DesignPhilosophyView sections={sections} />),
        ).not.toThrow();
        expect(
            container.querySelectorAll('[data-reveal-state="pending"]'),
        ).toHaveLength(0);
        expect(
            container.querySelector('a[href="#ai-development-flow"]'),
        ).not.toBeNull();
    });

    it('observer登録が失敗してもCTAと本文を表示する', () => {
        setMotionPreferences(false);
        class ObserveThrowingIntersectionObserver
            implements IntersectionObserver
        {
            readonly root = null;
            readonly rootMargin = '0px';
            readonly thresholds = [0];

            disconnect() {}

            observe() {
                throw new Error('observe failure');
            }

            takeRecords() {
                return [];
            }

            unobserve() {}
        }
        setIntersectionObserver(ObserveThrowingIntersectionObserver);

        expect(() =>
            render(<DesignPhilosophyView sections={sections} />),
        ).not.toThrow();
        expect(
            container.querySelectorAll('[data-reveal-state="pending"]'),
        ).toHaveLength(0);
        expect(
            container.querySelector('a[href="#architecture"]'),
        ).not.toBeNull();
    });
});
