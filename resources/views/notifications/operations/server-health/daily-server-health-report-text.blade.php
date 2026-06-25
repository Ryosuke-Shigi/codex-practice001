サーバー容量:
- 総容量: {{ number_format($report->diskUsage->totalGb, 2) }} GB
- 使用量: {{ number_format($report->diskUsage->usedGb, 2) }} GB
- 空き容量: {{ number_format($report->diskUsage->freeGb, 2) }} GB
- 使用率: {{ $report->diskUsage->usagePercent }}%

MySQL:
- DB使用量: {{ number_format($report->mySqlUsage->databaseGb, 2) }} GB
- binlog容量: {{ $report->mySqlUsage->binlogGb === null ? '取得不可' : number_format($report->mySqlUsage->binlogGb, 2).' GB' }}

判定:
{{ $report->status }}
