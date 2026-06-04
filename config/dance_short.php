<?php

return [
    /*
    |--------------------------------------------------------------------------
    | DanceShortsRadar sync and retention settings
    |--------------------------------------------------------------------------
    |
    | The YouTube sync scheduler is guarded by sync_enabled. The value
    | defaults to false so local environments do not enqueue the YouTube sync
    | job or consume API quota unless explicitly enabled.
    |
    | Snapshot cleanup is a separate DB-only maintenance job. It uses
    | snapshot_retention_days and does not consume YouTube Data API quota.
    |
    */

    'sync_enabled' => filter_var(env('DANCE_SHORT_SYNC_ENABLED', false), FILTER_VALIDATE_BOOLEAN),

    /*
     * The UI comparison window is 30 days. Detailed snapshots keep a 5 day
     * buffer by default, so cleanup physically deletes only snapshots older
     * than 35 days.
     */
    'snapshot_retention_days' => env('DANCE_SHORT_SNAPSHOT_RETENTION_DAYS', 35),
];
