// @vitest-environment jsdom
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DesignPhilosophyView from './DesignPhilosophyView';
import type { DesignPhilosophySection } from './designPhilosophyTypes';

vi.mock('@inertiajs/react', () => ({
    Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const legacyKeys = [
    'hero', 'principles', 'human-ai-roles', 'ai-development-flow', 'architecture',
    'development-stages', 'quality-gates', 'improvement-loop', 'closing',
] as const;

const sections: DesignPhilosophySection[] = legacyKeys.map((key, sortOrder) => ({
    key,
    sortOrder,
    eyebrow: '01 / 旧章番号',
    title: key === 'hero' ? '変更できる。理解し直せる。確かめられる。' : key + 'の旧見出し',
    lead: key === 'hero' ? '継続的に開発・保守できるシステムを目指し、責務を分け、設計の意図を残し、実際の結果を確かめます。' : key + 'の旧要約',
    body: key + 'の旧説明',
}));

const headings = ['アーキテクチャ', '変更への対応', '理解再起動', '開発と品質', 'AI駆動開発・ハーネス'] as const;
const shortCopy = [
    '責務を分け、変更の影響範囲を明確にする。',
    '必要な部分を変更できる構造にする。',
    '時間が経過しても、設計意図を理解し直せるようにする。',
    '構想から完成まで、段階ごとに確かめる。',
    'AIを活用しながら、人が設計と完成の判断を持つ。',
];
const legacyGroups = [
    ['roles', 'human-ai-roles'],
    ['structure', 'architecture'],
    ['checks', 'quality-gates'],
    ['stages', 'development-stages'],
] as const;

let host: HTMLDivElement;
let root: Root;
const originalObserver = window.IntersectionObserver;
const originalMatchMedia = window.matchMedia;
const originalScroll = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView');
const scrolledTo: Element[] = [];

beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    window.history.replaceState(null, '', '/design-philosophy');
    scrolledTo.length = 0;
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
        configurable: true,
        value(this: Element) { scrolledTo.push(this); },
    });
    setReducedMotion(true);
});

afterEach(() => {
    act(() => root.unmount());
    host.remove();
    Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: originalObserver });
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia });
    if (originalScroll) Object.defineProperty(Element.prototype, 'scrollIntoView', originalScroll);
    else Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
});

function render(visibleSections = sections) {
    act(() => root.render(<DesignPhilosophyView sections={visibleSections} />));
}

function setReducedMotion(matches: boolean) {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches }) });
}

function sectionNamed(name: typeof headings[number]) {
    const heading = [...host.querySelectorAll('h2')].find(element => element.textContent?.trim() === name);
    const section = heading?.closest('section');
    expect(section, name).not.toBeNull();
    expect(section, name).toBeDefined();
    return section!;
}

function shownHeadings() {
    return [...host.querySelectorAll('h2')].map(heading => heading.textContent?.trim());
}

function detailOf(name: typeof headings[number]) {
    const detail = sectionNamed(name).querySelector('details');
    expect(detail, name).not.toBeNull();
    return detail!;
}

function summaryOf(detail: HTMLDetailsElement) {
    const summary = detail.querySelector('summary');
    expect(summary).not.toBeNull();
    return summary!;
}

function hashChange(id: string) {
    act(() => {
        window.history.replaceState(null, '', '#' + id);
        window.dispatchEvent(new Event('hashchange'));
    });
}

function expectHashDestination(id: string) {
    const target = host.querySelector('[id="' + id + '"]');
    expect(target, id).not.toBeNull();
    expect(target?.closest('details')?.open, id).toBe(true);
    expect(scrolledTo.some(element => target?.contains(element)), id).toBe(true);
}

function expectValidFragmentLinks() {
    const ids = [...host.querySelectorAll('[id]')].map(element => element.id);
    expect(ids).toHaveLength(new Set(ids).size);
    for (const anchor of host.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
        expect(ids, anchor.getAttribute('href') ?? '').toContain(decodeURIComponent(anchor.hash.slice(1)));
    }
}

function expectHero() {
    const title = host.querySelector('h1')?.textContent?.replace(/\s+/g, '');
    expect(title).toBe('変更できる。理解し直せる。確かめられる。');
}

describe('設計思想の通常表示と詳細', () => {
    it('冒頭、5節、短文、作品とトップへの導線を表示する', () => {
        render();
        expectHero();
        expect(shownHeadings()).toEqual(headings);
        expect(host.querySelector('#hero')?.textContent).toContain(
            '継続的に開発・保守できるシステムを目指し、責務を分け、設計の意図を残し、実際の結果を確かめます。',
        );
        expect(host.querySelector('a[href="/projects"]')?.textContent).toContain('作品を見る');
        expect(host.querySelector('a[href="/"]')?.textContent).toContain('トップ');
        expect(host.textContent).not.toMatch(/旧章番号|(?:^|\s)0[1-9]\s*[/／]|dots|エイダ|パールマン|\bADA\b/i);
        headings.forEach((name, index) => {
            const section = sectionNamed(name);
            const detail = detailOf(name);
            expect([...section.querySelectorAll('p')].filter(p => !detail.contains(p)).map(p => p.textContent))
                .toContain(shortCopy[index]);
            expect(detail.querySelector('p')?.textContent?.trim()).toBeTruthy();
            expect(detail.textContent).not.toContain(shortCopy[index]);
        });
    });

    it('各詳細を初期閉鎖し、複数を個別に開閉できる', () => {
        render();
        const details = headings.map(detailOf);
        expect(details.every(detail => !detail.open)).toBe(true);
        const names = details.map(detail => {
            const summary = summaryOf(detail);
            expect(summary.textContent).toContain('詳しく見る');
            return summary.getAttribute('aria-label') ?? summary.textContent?.trim();
        });
        expect(new Set(names).size).toBe(5);

        const [first, second] = details;
        act(() => summaryOf(first).click());
        act(() => summaryOf(second).click());
        expect(first.open).toBe(true);
        expect(second.open).toBe(true);
        expect(summaryOf(first).textContent).toContain('詳細を閉じる');

        act(() => summaryOf(first).click());
        expect(first.open).toBe(false);
        expect(summaryOf(first).textContent).toContain('詳しく見る');
        expect(second.open).toBe(true);
        expect(scrolledTo).toEqual([]);
    });

    it('独立した題材の6種の画像を冒頭と各節に載せる', () => {
        render();
        const art = [
            [host.querySelector('#hero'), 'hero-open-book'],
            [sectionNamed(headings[0]), 'architecture-layers'],
            [sectionNamed(headings[1]), 'change-module'],
            [sectionNamed(headings[2]), 'understanding-notes'],
            [sectionNamed(headings[3]), 'development-quality'],
            [sectionNamed(headings[4]), 'human-ai-handoff'],
        ] as const;
        for (const [parent, filename] of art) {
            const img = parent?.querySelector('img[src^="/images/design-philosophy/' + filename + '"]');
            expect(img, filename).not.toBeNull();
            expect(img?.hasAttribute('alt'), filename).toBe(true);
        }
    });
});

describe('実装事例と技術説明', () => {
    const examples = [
        { name: headings[1], text: /API Catalog.*(?:応答|画面移動)/s },
        { name: headings[2], text: /開発環境の導入手順.*(?:自動検査|内容レビュー)/s },
        { name: headings[2], text: /DanceShortsAnalyzer.*欠測.*(?:照合|比較区間)/s },
        { name: headings[3], text: /DanceShortsRadar.*(?:補足情報|符号).*(?:再検証|再確認)/s },
    ];

    it.each(examples)('$name の詳細だけに既存事例を1回配置する', ({ name, text }) => {
        render();
        const paragraphs = [...host.querySelectorAll('p')].filter(p => text.test(p.textContent ?? ''));
        expect(paragraphs).toHaveLength(1);
        expect(detailOf(name).contains(paragraphs[0])).toBe(true);
    });

    it('アーキテクチャの詳細で責務と実際のHTTP処理を区別する', () => {
        render();
        const text = detailOf(headings[0]).textContent;
        for (const label of ['Action', 'Domain', 'Responder', 'Controller', 'Repository', 'DTO', 'React', 'LinksLauncher']) {
            expect(text).toContain(label);
        }
        expect(detailOf(headings[0]).querySelectorAll('figure').length).toBeGreaterThanOrEqual(2);
    });

    it('開発段階、TDDと改善工程を別の図として保つ', () => {
        render();
        const figures = [...detailOf(headings[3]).querySelectorAll('figure')].map(figure => figure.textContent ?? '');
        const stages = figures.findIndex(text => ['IDEA BOARD', 'MOCK', 'PROTOTYPE', 'PRODUCT'].every(label => text.includes(label)));
        const tdd = figures.findIndex(text => ['Red', 'Green', 'Refactor'].every(label => text.includes(label)));
        const improvement = figures.findIndex(text => ['指摘', '原因特定', '修正', '再確認'].every(label => text.includes(label)));
        expect([stages, tdd, improvement]).not.toContain(-1);
        expect(new Set([stages, tdd, improvement]).size).toBe(3);
    });

    it('AIの担当と工程を分け、ノートラストの4要素を公開する', () => {
        render();
        const detail = detailOf(headings[4]);
        const figures = [...detail.querySelectorAll('figure')].map(figure => figure.textContent ?? '');
        const roles = figures.findIndex(text => ['進行管理', '技術相談', '検証担当', 'レビュー担当'].every(label => text.includes(label)));
        const process = figures.findIndex(text => ['作業条件', '調査', '実装', '検証', 'レビュー', '最終判断'].every(label => text.includes(label)));
        expect([roles, process]).not.toContain(-1);
        expect(roles).not.toBe(process);
        for (const label of ['主張', '証拠', '操作の許可', '完成判断']) expect(detail.textContent).toContain(label);
        expect(host.textContent).not.toMatch(/resolved model|reasoning effort|effective sandbox|permission profile|session ID/i);
    });
});

describe('表示設定と旧リンク', () => {
    it.each(legacyKeys.filter(key => key !== 'hero'))('旧詳細 #%s への直接アクセスで該当内容が開く', key => {
        window.history.replaceState(null, '', '#' + key);
        render();
        expectHashDestination(key);
    });

    it('旧 #hero へ到達しても詳細を開かない', () => {
        window.history.replaceState(null, '', '#hero');
        render();
        expect(host.querySelector('#hero')?.contains(scrolledTo[0])).toBe(true);
        expect(host.querySelector('details[open]')).toBeNull();
    });

    it.each(legacyGroups)('旧群 #%s は主対象 #%s の詳細へ到達する', (alias, primary) => {
        window.history.replaceState(null, '', '#' + alias);
        render();
        expectHashDestination(primary);
        expect(host.querySelectorAll('[id="' + alias + '"]')).toHaveLength(1);
        expectValidFragmentLinks();
    });

    it('ページ内で旧詳細と旧群へ移動すると対応する詳細が即時に開く', () => {
        render();
        hashChange('improvement-loop');
        expectHashDestination('improvement-loop');
        hashChange('roles');
        expectHashDestination('human-ai-roles');
        expect(detailOf(headings[3]).open).toBe(true);
        expect(detailOf(headings[4]).open).toBe(true);
    });

    it('旧群は主対象が無効なら旧群内の有効章へ移動し、設定順を使う', () => {
        const ordered = ['improvement-loop', 'closing', 'ai-development-flow', 'principles'] as const;
        const visible = ordered.map((key, sortOrder) => ({
            ...sections.find(section => section.key === key)!,
            sortOrder,
        }));
        render(visible);
        expect(shownHeadings()).toEqual([headings[3], headings[4]]);

        hashChange('checks');
        expectHashDestination('improvement-loop');
        expect(detailOf(headings[3]).open).toBe(true);
        expect(detailOf(headings[4]).open).toBe(false);

        hashChange('roles');
        expectHashDestination('ai-development-flow');
        expect(host.querySelector('#structure, #stages, #development-stages, #quality-gates')).toBeNull();
        expectValidFragmentLinks();
    });

    it('各節の表示順を固定し、節の中では有効な旧章の並び順を維持する', () => {
        const ordered = ['closing', 'improvement-loop', 'development-stages', 'human-ai-roles', 'architecture', 'principles'] as const;
        const visible = ordered.map((key, sortOrder) => ({
            ...sections.find(section => section.key === key)!,
            sortOrder,
        }));
        render(visible);
        expect(shownHeadings()).toEqual(headings);

        const expectOrder = (name: typeof headings[number], chapterKeys: readonly string[]) => {
            const matching = [...detailOf(name).querySelectorAll('[id]')]
                .map(element => element.id)
                .filter(id => chapterKeys.includes(id));
            expect(matching).toEqual(chapterKeys);
        };
        expectOrder(headings[3], ['improvement-loop', 'development-stages']);
        expectOrder(headings[4], ['closing', 'human-ai-roles', 'principles']);
    });

    it.each(['human-ai-roles', 'architecture', 'quality-gates', 'development-stages'] as const)(
        '%s が無効でも他の有効章の内容・アンカーを保つ',
        disabled => {
            const enabled = sections.filter(section => section.key !== disabled);
            render(enabled);
            for (const section of enabled) expect(host.querySelector('[id="' + section.key + '"]')).not.toBeNull();
            expect(host.querySelector('[id="' + disabled + '"]')).toBeNull();
            expect(shownHeadings()).toEqual(disabled === 'architecture' ? headings.slice(3) : headings);
            expectValidFragmentLinks();
        },
    );

    it('architecture が無効なら共有3節と該当事例を表示しない', () => {
        render(sections.filter(section => section.key !== 'architecture'));
        expect(shownHeadings()).toEqual(headings.slice(3));
        for (const name of ['API Catalog', 'DanceShortsAnalyzer', '開発環境の導入手順']) {
            expect(host.textContent).not.toContain(name);
        }
        expect(host.textContent).toContain('DanceShortsRadar');
    });

    it('結びのみならAI節と対応リンクだけを表示し、未知のhashを無視する', () => {
        render(sections.filter(section => section.key === 'closing'));
        expect(shownHeadings()).toEqual([headings[4]]);
        expect(host.querySelector('#hero, #roles, #structure, #stages')).toBeNull();
        for (const id of ['unknown-chapter', 'architecture', 'roles', '%']) hashChange(id);
        expect(host.querySelector('details[open]')).toBeNull();
        expect(scrolledTo).toHaveLength(0);
        hashChange('checks');
        expectHashDestination('closing');
        expectValidFragmentLinks();
    });

    it('すべて無効なら旧章・旧群・節へのリンクを表示しない', () => {
        render([]);
        expect(shownHeadings()).toEqual([]);
        expect(host.querySelector('#hero, details, a[href^="#"]')).toBeNull();
        for (const [alias] of legacyGroups) expect(host.querySelector('#' + alias)).toBeNull();
    });
});

describe('モーション停止と詳細操作の回帰', () => {
    it('Observer を利用できなくても本文と操作を利用できる', () => {
        setReducedMotion(false);
        Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: undefined });
        render();
        expectHero();
        const detail = detailOf(headings[0]);
        act(() => summaryOf(detail).click());
        expect(detail.open).toBe(true);
        expect(detail.textContent).toContain('LinksLauncher');
    });

    it.each(['constructor', 'observe'] as const)('Observer の %s が失敗しても内容を表示する', phase => {
        setReducedMotion(false);
        Object.defineProperty(window, 'IntersectionObserver', {
            configurable: true,
            value: class {
                constructor() { if (phase === 'constructor') throw new Error(phase); }
                observe() { throw new Error(phase); }
                disconnect() {}
            },
        });
        expect(render).not.toThrow();
        expectHero();
        expect(host.querySelectorAll('summary')).toHaveLength(5);
    });

    it('いったん現れた内容を逆スクロールしても隠さない', () => {
        let callback: IntersectionObserverCallback | undefined;
        const unobserve = vi.fn();
        const disconnect = vi.fn();
        setReducedMotion(false);
        Object.defineProperty(window, 'IntersectionObserver', {
            configurable: true,
            value: class {
                constructor(cb: IntersectionObserverCallback) { callback = cb; }
                observe() {}
                unobserve = unobserve;
                disconnect = disconnect;
            },
        });
        render();
        const target = host.querySelector('[data-scroll-reveal]')!;
        expect(target).not.toBeNull();
        act(() => callback?.([{ target, isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
        expect(target.hasAttribute('data-scroll-seen')).toBe(true);
        act(() => callback?.([{ target, isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));
        expect(target.hasAttribute('data-scroll-seen')).toBe(true);
        expect(unobserve).toHaveBeenCalledWith(target);
    });

    it('冒頭だけが有効でも動きを停止して再生できる', () => {
        setReducedMotion(false);
        render(sections.filter(section => section.key === 'hero'));

        expectHero();
        expect(shownHeadings()).toEqual([]);
        expect(host.querySelector('nav, details, a[href^="#"]')).toBeNull();
        const article = host.querySelector('article');
        expect(article?.hasAttribute('data-motion-off')).toBe(false);
        const toggle = host.querySelector<HTMLButtonElement>('[data-motion-toggle]');
        expect(toggle).not.toBeNull();
        expect(toggle?.textContent).toContain('動きを止める');
        expect(toggle?.getAttribute('aria-pressed')).toBe('false');

        act(() => toggle?.click());
        expect(article?.hasAttribute('data-motion-off')).toBe(true);
        expect(toggle?.textContent).toContain('動きを再生');
        expect(toggle?.getAttribute('aria-pressed')).toBe('true');

        act(() => toggle?.click());
        expect(article?.hasAttribute('data-motion-off')).toBe(false);
        expect(toggle?.textContent).toContain('動きを止める');
        expect(toggle?.getAttribute('aria-pressed')).toBe('false');
    });

    it('動きを停止して再生しても全文と開閉操作を維持する', () => {
        render();
        const toggle = host.querySelector<HTMLButtonElement>('[data-motion-toggle]')!;
        expect(toggle).not.toBeNull();
        act(() => toggle.click());
        expect(toggle.getAttribute('aria-pressed')).toBe('true');
        expectHero();
        expect(host.querySelectorAll('summary')).toHaveLength(5);
        act(() => toggle.click());
        expect(toggle.getAttribute('aria-pressed')).toBe('false');
    });

    function animatedDetail() {
        setReducedMotion(false);
        render();
        const details = detailOf(headings[0]);
        const frames: { cancel: ReturnType<typeof vi.fn>; onfinish: null | (() => void) }[] = [];
        Object.defineProperty(details, 'animate', {
            value: vi.fn(() => {
                const frame = { cancel: vi.fn(), onfinish: null as null | (() => void) };
                frames.push(frame);
                return frame as unknown as Animation;
            }),
        });
        return { details, summary: summaryOf(details), frames };
    }

    it('連打は最後の操作へ追従し、閉じた内容にフォーカスを残さない', () => {
        const { details, summary, frames } = animatedDetail();
        act(() => summary.click());
        act(() => summary.click());
        act(() => summary.click());
        expect(frames[0].cancel).toHaveBeenCalled();
        expect(frames[1].cancel).toHaveBeenCalled();
        act(() => frames[1].onfinish?.());
        expect(details.open).toBe(true);
        act(() => frames[2].onfinish?.());

        const inside = document.createElement('button');
        inside.textContent = '詳細内のフォーカス対象';
        details.append(inside);
        act(() => summary.click());
        inside.focus();
        expect(document.activeElement).toBe(inside);
        act(() => frames[3].onfinish?.());
        expect(details.open).toBe(false);
        expect(document.activeElement).toBe(summary);
    });

    it('演出中の停止と旧hash到達は演出終了を待たない', () => {
        const { details, summary, frames } = animatedDetail();
        act(() => summary.click());
        act(() => summary.click());
        act(() => host.querySelector<HTMLButtonElement>('[data-motion-toggle]')!.click());
        expect(details.open).toBe(false);
        expect(frames[1].cancel).toHaveBeenCalled();

        hashChange('architecture');
        expectHashDestination('architecture');
        act(() => frames[1].onfinish?.());
        expect(details.open).toBe(true);
    });

    it('OSで動きを減らす場合は描画APIを呼ばずに開閉する', () => {
        render();
        const detail = detailOf(headings[0]);
        const animate = vi.fn();
        Object.defineProperty(detail, 'animate', { value: animate });
        const summary = summaryOf(detail);
        act(() => summary.click());
        expect(detail.open).toBe(true);
        act(() => summary.click());
        expect(detail.open).toBe(false);
        expect(animate).not.toHaveBeenCalled();
    });
});
