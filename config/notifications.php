<?php

return [
    'operations' => [
        'server_health' => [
            'daily_report' => [
                'mail_to' => array_values(array_unique(array_filter(array_map(
                    'trim',
                    explode(',', (string) env('OPERATIONS_SERVER_HEALTH_DAILY_REPORT_MAIL_TO', ''))
                )))),
            ],
        ],
    ],
];
