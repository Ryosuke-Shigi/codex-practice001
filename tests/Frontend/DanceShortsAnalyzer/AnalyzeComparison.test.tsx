// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('@/Components/Common/Visualizations/Charts/EChartsViewer', () => ({default: () => <div />}));
import AnalyzeChartField from '@/Pages/DanceShortsAnalyzer/Fields/AnalyzeChartField';
import AnalyzeDeltaTableField from '@/Pages/DanceShortsAnalyzer/Fields/AnalyzeDeltaTableField';
import AnalyzePerHourTableField from '@/Pages/DanceShortsAnalyzer/Fields/AnalyzePerHourTableField';
import type { DanceShortsAnalyzerComparisonTable } from '@/Pages/DanceShortsAnalyzer/Fields/AnalyzeField';
const columns = [{video_id: 9, title: '欠測の動画・全文', comparison_number: 1, chart_color: '#60a5fa'}, {video_id: 4, title: '長いタイトル・全文', comparison_number: 2, chart_color: '#22c55e'}];
const table: DanceShortsAnalyzerComparisonTable = {columns, metric_label: '高評価数', rows: [{row_id: 1, period_label: '06/01 00:00 -> 06/01 11:00', current_collected_at_label: '2026-06-01 11:00:00', cells: [{video_id: 9, value_label: '-', period_label: null}, {video_id: 4, value_label: '-1', period_label: '2026-06-01 06:00:00 → 2026-06-01 11:00:00'}]}]};
describe('Analyzer comparison reading', () => {
    it('associates each table value with its interval and full video identity', () => {
        const markup = renderToStaticMarkup(<AnalyzeDeltaTableField table={table} />);
        expect(markup).toContain('scope="col"');
        expect(markup).toContain('長いタイトル・全文');
        expect(markup).toContain('2026-06-01 06:00:00 → 2026-06-01 11:00:00');
        expect(markup).toContain('高評価数');
        expect(markup).toContain('#22c55e');
        expect(markup).toContain('2.');
        expect(markup).toContain('-1');
        expect(markup).not.toContain('line-clamp');
    });
    it('retains formatted per-hour zero and missing values', () => {
        const markup = renderToStaticMarkup(<AnalyzePerHourTableField table={{...table, rows: [{...table.rows[0], cells: [{video_id: 9, value_label: '-', period_label: null}, {video_id: 4, value_label: '0.00 / h', period_label: '2026-06-01 06:00:00 → 2026-06-01 11:00:00'}]}]}} />);
        const doc = new DOMParser().parseFromString(markup, 'text/html');
        const cells = doc.querySelectorAll('tbody td');
        expect(cells[0].querySelector('strong')?.textContent).toBe('-');
        expect(cells[1].querySelector('strong')?.textContent).toBe('0.00 / h');
        const mobileRows = doc.querySelectorAll('dl > div');
        expect(mobileRows[0].querySelector('dd')?.textContent).toBe('-');
        expect(mobileRows[1].querySelector('dd')?.textContent).toBe('0.00 / h');
    });
    it('shows each actual interval when videos share an end time but have different starts', () => {
        const first = '2026-06-01 00:00:00 → 2026-06-01 12:00:00';
        const second = '2026-06-01 06:00:00 → 2026-06-01 12:00:00';
        const markup = renderToStaticMarkup(<AnalyzeDeltaTableField table={{...table, rows:[{...table.rows[0], current_collected_at_label:'2026-06-01 12:00:00', cells:[{video_id:9,value_label:'12',period_label:first},{video_id:4,value_label:'6',period_label:second}]}]}} />);
        const doc = new DOMParser().parseFromString(markup,'text/html');
        const cells = doc.querySelectorAll('tbody td');
        expect(cells[0].textContent).toContain(first);
        expect(cells[1].textContent).toContain(second);
        const mobile = Array.from(doc.querySelectorAll('dl > div'));
        expect(mobile[0].textContent).toContain(first);
        expect(mobile[1].textContent).toContain(second);
        expect(markup).toContain('終了時刻');
    });
    it('explains missing intervals without hiding the graph point', () => {
        expect(renderToStaticMarkup(<AnalyzeDeltaTableField table={{...table, rows: []}} />)).toContain('比較できるsnapshot区間がありません');
    });
    it('shows full observation time and values outside the chart canvas', () => {
        const markup = renderToStaticMarkup(<AnalyzeChartField activeMetric="view_count" charts={{view_count: {title: 'View推移', option: {}, observations: [{collected_at_label: '2026-06-01 11:00', videos: columns.map((column, i) => ({...column, value_label: i === 0 ? '-' : '3,362 回'}))}]}}} />);
        expect(markup).toContain('2026-06-01 11:00');
        expect(markup).toContain('3,362 回');
        expect(markup).toContain('長いタイトル・全文');
        expect(markup).toContain('観測時刻');
    });
});
