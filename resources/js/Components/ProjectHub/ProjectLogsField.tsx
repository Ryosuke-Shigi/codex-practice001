import { router } from '@inertiajs/react';
import { CheckCircle2, X } from 'lucide-react';
import {
    useEffect,
    useState,
    type ChangeEvent,
    type KeyboardEvent,
} from 'react';

export type ProjectLogTabId = 'api' | 'error';

type ProjectLogTab = {
    id: ProjectLogTabId;
    label: string;
};

export type ApiLogRow = {
    id: number;
    occurredAt: string;
    content: string;
    status: string;
};

export type ErrorLogRow = {
    id: number;
    occurredAt: string;
    content: string;
    level: string;
    location: string | null;
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
    resolveConfirmationKeyword: string;
    tabs: ProjectLogTab[];
    api: LogTable<ApiLogRow>;
    error: LogTable<ErrorLogRow>;
};

type ProjectLogsFieldProps = {
    logs: ProjectLogsProps;
};

type ErrorLogResolvePostOptions = {
    onSuccess?: () => void;
    onFinish?: () => void;
};

export const emptyProjectLogs: ProjectLogsProps = {
    activeTab: 'api',
    resolveConfirmationKeyword: 'resolve',
    tabs: [
        { id: 'api', label: 'API連携' },
        { id: 'error', label: 'エラー' },
    ],
    api: {
        rows: [],
        emptyMessage: 'API連携ログはまだありません。',
    },
    error: {
        rows: [],
        emptyMessage: 'エラーログはまだありません。',
    },
};

export function canSubmitErrorLogResolve(
    row: ErrorLogRow | null,
    confirmation: string,
    expectedConfirmation: string,
    resolvingErrorLogId: number | null,
): boolean {
    return (
        row !== null &&
        row.canResolve &&
        !row.isResolved &&
        resolvingErrorLogId === null &&
        expectedConfirmation !== '' &&
        confirmation === expectedConfirmation
    );
}

export function postErrorLogResolve(
    row: ErrorLogRow,
    confirmation: string,
    options: ErrorLogResolvePostOptions = {},
) {
    router.post(
        row.resolveUrl,
        { confirmation },
        {
            preserveScroll: true,
            onSuccess: () => options.onSuccess?.(),
            onFinish: () => options.onFinish?.(),
        },
    );
}

export default function ProjectLogsField({ logs }: ProjectLogsFieldProps) {
    const [activeTab, setActiveTab] = useState<ProjectLogTabId>(
        logs.activeTab,
    );
    const [selectedErrorLog, setSelectedErrorLog] =
        useState<ErrorLogRow | null>(null);
    const [confirmation, setConfirmation] = useState('');
    const [resolvingErrorLogId, setResolvingErrorLogId] = useState<
        number | null
    >(null);

    const closeErrorLogModal = () => {
        setSelectedErrorLog(null);
        setConfirmation('');
    };

    useEffect(() => {
        setActiveTab(logs.activeTab);

        if (logs.activeTab !== 'error') {
            closeErrorLogModal();
        }
    }, [logs.activeTab]);

    useEffect(() => {
        setSelectedErrorLog((current) => {
            if (current === null) {
                return null;
            }

            return (
                logs.error.rows.find((row) => row.id === current.id) ?? null
            );
        });
    }, [logs.error.rows]);

    const activeRows =
        activeTab === 'api' ? logs.api.rows : logs.error.rows;
    const emptyMessage =
        activeTab === 'api' ? logs.api.emptyMessage : logs.error.emptyMessage;

    const handleTabSelect = (tabId: ProjectLogTabId) => {
        setActiveTab(tabId);

        if (tabId !== 'error') {
            closeErrorLogModal();
        }
    };

    const handleOpenErrorLog = (row: ErrorLogRow) => {
        setSelectedErrorLog(row);
        setConfirmation('');
    };

    const handleResolve = () => {
        const row = selectedErrorLog;

        if (
            row === null ||
            !canSubmitErrorLogResolve(
                row,
                confirmation,
                logs.resolveConfirmationKeyword,
                resolvingErrorLogId,
            )
        ) {
            return;
        }

        /*
         * confirmation は誤操作防止用の一時入力です。
         * 送信後または画面更新後に残さないよう、成功時と終了時の両方でクリアします。
         */
        setResolvingErrorLogId(row.id);
        postErrorLogResolve(row, confirmation, {
            onSuccess: closeErrorLogModal,
            onFinish: () => {
                setResolvingErrorLogId(null);
                setConfirmation('');
            },
        });
    };

    return (
        <section className="project-logs-field" aria-label="logs">
            <div
                className="project-logs-tabs"
                role="tablist"
                aria-label="ログ種別"
            >
                {logs.tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        className="project-logs-tab"
                        aria-selected={activeTab === tab.id}
                        onClick={() => handleTabSelect(tab.id)}
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
                                          onSelect={handleOpenErrorLog}
                                      />
                                  ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedErrorLog !== null && (
                <ErrorLogDetailModal
                    row={selectedErrorLog}
                    confirmation={confirmation}
                    resolveConfirmationKeyword={
                        logs.resolveConfirmationKeyword
                    }
                    resolvingErrorLogId={resolvingErrorLogId}
                    onConfirmationChange={setConfirmation}
                    onClose={closeErrorLogModal}
                    onResolve={handleResolve}
                />
            )}
        </section>
    );
}

export function ApiLogTableRow({ row }: { row: ApiLogRow }) {
    return (
        <tr>
            <td>{row.occurredAt}</td>
            <td>
                <div className="project-log-content">
                    <span
                        className={`project-log-label project-log-label--${row.status}`}
                    >
                        [{apiStatusLabel(row.status)}]
                    </span>
                    <span>{row.content}</span>
                </div>
            </td>
        </tr>
    );
}

export function ErrorLogTableRow({
    row,
    onSelect,
}: {
    row: ErrorLogRow;
    onSelect: (row: ErrorLogRow) => void;
}) {
    const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        event.preventDefault();
        onSelect(row);
    };

    return (
        <tr
            className="project-log-clickable-row"
            role="button"
            tabIndex={0}
            aria-label={`エラーログ詳細を開く ${row.occurredAt}`}
            onClick={() => onSelect(row)}
            onKeyDown={handleKeyDown}
        >
            <td>{row.occurredAt}</td>
            <td>
                <div className="project-log-content">
                    <span
                        className={`project-log-label project-log-label--${row.level}`}
                    >
                        [{errorLevelLabel(row.level)}]
                    </span>
                    <span>{row.content}</span>
                    {row.isResolved && (
                        <span className="project-log-resolved">
                            <CheckCircle2 aria-hidden="true" size={15} />
                            対応済み
                        </span>
                    )}
                </div>
            </td>
        </tr>
    );
}

export function ErrorLogDetailModal({
    row,
    confirmation,
    resolveConfirmationKeyword,
    resolvingErrorLogId,
    onConfirmationChange,
    onClose,
    onResolve,
}: {
    row: ErrorLogRow;
    confirmation: string;
    resolveConfirmationKeyword: string;
    resolvingErrorLogId: number | null;
    onConfirmationChange: (confirmation: string) => void;
    onClose: () => void;
    onResolve: () => void;
}) {
    const canSubmit = canSubmitErrorLogResolve(
        row,
        confirmation,
        resolveConfirmationKeyword,
        resolvingErrorLogId,
    );
    const isResolving = resolvingErrorLogId === row.id;
    const resolvedState = row.isResolved ? '対応済み' : '未対応';

    const handleConfirmationChange = (
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        onConfirmationChange(event.target.value);
    };

    return (
        <div className="project-log-modal-backdrop">
            <section
                className="project-log-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="project-log-modal-title"
            >
                <header className="project-log-modal-header">
                    <h2 id="project-log-modal-title">エラーログ詳細</h2>
                    <button
                        type="button"
                        className="project-log-modal-icon-button"
                        aria-label="閉じる"
                        onClick={onClose}
                    >
                        <X aria-hidden="true" size={18} />
                    </button>
                </header>

                <dl className="project-log-detail-list">
                    <div>
                        <dt>時間</dt>
                        <dd>{row.occurredAt}</dd>
                    </div>
                    <div>
                        <dt>内容</dt>
                        <dd>{row.content}</dd>
                    </div>
                    <div>
                        <dt>種別</dt>
                        <dd>
                            <span
                                className={`project-log-label project-log-label--${row.level}`}
                            >
                                [{errorLevelLabel(row.level)}]
                            </span>
                        </dd>
                    </div>
                    <div>
                        <dt>発生箇所</dt>
                        <dd>{row.location ?? '発生箇所は記録されていません'}</dd>
                    </div>
                    <div>
                        <dt>対応状況</dt>
                        <dd>
                            <span className="project-log-resolved-state">
                                {resolvedState}
                            </span>
                        </dd>
                    </div>
                </dl>

                <label className="project-log-confirmation-field">
                    <span>確認入力</span>
                    <input
                        type="text"
                        value={confirmation}
                        placeholder={resolveConfirmationKeyword}
                        autoComplete="off"
                        disabled={!row.canResolve || row.isResolved}
                        onChange={handleConfirmationChange}
                    />
                </label>

                <div className="project-log-modal-actions">
                    <button
                        type="button"
                        className="project-log-resolve-button"
                        disabled={!canSubmit}
                        onClick={onResolve}
                    >
                        <CheckCircle2 aria-hidden="true" size={16} />
                        {isResolving ? '保存中' : '対応済みにする'}
                    </button>
                    <button
                        type="button"
                        className="project-log-modal-close-button"
                        onClick={onClose}
                    >
                        閉じる
                    </button>
                </div>
            </section>
        </div>
    );
}

function apiStatusLabel(status: string): string {
    if (status === 'success') {
        return '成功';
    }

    if (status === 'failed') {
        return '失敗';
    }

    return status;
}

function errorLevelLabel(level: string): string {
    if (level === 'error') {
        return 'エラー';
    }

    if (level === 'warning') {
        return '警告';
    }

    return level;
}
