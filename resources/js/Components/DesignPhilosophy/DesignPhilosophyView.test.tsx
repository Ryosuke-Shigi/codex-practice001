// @vitest-environment jsdom

// @ts-expect-error Vitest runs in Node while the application tsconfig intentionally omits Node ambient types.
import { readFileSync } from 'node:fs';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DesignPhilosophyView from '@/Components/DesignPhilosophy/DesignPhilosophyView';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

vi.mock('@inertiajs/react', () => ({
    Link: ({ children, href, ...props }: { children?: ReactNode; href: string }) => (
        <a {...props} data-inertia-link="true" href={href}>
            {children}
        </a>
    ),
}));

const sections: DesignPhilosophySection[] = ([
    ['hero', 'ポートフォリオ／設計思想', '人間が判断し、AIは分離された責務を実行する。'],
    ['principles', '01 / TASK CONTRACT', 'Task Contractで、変更の境界を固定する。'],
    ['human-ai-roles', '02 / HUMAN + AI', '必要な専門性だけを、Taskごとに選ぶ。'],
    ['ai-development-flow', '03 / CURRENT FLOW', '8段階で、調査からAcceptanceまでをつなぐ。'],
    ['architecture', '04 / ADR PATTERN', 'Action - Domain - Responderで、変更理由を分ける。'],
    ['development-stages', '05 / DEVELOPMENT STAGES', '開発段階を混同しない。'],
    ['quality-gates', '06 / EVIDENCE', 'Evidenceを相互代替しない。'],
    ['improvement-loop', '07 / IMPROVEMENT LOOP', 'Findingを、再発防止へ戻す。'],
    ['closing', 'FINAL ACCEPTANCE', '完成は、Evidenceと未確認事項を分けて判断する。'],
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
const css = readFileSync(
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

function section(key: string) {
    return container.querySelector(
        `[aria-labelledby="design-philosophy-${key}"]`,
    );
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

    it('現在の公開契約を固定9章の中へ描画する', () => {
        setMotionPreferences(true);
        render(<DesignPhilosophyView sections={sections} />);

        expect(container.querySelectorAll('h1')).toHaveLength(1);
        expect(container.querySelector('h1')?.textContent).toContain(
            '人間が判断し、AIは分離された責務を実行する。',
        );

        const contract = section('principles');
        [
            '目的',
            '範囲',
            '変更対象',
            '変更禁止',
            '成功条件',
            '失敗条件',
            '停止条件',
            '操作許可',
            '検証 / Review経路',
        ].forEach((item) => expect(contract?.textContent).toContain(item));

        const roles = section('human-ai-roles');
        ['人間', 'ChatGPT', '親Agent', 'Specialist', 'Writer', 'Verifier', 'Reviewer'].forEach(
            (role) => expect(roles?.textContent).toContain(role),
        );
        [
            '親を含め同時writer最大1',
            'normal working tree + linked worktree',
            'read-heavy独立作業だけを条件付き並列',
            'writer作業は直列',
            'Verifier / Reviewer中はwriter停止',
            'opt-in',
            'sequential physical isolation',
            'commit-based integration',
            'Parallel Writerではない',
        ].forEach((rule) => expect(roles?.textContent).toContain(rule));

        const flow = section('ai-development-flow');
        expect(flow?.querySelectorAll('[data-flow-step]')).toHaveLength(8);
        expect(
            Array.from(
                flow?.querySelectorAll(
                    '[data-flow-step] h3 [data-rpg-semantic]',
                ) ?? [],
            ).map(
                (heading) => heading.textContent,
            ),
        ).toEqual([
            '契約固定',
            '証拠駆動調査',
            '親統合 / Task分割',
            'Task実行ループ',
            '検証済みTask checkpoint',
            '統合検証',
            'Review / 改善評価',
            '最終Acceptance',
        ]);
        const flowSteps = Array.from(
            flow?.querySelectorAll('[data-flow-step]') ?? [],
        );
        expect(flowSteps[4]?.textContent).toContain(
            'Task Contractで選択した検証主体が、Task単位の結果と未確認事項を確認します。',
        );
        expect(flowSteps[4]?.textContent).not.toContain('Verifier');
        expect(
            flowSteps[4]?.querySelector(
                '.dp-flow-card__meta strong [data-rpg-semantic]',
            )?.textContent,
        ).toBe('Task Contract');
        expect(flowSteps[6]?.textContent).toContain(
            'Reviewerが指示、正本、差分、Evidence、Findingを照合し、改善候補は現在のTask Contract内で評価します。',
        );
        expect(
            flowSteps[6]?.querySelector(
                '.dp-flow-card__meta strong [data-rpg-semantic]',
            )?.textContent,
        ).toBe('Reviewer / Task Contract');
        ['基礎調査', 'Task分割', '実装Task A', '実装Task B', '統合検証'].forEach(
            (task) => expect(flow?.textContent).toContain(task),
        );
        expect(flow?.textContent).toContain('DAGはParallel Writer permissionではない');

        const architecture = section('architecture');
        expect(architecture?.textContent).toContain('Action - Domain - Responder');
        ['Technology', 'Capability', 'Integration', 'Role', 'Evidence'].forEach(
            (item) => expect(architecture?.textContent).toContain(item),
        );
        expect(architecture?.textContent).toContain(
            'Route → Controller → Request / Input DTO → Action → Service / Repository / Strategy → Output DTO / ListDTO → Responder → Page / Feature Component → Common Component',
        );

        const stages = section('development-stages');
        ['IDEA BOARD', 'MOCK', 'PROTOTYPE', 'PRODUCT'].forEach((stage) =>
            expect(stages?.textContent).toContain(stage),
        );

        const evidence = section('quality-gates');
        [
            'Static',
            'Installed',
            'Runtime',
            'Browser',
            'independent Verifier / Reviewer',
            'Human Review',
        ].forEach((kind) => expect(evidence?.textContent).toContain(kind));
        expect(evidence?.textContent).toContain('相互代替しない');

        const loop = section('improvement-loop');
        expect(loop?.querySelectorAll('[data-improvement-step]')).toHaveLength(8);
        ['Finding', 'Evidence', 'root cause', 'scope', 'owner', 'Fix', 'Verify', 'Feedback'].forEach(
            (step) => expect(loop?.textContent).toContain(step),
        );
        ['Code', 'Test', 'Type', 'Docs', 'Policy', 'Checker', 'Sensors', 'Harness'].forEach(
            (destination) => expect(loop?.textContent).toContain(destination),
        );
    });

    it('ADR責務でHTTP入口とpresentationを分ける', () => {
        setMotionPreferences(true);
        render(<DesignPhilosophyView sections={sections} />);

        const architecture = section('architecture');
        const categoryText = (category: string) =>
            Array.from(
                architecture?.querySelectorAll(
                    `[data-responsibility-category="${category}"]`,
                ) ?? [],
            )
                .map((item) => item.textContent)
                .join(' ');

        expect(categoryText('entry')).toContain('Request / Controller');
        expect(categoryText('entry')).not.toContain('Page / Feature Component');
        expect(categoryText('application')).toContain('Action');
        expect(categoryText('domain')).toContain('Service / Repository / DTO');
        expect(categoryText('output')).toContain('Responder');
        expect(categoryText('presentation')).toContain('Page / Feature Component');
    });

    it('内部runtime情報は公開せずRuntime Evidenceという一般概念だけを表示する', () => {
        setMotionPreferences(true);
        render(<DesignPhilosophyView sections={sections} />);

        const evidence = section('quality-gates');
        expect(evidence?.textContent).toContain('Runtime');
        expect(evidence?.textContent).toContain(
            '実行中に観測したeffective stateやruntime metadataなどの実測結果。',
        );
        expect(evidence?.textContent).toContain(
            '設定値やInstalledの確認から推測しない',
        );
        expect(evidence?.textContent).not.toContain(
            '登録されたcommandを実行して得た結果。',
        );
        [
            'resolved model',
            'reasoning effort',
            'effective sandbox',
            'permission profile',
            'session ID',
            '18 SUBAGENTS',
        ].forEach((privateCopy) =>
            expect(container.textContent).not.toContain(privateCopy),
        );
    });

    it('全可視テキストを全文semantic textとaria-hidden文字列へ分離する', () => {
        setMotionPreferences(true);
        render(<DesignPhilosophyView sections={sections} />);

        const nakedTextNodes: string[] = [];
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();

        while (node) {
            const value = node.textContent?.trim();
            const parent = node.parentElement;
            if (
                value &&
                !parent?.closest('[data-rpg-text]') &&
                !parent?.closest('svg')
            ) {
                nakedTextNodes.push(value);
            }
            node = walker.nextNode();
        }

        expect(nakedTextNodes).toEqual([]);
        const rpgTexts = container.querySelectorAll('[data-rpg-text]');
        expect(rpgTexts.length).toBeGreaterThan(60);
        rpgTexts.forEach((text) => {
            const semantic = text.querySelector('[data-rpg-semantic]');
            const visual = text.querySelector('[data-rpg-visual]');
            expect(semantic?.textContent?.length).toBeGreaterThan(0);
            expect(visual?.getAttribute('aria-hidden')).toBe('true');
            expect(visual?.textContent).toBe(semantic?.textContent);
        });
    });

    it('viewportへ入ったsectionだけRPG表示を開始する', () => {
        setMotionPreferences(false);
        const observed: Element[] = [];
        const unobserved: Element[] = [];
        let callback: IntersectionObserverCallback | undefined;

        class RecordingIntersectionObserver implements IntersectionObserver {
            readonly root = null;
            readonly rootMargin = '0px';
            readonly thresholds = [0];

            constructor(next: IntersectionObserverCallback) {
                callback = next;
            }

            disconnect() {}
            observe(target: Element) {
                observed.push(target);
            }
            takeRecords() {
                return [];
            }
            unobserve(target: Element) {
                unobserved.push(target);
            }
        }
        setIntersectionObserver(RecordingIntersectionObserver);

        render(<DesignPhilosophyView sections={sections} />);

        expect(container.querySelector('.dp-page')?.getAttribute('data-rpg-enhanced')).toBe('true');
        expect(observed).toHaveLength(9);
        expect(observed.every((item) => item.getAttribute('data-rpg-state') === 'pending')).toBe(true);
        expect(observed.every((item) => item.getAttribute('data-motion-state') === 'inactive')).toBe(true);

        act(() => {
            callback?.(
                [
                    {
                        target: observed[0],
                        isIntersecting: true,
                    } as IntersectionObserverEntry,
                ],
                {} as IntersectionObserver,
            );
        });

        expect(observed[0].getAttribute('data-rpg-state')).toBe('visible');
        expect(observed[0].getAttribute('data-motion-state')).toBe('active');
        expect(observed[1].getAttribute('data-rpg-state')).toBe('pending');

        act(() => {
            callback?.(
                [
                    {
                        target: observed[0],
                        isIntersecting: false,
                    } as IntersectionObserverEntry,
                ],
                {} as IntersectionObserver,
            );
        });

        expect(observed[0].getAttribute('data-rpg-state')).toBe('visible');
        expect(observed[0].getAttribute('data-motion-state')).toBe('inactive');
        expect(unobserved).toHaveLength(0);
    });

    it('document hidden中はmotionを停止しcleanupで監視状態を除去する', () => {
        setMotionPreferences(false);
        let disconnected = false;

        class CleanupIntersectionObserver implements IntersectionObserver {
            readonly root = null;
            readonly rootMargin = '0px';
            readonly thresholds = [0];

            disconnect() {
                disconnected = true;
            }
            observe() {}
            takeRecords() {
                return [];
            }
            unobserve() {}
        }
        setIntersectionObserver(CleanupIntersectionObserver);

        render(<DesignPhilosophyView sections={sections} />);
        const page = container.querySelector('.dp-page');

        Object.defineProperty(document, 'hidden', {
            configurable: true,
            value: true,
        });
        act(() => document.dispatchEvent(new Event('visibilitychange')));
        expect(page?.getAttribute('data-motion-paused')).toBe('true');

        act(() => root.unmount());
        expect(disconnected).toBe(true);
        expect(page?.hasAttribute('data-motion-paused')).toBe(false);
        expect(page?.hasAttribute('data-rpg-enhanced')).toBe(false);
        expect(page?.querySelector('[data-motion-state]')).toBeNull();
        root = createRoot(container);

        Object.defineProperty(document, 'hidden', {
            configurable: true,
            value: false,
        });
    });

    it('reduced motionとobserver失敗では全文を即時表示する', () => {
        setMotionPreferences(true);
        let constructorCalls = 0;
        const CountingIntersectionObserver = function () {
            constructorCalls += 1;
        } as unknown as typeof IntersectionObserver;
        setIntersectionObserver(CountingIntersectionObserver);

        render(<DesignPhilosophyView sections={sections} />);

        expect(constructorCalls).toBe(0);
        expect(container.querySelector('.dp-page')?.getAttribute('data-reduced-motion')).toBe('true');
        expect(container.querySelector('.dp-page')?.hasAttribute('data-rpg-enhanced')).toBe(false);
        expect(container.querySelectorAll('[data-rpg-state="pending"]')).toHaveLength(0);

        act(() => root.unmount());
        root = createRoot(container);
        setMotionPreferences(false);
        const ThrowingIntersectionObserver = function () {
            throw new Error('constructor failure');
        } as unknown as typeof IntersectionObserver;
        setIntersectionObserver(ThrowingIntersectionObserver);

        expect(() => render(<DesignPhilosophyView sections={sections} />)).not.toThrow();
        expect(container.querySelector('.dp-page')?.hasAttribute('data-rpg-enhanced')).toBe(false);
        expect(container.querySelectorAll('[data-rpg-state="pending"]')).toHaveLength(0);
    });

    it('observer登録失敗でも全文とCTAを残す', () => {
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

        expect(() => render(<DesignPhilosophyView sections={sections} />)).not.toThrow();
        expect(container.querySelector('.dp-page')?.hasAttribute('data-rpg-enhanced')).toBe(false);
        expect(container.querySelectorAll('[data-rpg-state="pending"]')).toHaveLength(0);
        expect(container.querySelector('a[href="#architecture"]')).not.toBeNull();
    });

    it('CTAのaccessible nameを全文のまま維持する', () => {
        setMotionPreferences(true);
        render(<DesignPhilosophyView sections={sections} />);

        const flowLink = container.querySelector('a[href="#ai-development-flow"]');
        const returnLink = container.querySelector('a[href="/"]');
        expect(flowLink?.querySelector('[data-rpg-semantic]')?.textContent).toBe(
            '8段階フローを見る',
        );
        expect(
            flowLink?.querySelector('[data-rpg-visual]')?.getAttribute('aria-hidden'),
        ).toBe('true');
        expect(container.querySelector('a[href="/projects"]')).toBeNull();
        expect(returnLink).not.toBeNull();
        expect(returnLink?.getAttribute('aria-label')).toBeNull();
        expect(returnLink?.getAttribute('title')).toBeNull();
        expect(returnLink?.querySelector('[data-rpg-semantic]')?.textContent).toBe('戻る');
        expect(returnLink?.querySelector('[data-rpg-visual]')?.textContent).toBe('戻る');
        expect(returnLink?.textContent).toBe('戻る戻る');
    });

    it('和紙・墨・3書体とmobile-first再構成をCSS契約として持つ', () => {
        const tabletStart = css.indexOf('@media (min-width: 640px) {');
        const desktopStart = css.indexOf('@media (min-width: 900px) {');
        const landscapeStart = css.indexOf(
            '@media (orientation: landscape) and (max-height: 620px) {',
        );
        expect(tabletStart).toBeGreaterThan(0);
        expect(desktopStart).toBeGreaterThan(tabletStart);
        expect(landscapeStart).toBeGreaterThan(desktopStart);

        const base = css.slice(0, tabletStart);
        const tablet = css.slice(tabletStart, desktopStart);
        const desktop = css.slice(desktopStart, landscapeStart);
        const landscape = css.slice(
            landscapeStart,
            css.indexOf('@media (prefers-reduced-motion: reduce)'),
        );

        expect(base).toContain("url('/images/design-philosophy/washi-b.png')");
        expect(base).toMatch(/background-repeat:\s*repeat/);
        expect(base).toMatch(/\.dp-page::after\s*\{[^}]*position:\s*fixed/s);
        expect(base).toContain('--dp-font-heading');
        expect(base).toContain('--dp-font-body');
        expect(base).toContain('--dp-font-technical');
        expect(base).not.toMatch(/\.dp-dag[^}]*overflow-x:\s*auto/s);
        expect(tablet).toMatch(/\.dp-flow-list\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s);
        expect(desktop).toMatch(/\.dp-flow-list\s*\{[^}]*grid-template-columns:\s*repeat\(4,/s);
        expect(desktop).toMatch(/\.dp-architecture-layers\s*\{[^}]*grid-template-columns:\s*repeat\(3,/s);
        expect(landscape).toMatch(/\.dp-flow-list\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s);
        expect(landscape).not.toMatch(/overflow-x:\s*auto/);
        expect(landscape).not.toMatch(/grid-auto-flow:\s*column/);
        expect(landscape).toMatch(/\.dp-technical,[\s\S]*\.dp-layer-flow\s*\{[^}]*writing-mode:\s*horizontal-tb/s);
        expect(landscape).toMatch(/max-width:\s*559px[\s\S]*\.dp-flow-list,[\s\S]*grid-template-columns:\s*1fr/s);
        expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
    });

    it('構造理解motionをactive sectionだけで実行するCSS契約を持つ', () => {
        setMotionPreferences(true);
        render(<DesignPhilosophyView sections={sections} />);

        ['flow', 'dag', 'writer-lease', 'adr-flow', 'evidence', 'improvement'].forEach(
            (motion) =>
                expect(
                    container.querySelector(`[data-structure-motion="${motion}"]`),
                ).not.toBeNull(),
        );

        expect(css).toContain('@keyframes dp-line-draw');
        expect(css).toContain('@keyframes dp-signal-travel');
        expect(css).toContain('@keyframes dp-node-activate');
        expect(css).toContain('@keyframes dp-lease-position');
        expect(css).toContain(
            'animation: dp-signal-travel 3.6s ease-in-out 1 both;',
        );
        expect(css).toContain(
            'animation: dp-lease-position 4.2s ease-in-out 1 both;',
        );
        expect(css).not.toMatch(
            /animation:\s*dp-(?:signal-travel|lease-position)[^;]*\binfinite\b/,
        );
        expect(css).toMatch(/data-motion-state="active"/);
        expect(css).toMatch(/data-motion-state="inactive"[\s\S]*animation-play-state:\s*paused/);
        expect(css).toMatch(/data-motion-paused="true"[\s\S]*animation-play-state:\s*paused/);
    });
});
