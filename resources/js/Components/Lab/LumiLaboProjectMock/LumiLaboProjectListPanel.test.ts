import { describe, expect, it } from 'vitest';

import {
    LUMILABO_PROJECT_LIST_PARTIAL_PROPS,
    resolveLumiLaboMockViewport,
} from './LumiLaboProjectListPanel';

describe('LumiLaboProjectListPanel viewport and partial reload contract', () => {
    it('uses the approved mobile, tablet, desktop, and landscape boundaries', () => {
        expect(resolveLumiLaboMockViewport(767, 900)).toBe('mobile');
        expect(resolveLumiLaboMockViewport(768, 480)).toBe('mobile');
        expect(resolveLumiLaboMockViewport(768, 481)).toBe('tablet');
        expect(resolveLumiLaboMockViewport(1279, 900)).toBe('tablet');
        expect(resolveLumiLaboMockViewport(1280, 481)).toBe('desktop');
    });

    it('reloads only the server-owned project list props', () => {
        expect(LUMILABO_PROJECT_LIST_PARTIAL_PROPS).toEqual(['projectList']);
    });
});
