import type { DanceShortsAnalyzerComparisonTable } from './AnalyzeField';
import AnalyzeComparisonTableField from './AnalyzeComparisonTableField';

export default function AnalyzeDeltaTableField({table}: {table: DanceShortsAnalyzerComparisonTable}) {
    return <AnalyzeComparisonTableField table={table} title="増加量" />;
}
