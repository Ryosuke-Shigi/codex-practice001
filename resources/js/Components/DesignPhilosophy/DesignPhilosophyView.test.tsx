// @vitest-environment jsdom
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DesignPhilosophyView from './DesignPhilosophyView';
import type { DesignPhilosophySection } from './designPhilosophyTypes';

vi.mock('@inertiajs/react', () => ({ Link: ({ children, href }: {children: ReactNode; href: string}) => <a href={href}>{children}</a> }));
const keys = ['hero', 'principles', 'human-ai-roles', 'ai-development-flow', 'architecture', 'development-stages', 'quality-gates', 'improvement-loop', 'closing'] as const;
const sections: DesignPhilosophySection[] = keys.map((key, index) => ({ key, sortOrder: index, eyebrow: key, title: `${key}の見出し`, lead: `${key}の要約`, body: `${key}の説明` }));
let host: HTMLDivElement;
let root: Root;
const originalObserver = window.IntersectionObserver;
const originalMatchMedia = window.matchMedia;
beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
    window.history.replaceState(null, '', '/design-philosophy');
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: true }) });
});
afterEach(() => {
    act(() => root.unmount()); host.remove();
    Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: originalObserver });
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia });
});
function render() { act(() => root.render(<DesignPhilosophyView sections={sections} />)); }

describe('設計思想の読み順と操作', () => {
    it('冒頭と4節を表示し、技術情報は各詳細に残す', () => {
        render();
        expect(host.querySelectorAll('.dp-overview-section')).toHaveLength(4);
        expect(host.querySelectorAll('h1')).toHaveLength(1);
        expect(host.querySelectorAll('details')).toHaveLength(4);
        expect([...host.querySelectorAll('details')].every(detail => !detail.open)).toBe(true);
        expect([...host.querySelectorAll('summary')].every(summary => summary.textContent?.includes('詳しく見る'))).toBe(true);
        expect(host.textContent).not.toMatch(/dots|エイダ|パールマン|\bADA\b/i);
        for (const key of keys) expect(host.querySelector(`[id="${key}"]`)).not.toBeNull();
        expect(host.querySelectorAll('[data-flow-step]')).toHaveLength(8);
        expect(host.querySelectorAll('[data-evidence-type]')).toHaveLength(6);
        expect(host.textContent).toContain('Action - Domain - Responder');
        expect(host.querySelector('a[href="/projects"]')?.textContent).toContain('作品を見る');
    });
    it.each(keys.filter(key => key !== 'hero'))('旧章 #%s を直接開くと内容の詳細が開く', (key) => {
        window.history.replaceState(null, '', `#${key}`); render();
        const target = host.querySelector<HTMLElement>(`[id="${key}"]`);
        const details = target?.closest('details');
        expect(target).not.toBeNull(); expect(details?.open).toBe(true);
    });
    it('ページ内で旧章へ移動しても詳細が開く', () => {
        render();
        act(() => { window.location.hash = 'improvement-loop'; window.dispatchEvent(new Event('hashchange')); });
        expect(host.querySelector('#improvement-loop')?.closest('details')?.open).toBe(true);
    });
    it('領域ボタンで対応する層と説明を選択できる', () => {
        render();
        const buttons = [...host.querySelectorAll<HTMLButtonElement>('[data-structure-choice]')];
        expect(buttons).toHaveLength(3);
        act(() => buttons[2].click());
        expect(buttons[2].getAttribute('aria-pressed')).toBe('true');
        expect(host.querySelector('[data-structure-description]')?.textContent).toContain('Repository');
        expect(host.querySelector('[data-structure-highlight="data"]')).not.toBeNull();
    });
    it('モーション軽減とobserver不在でも本文と操作を利用できる', () => {
        Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: undefined });
        render();
        expect(host.querySelector('h1')?.textContent).toBe('heroの見出し');
        expect(host.querySelectorAll('.dp-overview-diagram')).toHaveLength(4);
        const summary = host.querySelector('summary');
        act(() => summary?.click());
        expect(summary?.parentElement?.hasAttribute('open')).toBe(true);
    });
    it('observerは表示を一度だけ強調し、逆スクロールで隠さない', () => {
        let callback: IntersectionObserverCallback | undefined;
        const unobserve = vi.fn(); const disconnect = vi.fn();
        Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: false }) });
        Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: class { constructor(cb: IntersectionObserverCallback) { callback = cb; } observe() {} unobserve = unobserve; disconnect = disconnect; } });
        render();
        const target = host.querySelector('[data-scroll-reveal]')!;
        act(() => callback?.([{ target, isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
        expect(target.hasAttribute('data-scroll-seen')).toBe(true);
        act(() => callback?.([{ target, isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));
        expect(target.hasAttribute('data-scroll-seen')).toBe(true);
        expect(unobserve).toHaveBeenCalledWith(target);
    });
});
describe('引き継いだ技術情報と演出の回帰', () => {
    it('詳細図のノード・方向・戻り経路を保持する', () => {
        render();
        for (const [name, nodes, edges] of [['decision-circuit', 4, 3], ['responsibility-lanes', 5, 7], ['evidence-flow', 8, 7], ['adr-dependency', 8, 8], ['stage-gates', 4, 3], ['evidence-instruments', 6, 6], ['feedback-loop', 8, 8]] as const) {
            const figure = host.querySelector(`[data-diagram="${name}"]`);
            expect(figure?.querySelectorAll('[data-diagram-node]')).toHaveLength(nodes);
            expect(figure?.querySelectorAll('[data-diagram-edge]').length).toBeGreaterThanOrEqual(edges);
            expect(figure?.querySelector('figcaption')?.textContent?.trim()).not.toBe('');
        }
        const edgeSet = (name: string) => new Set([...host.querySelectorAll(`[data-diagram="${name}"] [data-edge-from][data-edge-to]`)].map(edge => `${edge.getAttribute('data-edge-from')}->${edge.getAttribute('data-edge-to')}:${edge.getAttribute('data-edge-kind')}`));
        expect(edgeSet('adr-dependency')).toEqual(new Set(['入口->use case:main', 'use case->domain / rule:main', 'domain / rule->presentation:main', 'domain / rule->I/O:branch', 'domain / rule->data contract:branch', 'domain / rule->side effect:branch', 'use case->read side:query', 'read side->presentation:query']));
        expect(edgeSet('feedback-loop')).toEqual(new Set(['1->2:forward', '2->3:forward', '3->4:forward', '4->5:forward', '5->6:forward', '6->7:forward', '7->8:forward', '8->1:return']));
    });
    it('HTTP入口・表示・業務判断・データ境界を別々に示す', () => {
        render();
        const text = (category: string) => host.querySelector(`#architecture [data-responsibility-category="${category}"]`)?.textContent;
        expect(text('entry')).toContain('Route / Controller / Request');
        expect(text('entry')).not.toContain('Page / Feature Component');
        expect(text('presentation')).toContain('Responder / Page / Feature Component');
        expect(text('domain')).toContain('Service / Strategy');
        expect(text('infrastructure')).toContain('Repository');
        expect(text('contract')).toContain('DTO / ListDTO');
        expect(text('side-effect')).toContain('Event / Listener / Job');
    });
    it('各段階の入力・対象外・出力・移行条件を詳細に残す', () => {
        render();
        const stages = [...host.querySelectorAll('#development-stages .dp-stage-card')];
        expect(stages).toHaveLength(4);
        for (const stage of stages) for (const label of ['入力', 'まだ作らない', '次へ渡す', '移行・受入条件']) expect(stage.textContent).toContain(label);
        expect(stages[2].textContent).toContain('人が本実装の仕様・責務・検証条件を固定');
    });
    it('内部環境情報を公開せず実測と期待を区別する', () => {
        render();
        expect(host.querySelector('#quality-gates')?.textContent).toContain('設定値やInstalledの確認から推測しない');
        for (const text of ['resolved model', 'reasoning effort', 'effective sandbox', 'permission profile', 'session ID']) expect(host.textContent).not.toContain(text);
    });
    it('observerの構築・登録が失敗しても本文と詳細操作を残す', () => {
        Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: false }) });
        for (const phase of ['constructor', 'observe']) {
            Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: class { constructor() { if (phase === 'constructor') throw new Error(phase); } observe() { throw new Error(phase); } disconnect() {} } });
            expect(render).not.toThrow();
            expect(host.querySelector('h1')?.textContent).toBe('heroの見出し');
            expect(host.querySelectorAll('summary')).toHaveLength(4);
            act(() => root.unmount()); root = createRoot(host);
        }
    });
});
describe('採用案の構造と動き', () => {
    it('構造図は7項目と11接続を持ち、選択に関係する線だけを強調する', () => {
        render();
        expect(host.querySelectorAll('[data-harness-node]')).toHaveLength(7);
        expect(host.querySelectorAll('[data-harness-edge]')).toHaveLength(11);
        const review = host.querySelector<HTMLButtonElement>('[data-harness-node="review"]')!;
        act(() => review.click());
        expect(review.getAttribute('aria-pressed')).toBe('true');
        expect(host.querySelectorAll('[data-harness-edge][data-related="true"]')).toHaveLength(3);
        expect(host.querySelector('[data-harness-connections]')?.textContent).toContain('指摘・未確認事項');
        expect(host.querySelector('[data-harness-edge="review-writer"]')).toBeNull();
    });
    it('原則の詳細を03へ集め、4要素を工程矢印なしで選択する', () => {
        render();
        expect(host.querySelector('#principles')?.closest('.dp-overview-section')?.id).toBe('checks');
        expect(host.querySelectorAll('#roles [data-contract-group]')).toHaveLength(9);
        expect(host.querySelectorAll('#checks [data-contract-group]')).toHaveLength(0);
        expect(host.querySelector('#closing')?.closest('.dp-overview-section')?.id).toBe('checks');
        const choices = host.querySelectorAll<HTMLButtonElement>('[data-principle-choice]');
        expect(choices).toHaveLength(4);
        act(() => choices[2].click());
        expect(choices[2].getAttribute('aria-pressed')).toBe('true');
        expect(host.querySelector('[data-principle-description]')?.textContent).toContain('操作');
    });
    it('文字は全文を保持し、動きを止めても内容と操作が残る', () => {
        render();
        expect(host.querySelectorAll('[data-ink-text]').length).toBeGreaterThan(4);
        const toggle = host.querySelector<HTMLButtonElement>('[data-motion-toggle]')!;
        act(() => toggle.click());
        expect(host.querySelector('.dp-page')?.hasAttribute('data-motion-off')).toBe(true);
        expect(host.querySelector('h1')?.textContent).toBe('heroの見出し');
        expect(host.querySelectorAll('summary')).toHaveLength(4);
        act(() => toggle.click());
        expect(host.querySelector('.dp-page')?.hasAttribute('data-motion-off')).toBe(false);
    });
    it('コーディング詳細で手順・パターン・説明の一致を示す', () => {
        render();
        const detail = host.querySelector('#architecture');
        for (const copy of ['手順とルールを分ける', '必要な構造だけ使う', '説明と実装を一致させる', 'PHPDoc', 'interface']) expect(detail?.textContent).toContain(copy);
    });
});
describe('詳細演出の中断とフォーカス', () => {
    function animatedDetail() {
        Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: false }) });
        render();
        const details = host.querySelector<HTMLDetailsElement>('details')!;
        const frames: { cancel: ReturnType<typeof vi.fn>; onfinish: null | (() => void) }[] = [];
        Object.defineProperty(details, 'animate', { value: vi.fn(() => {
            const frame = { cancel: vi.fn(), onfinish: null as null | (() => void) };
            frames.push(frame); return frame as unknown as Animation;
        }) });
        return { details, summary: details.querySelector('summary')!, frames };
    }
    it('開閉連打は前の演出を中断し、閉じた内容にフォーカスを残さない', () => {
        const { details, summary, frames } = animatedDetail();
        act(() => summary.click());
        act(() => summary.click());
        act(() => summary.click());
        expect(frames[0].cancel).toHaveBeenCalled();
        expect(frames[1].cancel).toHaveBeenCalled();
        act(() => frames[1].onfinish?.());
        expect(details.open).toBe(true);
        act(() => frames[2].onfinish?.());
        act(() => summary.click());
        const inside = details.querySelector<HTMLButtonElement>('.dp-replay-button')!;
        inside.focus();
        act(() => frames[3].onfinish?.());
        expect(details.open).toBe(false);
        expect(document.activeElement).toBe(summary);
    });
    it('演出中の停止と旧hash到達は終了を待たずに反映する', () => {
        const { details, summary, frames } = animatedDetail();
        act(() => summary.click());
        act(() => summary.click());
        act(() => host.querySelector<HTMLButtonElement>('[data-motion-toggle]')!.click());
        expect(details.open).toBe(false);
        expect(frames[1].cancel).toHaveBeenCalled();
        act(() => { window.location.hash = 'ai-development-flow'; window.dispatchEvent(new Event('hashchange')); });
        expect(details.open).toBe(true);
        act(() => frames[1].onfinish?.());
        expect(details.open).toBe(true);
    });
});
it('モーション軽減時は開閉の描画APIを呼ばず即時に結果を表示する', () => {
    render();
    const detail = host.querySelector<HTMLDetailsElement>('details')!;
    const animate = vi.fn();
    Object.defineProperty(detail, 'animate', { value: animate });
    const summary = detail.querySelector('summary')!;
    act(() => summary.click());
    expect(detail.open).toBe(true);
    act(() => summary.click());
    expect(detail.open).toBe(false);
    expect(animate).not.toHaveBeenCalled();
});
describe('表示設定の除外と詳細リンク', () => {
    it.each(['human-ai-roles', 'architecture', 'quality-gates', 'development-stages'] as const)('%sを無効にしても他の有効な章を隠さない', (disabled) => {
        const enabled = sections.filter(section => section.key !== disabled);
        act(() => root.render(<DesignPhilosophyView sections={enabled} />));
        for (const section of enabled) expect(host.querySelector(`[id="${section.key}"]`)).not.toBeNull();
        expect(host.querySelector(`[id="${disabled}"]`)).toBeNull();
        for (const anchor of host.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
            expect(host.querySelector(`[id="${anchor.hash.slice(1)}"]`)).not.toBeNull();
        }
    });
    it('結びだけが有効な場合も存在しない章へのリンクを出さない', () => {
        act(() => root.render(<DesignPhilosophyView sections={sections.filter(section => section.key === 'closing')} />));
        expect(host.querySelector('#closing')).not.toBeNull();
        expect(host.querySelector('a[href="#architecture"]')).toBeNull();
        expect(host.querySelector('a[href="#improvement-loop"]')).toBeNull();
    });
});