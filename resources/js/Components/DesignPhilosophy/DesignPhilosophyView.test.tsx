// @vitest-environment jsdom

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import DesignPhilosophyView from '@/Components/DesignPhilosophy/DesignPhilosophyView';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

const sections: DesignPhilosophySection[] = [
    ['hero', 'ポートフォリオ／設計思想', '責務でつなぐ AI駆動開発'],
    ['principles', '01 / PRINCIPLES', '速さを、腐敗の理由にしない。'],
    ['architecture', '02 / ARCHITECTURE', 'コードの責務を、変更理由で分ける。'],
    ['development-stages', '03 / DEVELOPMENT STAGES', '検討・確認・本実装を、同じコードで済ませない。'],
    ['human-ai-flow', '04 / HUMAN + AI', 'コードだけでなく、AIにも責務を分ける。'],
    ['subagents', '05 / 18 SUBAGENTS', '必要な役だけを選ぶ。'],
    ['engineering-loop', '06 / LOOP ENGINEERING', '一度で正解にせず、ズレを検出して戻す。'],
    ['understanding-reboot', '07 / UNDERSTANDING REBOOT', '会話が消えても、開発を再開できる。'],
    ['closing', 'DESIGN PHILOSOPHY', 'レイヤードアーキテクチャによるコードの責務分離と、SubagentによるAIの責務分離を、同じ原則で設計する。'],
].map(([key, eyebrow, title], index) => ({
    key,
    sortOrder: (index + 1) * 10,
    eyebrow,
    title,
    lead: `${title}の説明`,
    body: `${title}の本文`,
})) as DesignPhilosophySection[];

const expectedSubagentNames = [
    'luna_explorer',
    'specification_reviewer',
    'architecture_specialist',
    'design_specialist',
    'environment_specialist',
    'terra_implementer',
    'frontend_specialist',
    'backend_specialist',
    'database_specialist',
    'test_specialist',
    'context_recovery',
    'operations_specialist',
    'information_source_curator',
    'terra_docs_maintainer',
    'sol_specialist',
    'terra_verifier',
    'browser_verifier',
    'sol_reviewer',
];

let container: HTMLDivElement;
let root: Root;

function render(ui: ReactNode) {
    act(() => root.render(ui));
}

function clickButton(label: string) {
    const button = Array.from(container.querySelectorAll('button')).find(
        (item) => item.textContent?.includes(label),
    );

    expect(button).toBeDefined();
    act(() => button?.click());

    return button;
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
    });

    it('中心思想と9章の表示契約を描画する', () => {
        render(<DesignPhilosophyView sections={sections} />);

        expect(container.querySelectorAll('h1')).toHaveLength(1);
        expect(container.querySelector('h1')?.textContent).toContain(
            '責務でつなぐ AI駆動開発',
        );
        expect(container.textContent).toContain('人間が目的と境界を設計する');
        expect(container.textContent).toContain('Action - Domain - Responder');
        expect(container.textContent).toContain('PROTOTYPE');
        expect(container.textContent).toContain('任意工程');
        expect(container.textContent).toContain('会話が消えても、開発を再開できる。');
        expect(
            container.querySelectorAll('[data-subagent-card]:not([hidden])'),
        ).toHaveLength(18);
        expectedSubagentNames.forEach((name) => {
            expect(container.textContent).toContain(name);
        });
        expect(container.textContent).toContain('read-onlyのOperations Security監査');
        expect(container.textContent).toContain('architecture監査後の複雑・高リスク・複数レイヤー実装');
    });

    it('Subagentを表示状態だけで分類絞り込みできる', () => {
        render(<DesignPhilosophyView sections={sections} />);

        const discoverButton = clickButton('探索・設計');
        expect(discoverButton?.getAttribute('aria-pressed')).toBe('true');
        expect(
            container.querySelectorAll('[data-subagent-card]:not([hidden])'),
        ).toHaveLength(5);
        expect(container.textContent).toContain('5件を表示中');

        clickButton('実装');
        expect(
            container.querySelectorAll('[data-subagent-card]:not([hidden])'),
        ).toHaveLength(10);

        clickButton('検証・レビュー');
        expect(
            container.querySelectorAll('[data-subagent-card]:not([hidden])'),
        ).toHaveLength(3);

        clickButton('すべて');
        expect(
            container.querySelectorAll('[data-subagent-card]:not([hidden])'),
        ).toHaveLength(18);
    });
});
