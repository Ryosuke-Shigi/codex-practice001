<?php

namespace App\Responders\ApplicationLog;

use App\DTO\ApplicationLog\ApplicationErrorLogListItemDTO;
use App\DTO\ApplicationLog\ApplicationIntegrationLogListItemDTO;
use App\DTO\ApplicationLog\ApplicationLogsPageDTO;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Project Hub の logs 表示 props を整形する Responder です。
 */
final readonly class ProjectLogsResponder
{
    /**
     * ProjectHubView に渡す props の shape をここで固定します。
     *
     * React 側はタブ切替と resolve 操作だけを担当し、DB項目名や route 生成を知りません。
     */
    public function index(ApplicationLogsPageDTO $page): Response
    {
        return Inertia::render('Projects/Hub', [
            'projectId' => 'logs',
            'applicationLogs' => [
                'activeTab' => $page->activeTab,
                'resolveConfirmationKeyword' => (string) config('application_logs.resolve_confirmation_keyword'),
                'tabs' => [
                    ['id' => 'api', 'label' => 'API'],
                    ['id' => 'error', 'label' => 'ERROR'],
                ],
                'api' => [
                    'rows' => array_map(
                        fn (ApplicationIntegrationLogListItemDTO $item): array => $this->apiLogRowProps($item),
                        $page->apiLogs,
                    ),
                    'emptyMessage' => 'API連携ログはまだありません。',
                ],
                'error' => [
                    'rows' => array_map(
                        fn (ApplicationErrorLogListItemDTO $item): array => $this->errorLogRowProps($item),
                        $page->errorLogs,
                    ),
                    'emptyMessage' => 'ERRORログはまだありません。',
                ],
            ],
        ]);
    }

    /**
     * @return array{id: int, occurredAt: string, content: string, status: string}
     */
    private function apiLogRowProps(ApplicationIntegrationLogListItemDTO $item): array
    {
        // status は UI 側の badge として別表示するため、content へは混ぜません。
        $summary = array_filter([
            $item->serviceName === null ? $item->action : $item->serviceName.' / '.$item->action,
            $item->message,
            $item->responseStatus === null ? null : 'response_status: '.$item->responseStatus,
        ], fn (?string $value): bool => $value !== null && $value !== '');

        return [
            'id' => $item->id,
            'occurredAt' => $item->occurredAt->format('Y-m-d H:i'),
            'content' => implode(' / ', $summary),
            'status' => $item->status,
        ];
    }

    /**
     * @return array{
     *     id: int,
     *     occurredAt: string,
     *     content: string,
     *     level: string,
     *     location: string|null,
     *     isResolved: bool,
     *     canResolve: bool,
     *     resolveUrl: string
     * }
     */
    private function errorLogRowProps(ApplicationErrorLogListItemDTO $item): array
    {
        // ERROR だけが対応済み操作を持つため、resolve URL は API ログ props へ渡しません。
        $location = $item->file === null
            ? null
            : $item->file.($item->line === null ? '' : ':'.$item->line);
        $exceptionClass = $item->exceptionClass === null ? null : class_basename($item->exceptionClass);
        $summary = array_filter([
            $item->message,
            $exceptionClass,
            $location,
        ], fn (?string $value): bool => $value !== null && $value !== '');

        return [
            'id' => $item->id,
            'occurredAt' => $item->occurredAt->format('Y-m-d H:i'),
            'content' => implode(' / ', $summary),
            'level' => $item->level,
            'location' => $location,
            'isResolved' => $item->isResolved,
            'canResolve' => ! $item->isResolved,
            'resolveUrl' => route('application-error-logs.resolve', ['log' => $item->id], false),
        ];
    }
}
