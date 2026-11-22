// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
const chart = vi.hoisted(() => ({setOption: vi.fn(), on: vi.fn(), resize: vi.fn(), dispose: vi.fn()}));
vi.mock('echarts', () => ({init: vi.fn(() => chart)}));
import EChartsViewer from './EChartsViewer';
Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
describe('EChartsViewer event boundary', () => {
    it('keeps existing consumers optional and disposes event subscriptions on unmount', async () => {
        const host = document.createElement('div'); document.body.append(host);
        const root = createRoot(host);
        const callback = vi.fn();
        await act(async () => root.render(<EChartsViewer option={{}} onEvents={{updateAxisPointer: callback}} />));
        expect(chart.on).toHaveBeenCalledWith('updateAxisPointer', callback);
        const payload = {axesInfo: []};
        chart.on.mock.calls[0][1](payload);
        expect(callback).toHaveBeenCalledWith(payload);
        await act(async () => root.unmount());
        expect(chart.dispose).toHaveBeenCalledTimes(1);
        chart.on.mockClear();
        const second = createRoot(host);
        await act(async () => second.render(<EChartsViewer option={{}} />));
        expect(chart.on).not.toHaveBeenCalled();
        await act(async () => second.unmount()); host.remove();
    });
});
