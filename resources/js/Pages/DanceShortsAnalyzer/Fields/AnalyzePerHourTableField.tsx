import type { DanceShortsAnalyzerComparisonTable } from './AnalyzeField';
import AnalyzeComparisonTableField from './AnalyzeComparisonTableField';

export default function AnalyzePerHourTableField({table}: {table: DanceShortsAnalyzerComparisonTable}) {
    return <AnalyzeComparisonTableField table={table} title="1時間あたり" />;
}
