<?php

return [
    /*
    |--------------------------------------------------------------------------
    | DanceShortsRadar sync and retention settings
    |--------------------------------------------------------------------------
    |
    | Scheduler registration is intentionally not added for DanceShortsRadar in
    | this step. sync_enabled is a future gate for explicitly enabled scheduled
    | syncs, and defaults to false so local environments do not consume API quota.
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
