// @ts-expect-error Vitest runs in Node while the application tsconfig intentionally omits Node ambient types.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const projectHubCss = readFileSync(
    'resources/js/Components/ProjectHub/projectHub.css',
    'utf8',
);

function mobileLandscapeMessageParagraphRule(): string {
    const landscapeStart = projectHubCss.indexOf(
        '@media (orientation: landscape) and (max-height: 540px)',
    );
    const reducedMotionStart = projectHubCss.indexOf(
        '@media (prefers-reduced-motion: reduce)',
        landscapeStart,
    );
    const landscapeRules = projectHubCss.slice(
        landscapeStart,
        reducedMotionStart,
    );
    const paragraphRule = landscapeRules.match(
        /\.project-select-message p\s*\{(?<declarations>[^}]*)\}/,
    );

    if (paragraphRule?.groups?.declarations === undefined) {
        throw new Error(
            'mobile landscapeのProject説明文ruleが見つかりません。',
        );
    }

    return paragraphRule.groups.declarations;
}

describe('ProjectSelectView message layout', () => {
    it('mobile landscapeでも安定後のProject説明全文を隠さない', () => {
        const paragraphRule = mobileLandscapeMessageParagraphRule();

        expect(paragraphRule).not.toContain('overflow: hidden');
        expect(paragraphRule).not.toContain('-webkit-line-clamp');
    });
});
