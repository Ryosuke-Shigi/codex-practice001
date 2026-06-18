import { router } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ProjectLogTabId = 'api' | 'error';

type ProjectLogTab = {
    id: ProjectLogTabId;
    label: string;
};

type ApiLogRow = {
    id: number;
    occurredAt: string;
    content: string;
    status: string;
};

type ErrorLogRow = {
    id: number;
    occurredAt: string;
    content: string;
    level: string;
    isResolved: boolean;
    canResolve: boolean;
    resolveUrl: string;
};

type LogTable<Row> = {
    rows: Row[];
    emptyMessage: string;
};

export type ProjectLogsProps = {
    /**
     * サーバー側 query の tab と同期する初期選択です。
     * 画面内クリック後はローカル state で切り替え、再訪問時だけ props へ追従します。
     */
    activeTab: ProjectLogTabId;
    tabs: ProjectLogTab[];
    api: LogTable<ApiLogRow>;
    error: LogTable<ErrorLogRow>;
};

type ProjectLogsFieldProps = {
    logs: ProjectLogsProps;
};

export const emptyProjectLogs: ProjectLogsProps = {
    activeTab: 'api',
    tabs: [
        { id: 'api', label: 'API' },
        { id: 'error', label: 'ERROR' },
    ],
    api: {
        rows: [],
        emptyMessage: 'API連携ログはまだありません。',
    },
    error: {
        rows: [],
        emptyMessage: 'ERRORログはまだありません。',
    },
};

export default function ProjectLogsField({ logs }: ProjectLogsFieldProps) {
    const [activeTab, setActiveTab] = useState<ProjectLogTabId>(
        logs.activeTab,
    );
    const [resolvingErrorLogId, setResolvingErrorLogId] = useState<
        number | null
    >(null);

    useEffect(() => {
        setActiveTab(logs.activeTab);
    }, [logs.activeTab]);

    const activeRows =
        activeTab === 'api' ? logs.api.rows : logs.error.rows;
    const emptyMessage =
        activeTab === 'api' ? logs.api.emptyMessage : logs.error.emptyMessage;

    const handleResolve = (row: ErrorLogRow) => {
        if (!row.canResolve || resolvingErrorLogId !== null) {
            return;
        }

        // 二重送信を避けつつ、Inertia の再描画で最新の resolved 状態を受け取ります。
        setResolvingErrorLogId(row.id);
        router.post(
            row.resolveUrl,
            {},
            {
                preserveScroll: true,
                onFinish: () => setResolvingErrorLogId(null),
            },
        );
    };

    return (
        <section className="project-logs-field" aria-label="logs">
            <div
                className="project-logs-tabs"
                role="tablist"
                aria-label="Log type"
            >
                {logs.tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        className="project-logs-tab"
                        aria-selected={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="project-logs-table-frame">
                {activeRows.length === 0 ? (
                    <p className="project-logs-empty">{emptyMessage}</p>
                ) : (
                    <table className="project-logs-table">
                        <thead>
                            <tr>
                                <th scope="col">時間</th>
                                <th scope="col">内容</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeTab === 'api'
                                ? logs.api.rows.map((row) => (
                                      <ApiLogTableRow key={row.id} row={row} />
                                  ))
                                : logs.error.rows.map((row) => (
                                      <ErrorLogTableRow
                                          key={row.id}
                                          row={row}
                                          isResolving={
                                              resolvingErrorLogId === row.id
                                          }
                                          onResolve={handleResolve}
                                      />
                                  ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
}

function ApiLogTableRow({ row }: { row: ApiLogRow }) {
    return (
        <tr>
            <td>{row.occurredAt}</td>
            <td>
                <div className="project-log-content">
                    <span className={`project-log-label project-log-label--${row.status}`}>
                        [{row.status}]
                    </span>
                    <span>{row.content}</span>
                </div>
            </td>
        </tr>
    );
}

function ErrorLogTableRow({
    row,
    isResolving,
    onResolve,
}: {
    row: ErrorLogRow;
    isResolving: boolean;
    onResolve: (row: ErrorLogRow) => void;
}) {
    return (
        <tr>
            <td>{row.occurredAt}</td>
            <td>
                <div className="project-log-content">
                    <span className={`project-log-label project-log-label--${row.level}`}>
                        [{row.level}]
                    </span>
                    <span>{row.content}</span>
                    {row.isResolved ? (
                        <span className="project-log-resolved">
                            <CheckCircle2 aria-hidden="true" size={15} />
                            resolved
                        </span>
                    ) : (
                        <button
                            type="button"
                            className="project-log-resolve-button"
                            disabled={!row.canResolve || isResolving}
                            onClick={() => onResolve(row)}
                        >
                            {isResolving ? 'saving' : '対応済み'}
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}
