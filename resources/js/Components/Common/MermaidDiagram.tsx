import { useEffect, useId, useMemo, useState } from 'react';
import mermaid from 'mermaid';

export type MermaidDiagramProps = {
    chart: string;
    title?: string;
    className?: string;
    expandable?: boolean;
};

let isMermaidInitialized = false;

function initializeMermaidOnce() {
    if (isMermaidInitialized) {
        return;
    }

    /*
     * Mermaid はこの共通表示コンポーネントの中だけで初期化します。
     * startOnLoad を false にし、React の useEffect で chart props を明示的に SVG 化します。
     */
    mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
    });

    isMermaidInitialized = true;
}

function buildRenderId(reactId: string) {
    /*
     * React の useId は ":" を含むため、Mermaid の SVG ID として扱いやすい形へ寄せます。
     * 元の一意性は useId に任せ、ここでは図の描画IDとして安全に使える文字だけにします。
     */
    return `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

function errorMessageFrom(error: unknown) {
    if (error instanceof Error && error.message) {
        return `Mermaid図の描画に失敗しました。構文を確認してください。 ${error.message}`;
    }

    return 'Mermaid図の描画に失敗しました。構文を確認してください。';
}

export default function MermaidDiagram({
    chart,
    title,
    className = '',
    expandable = true,
}: MermaidDiagramProps) {
    const reactId = useId();
    const renderId = useMemo(() => buildRenderId(reactId), [reactId]);
    const [svg, setSvg] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        let isCanceled = false;

        async function renderChart() {
            initializeMermaidOnce();
            setSvg('');
            setError(null);

            if (!chart.trim()) {
                setError('Mermaid図の文字列が空です。');
                return;
            }

            try {
                const result = await mermaid.render(renderId, chart);

                if (!isCanceled) {
                    setSvg(result.svg);
                }
            } catch (renderError) {
                if (!isCanceled) {
                    setError(errorMessageFrom(renderError));
                }
            }
        }

        void renderChart();

        return () => {
            isCanceled = true;
        };
    }, [chart, renderId]);

    useEffect(() => {
        if (!isExpanded) {
            return;
        }

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsExpanded(false);
            }
        }

        window.addEventListener('keydown', closeOnEscape);

        return () => {
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [isExpanded]);

    const titleId = `${renderId}-title`;
    const modalTitleId = `${renderId}-modal-title`;

    return (
        <div className={className}>
            {title && (
                <h3
                    id={titleId}
                    className="mb-3 text-base font-semibold leading-7 text-white"
                >
                    {title}
                </h3>
            )}

            {error ? (
                <div className="rounded-lg border border-rose-200/35 bg-rose-100/12 p-4 text-sm leading-6 text-rose-50">
                    {error}
                </div>
            ) : svg ? (
                expandable ? (
                    <button
                        type="button"
                        aria-label={`${title ?? 'Mermaid図'}を拡大表示する`}
                        aria-describedby={title ? titleId : undefined}
                        onClick={() => setIsExpanded(true)}
                        className="block w-full cursor-zoom-in rounded-lg border border-white/14 bg-white/8 p-3 text-left text-slate-950 transition hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                    >
                        <span
                            className="block w-full overflow-x-auto"
                            dangerouslySetInnerHTML={{ __html: svg }}
                        />
                    </button>
                ) : (
                    <div
                        aria-describedby={title ? titleId : undefined}
                        className="rounded-lg border border-white/14 bg-white/8 p-3 text-slate-950"
                    >
                        <div
                            className="w-full overflow-x-auto"
                            dangerouslySetInnerHTML={{ __html: svg }}
                        />
                    </div>
                )
            ) : (
                <div className="rounded-lg border border-white/14 bg-white/8 p-4 text-sm leading-6 text-slate-200/78">
                    Mermaid図を描画しています。
                </div>
            )}

            {isExpanded && svg && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? modalTitleId : undefined}
                    aria-label={title ? undefined : 'Mermaid図の拡大表示'}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/82 p-4 backdrop-blur-sm"
                    onClick={() => setIsExpanded(false)}
                >
                    <div
                        className="flex max-h-[92vh] w-full max-w-6xl flex-col gap-4 rounded-lg border border-white/18 bg-slate-950 p-4 shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:p-5"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                {title && (
                                    <h3
                                        id={modalTitleId}
                                        className="text-lg font-semibold leading-7 text-white"
                                    >
                                        {title}
                                    </h3>
                                )}
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/70">
                                    Mermaid Diagram
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsExpanded(false)}
                                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/18 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                            >
                                閉じる
                            </button>
                        </div>

                        <div
                            className="min-h-0 flex-1 overflow-auto rounded-lg border border-white/14 bg-white p-4 text-slate-950"
                            dangerouslySetInnerHTML={{ __html: svg }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
