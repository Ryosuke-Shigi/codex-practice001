// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
const viewer = vi.hoisted(() => ({events: {} as Record<string, (event: unknown) => void>}));
vi.mock('@/Components/Common/Visualizations/Charts/EChartsViewer', () => ({default: ({onEvents}: {onEvents: Record<string, (event: unknown) => void>}) => {viewer.events = onEvents; return <div />;}}));
import AnalyzeChartField from '@/Pages/DanceShortsAnalyzer/Fields/AnalyzeChartField';
Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
it('updates time and value from the actual ECharts category-axis event and the time selector', async () => {
    const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
    const video = {video_id: 4, title: '動画の全文', comparison_number: 2, chart_color: '#22c55e'};
    const observations = [{collected_at_label:'2026-06-01 00:00', videos:[{...video, value_label:'0 回'}]}, {collected_at_label:'2026-06-01 11:00', videos:[{...video, value_label:'3,362 回'}]}];
    await act(async () => root.render(<AnalyzeChartField activeMetric="view_count" charts={{view_count:{title:'View推移', option:{}, observations}}} />));
    expect(host.textContent).toContain('0 回');
    await act(async () => viewer.events.updateAxisPointer({axesInfo:[{axisDim:'y',axisIndex:0,value:200},{axisDim:'x',axisIndex:0,value:1}]}));
    expect(host.textContent).toContain('3,362 回');
    expect(host.querySelector('select')!.value).toBe('1');
    await act(async () => {host.querySelector('select')!.value = '0'; host.querySelector('select')!.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(host.textContent).toContain('0 回');
    await act(async () => root.unmount()); host.remove();
});
