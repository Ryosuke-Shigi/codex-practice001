/**
 * 工事発注 idea-board の共通アップロード基盤 section Component です。
 *
 * 固定データでCSV一括アップロード、共通UploadField、連続撮影、メモ・説明メタ情報の構想を見せるだけにし、
 * 実アップロード、カメラ起動、バックエンドクラス、DBテーブルは作りません。
 */
import MermaidDiagram from '@/Components/Common/Visualizations/Diagrams/MermaidDiagram';

import {
    continuousPhotoFlowChart,
    continuousPhotoPolicies,
    continuousPhotoSteps,
    csvBulkUploadCards,
    csvBulkUploadFiles,
    csvBulkUploadFlowChart,
    uploadDestinationFlowChart,
    uploadFoundationResponsibilities,
    uploadMetadataGroups,
    uploadMetadataNotes,
    uploadQueuePreviews,
    uploadUseCases,
    type UploadFilePreview,
    type UploadQueuePreview,
} from './constructionBillingPresentationData';

const diagramClassName =
    'mt-5 [&_svg]:mx-auto [&_svg]:!w-[min(100%,760px)] [&_svg]:!max-w-full';

const compactDiagramClassName =
    'mt-5 [&_svg]:mx-auto [&_svg]:!w-[min(100%,640px)] [&_svg]:!max-w-full';

/**
 * CSVファイル単位の受付状態を、色だけに頼らずカードの意味へ対応させます。
 */
function fileStatusClassName(tone: UploadFilePreview['tone']) {
    if (tone === 'accepted') {
        return 'border-emerald-200/35 bg-emerald-200/10 text-emerald-50';
    }

    if (tone === 'error') {
        return 'border-rose-200/35 bg-rose-200/10 text-rose-50';
    }

    return 'border-amber-200/35 bg-amber-200/10 text-amber-50';
}

/**
 * 連続撮影キューの状態表示を、保存済み・処理中・再試行待ちで読み分けられるようにします。
 */
function queueStatusClassName(tone: UploadQueuePreview['tone']) {
    if (tone === 'saved') {
        return 'border-emerald-200/35 bg-emerald-200/10 text-emerald-50';
    }

    if (tone === 'failed') {
        return 'border-rose-200/35 bg-rose-200/10 text-rose-50';
    }

    return 'border-sky-200/35 bg-sky-200/10 text-sky-50';
}

/**
 * 保存先制御の責務候補を、フロント・ドメイン・Storage境界・返却整形で視覚的に分けます。
 */
function responsibilityClassName(title: string) {
    if (title === 'UploadField') {
        return 'border-cyan-200/35 bg-cyan-200/10 text-cyan-50';
    }

    if (title === 'UploadDestinationResponder') {
        return 'border-violet-200/35 bg-violet-200/10 text-violet-50';
    }

    if (title === 'StorageRepository') {
        return 'border-emerald-200/35 bg-emerald-200/10 text-emerald-50';
    }

    return 'border-amber-200/35 bg-amber-200/10 text-amber-50';
}

export default function ConstructionBillingUploadFoundationSection() {
    return (
        <section className="min-w-0 rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Upload Foundation
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
                CSV一括アップロードと共通UploadField構想
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-200/80">
                作業カード写真だけの機能に閉じず、CSV、写真、PDF、請求添付、領収添付、履歴添付へ広げられる共通アップロード基盤として整理します。
                ここでは説明カード、簡易フロー、仮データ表示だけを扱い、実アップロードやバックエンド実装には接続しません。
            </p>

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <article className="min-w-0 rounded-lg border border-cyan-100/28 bg-cyan-100/10 p-4 text-cyan-50">
                    <h3 className="text-base font-semibold">
                        CSV一括アップロード入口
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-cyan-50/86">
                        Form入力からCSVを作る入口とは分け、すでに作成済みのCSVをまとめて投入する入口として見せます。
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {csvBulkUploadCards.map((card) => (
                            <div
                                key={card.title}
                                className="min-w-0 rounded-lg border border-white/14 bg-slate-950/30 p-3"
                            >
                                <p className="font-semibold">{card.title}</p>
                                <p className="mt-2 text-sm leading-6 opacity-85">
                                    {card.detail}
                                </p>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="min-w-0 rounded-lg border border-white/14 bg-white/8 p-4">
                    <h3 className="text-base font-semibold text-white">
                        ファイルごとの受付状態
                    </h3>
                    <div className="mt-3 grid gap-3">
                        {csvBulkUploadFiles.map((file) => (
                            <div
                                key={file.fileName}
                                className={`min-w-0 rounded-lg border p-3 ${fileStatusClassName(file.tone)}`}
                            >
                                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="break-all font-semibold">
                                            {file.fileName}
                                        </p>
                                        <p className="mt-1 text-sm leading-6 opacity-82">
                                            {file.size} / {file.count}
                                        </p>
                                    </div>
                                    <span className="inline-flex w-fit shrink-0 rounded-full border border-current/25 px-3 py-1 text-xs font-semibold">
                                        {file.status}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm leading-6 opacity-85">
                                    {file.detail}
                                </p>
                            </div>
                        ))}
                    </div>
                </article>
            </div>

            <div className="mt-5 min-w-0 rounded-lg border border-white/14 bg-white/8 p-4">
                <MermaidDiagram
                    chart={csvBulkUploadFlowChart}
                    title="CSV一括アップロード入口とSystem側処理の分担"
                    className={diagramClassName}
                />
            </div>

            <div className="mt-5 rounded-lg border border-white/14 bg-slate-950/42 p-4">
                <h3 className="text-base font-semibold text-white">
                    共通UploadFieldの用途候補
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-200/78">
                    フロントが渡すのは保存先パスではなく、用途と対象IDです。
                    用途に応じた保存先、形式、許可ルールはLaravel側で切り替える構想として扱います。
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {uploadUseCases.map((useCase) => (
                        <div
                            key={useCase.title}
                            className="min-w-0 rounded-lg border border-white/12 bg-white/8 p-3 text-white"
                        >
                            <p className="break-all font-mono text-xs font-semibold text-cyan-100">
                                {useCase.title}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-200/78">
                                {useCase.detail}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                <article className="min-w-0 rounded-lg border border-white/14 bg-white/8 p-4">
                    <h3 className="text-base font-semibold text-white">
                        連続撮影アップロードの流れ
                    </h3>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {continuousPhotoSteps.map((step, index) => (
                            <div
                                key={step.title}
                                className="min-w-0 rounded-lg border border-white/12 bg-slate-950/35 p-3 text-white"
                            >
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/72">
                                    手順 {index + 1}
                                </p>
                                <p className="mt-2 font-semibold">{step.title}</p>
                                <p className="mt-2 text-sm leading-6 text-slate-200/78">
                                    {step.detail}
                                </p>
                            </div>
                        ))}
                    </div>
                    <MermaidDiagram
                        chart={continuousPhotoFlowChart}
                        title="共通UploadFieldと連続撮影アップロードの流れ"
                        className={compactDiagramClassName}
                    />
                </article>

                <article className="min-w-0 rounded-lg border border-white/14 bg-white/8 p-4">
                    <h3 className="text-base font-semibold text-white">
                        モバイル縦で見るキュー例
                    </h3>
                    <div className="mt-3 grid gap-3">
                        {uploadQueuePreviews.map((item) => (
                            <div
                                key={item.title}
                                className={`min-w-0 rounded-lg border p-3 ${queueStatusClassName(item.tone)}`}
                            >
                                <div className="flex gap-3">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-current/20 bg-slate-950/28 text-xs font-semibold">
                                        サムネイル
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <p className="font-semibold">{item.title}</p>
                                            <span className="inline-flex w-fit rounded-full border border-current/25 px-3 py-1 text-xs font-semibold">
                                                {item.status}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm leading-6 opacity-85">
                                            {item.detail}
                                        </p>
                                    </div>
                                </div>
                                <p className="mt-3 text-xs leading-5 opacity-78">
                                    {item.meta}
                                </p>
                                <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-semibold">
                                    {['プレビュー', '削除', '再試行'].map((label) => (
                                        <button
                                            key={label}
                                            type="button"
                                            disabled
                                            className="min-h-9 rounded-md border border-current/20 bg-slate-950/20 px-2 opacity-80"
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 grid gap-2">
                        {continuousPhotoPolicies.map((policy) => (
                            <div
                                key={policy.title}
                                className="rounded-lg border border-white/12 bg-slate-950/35 p-3 text-white"
                            >
                                <p className="font-semibold">{policy.title}</p>
                                <p className="mt-2 text-sm leading-6 text-slate-200/78">
                                    {policy.detail}
                                </p>
                            </div>
                        ))}
                    </div>
                </article>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <article className="min-w-0 rounded-lg border border-white/14 bg-white/8 p-4">
                    <h3 className="text-base font-semibold text-white">
                        保存先制御の責務分担
                    </h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {uploadFoundationResponsibilities.map((column) => (
                            <div
                                key={column.title}
                                className={`min-w-0 rounded-lg border p-3 ${responsibilityClassName(column.title)}`}
                            >
                                <p className="break-words text-sm font-semibold">
                                    {column.title}
                                </p>
                                <p className="mt-1 text-sm leading-6 opacity-85">
                                    {column.role}
                                </p>
                                <ul className="mt-3 space-y-2 text-sm leading-6 opacity-90">
                                    {column.points.map((point) => (
                                        <li key={point} className="flex gap-2">
                                            <span
                                                aria-hidden="true"
                                                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current"
                                            />
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <MermaidDiagram
                        chart={uploadDestinationFlowChart}
                        title="保存先をフロントで決めない構成"
                        className={compactDiagramClassName}
                    />
                </article>

                <article className="min-w-0 rounded-lg border border-white/14 bg-white/8 p-4">
                    <h3 className="text-base font-semibold text-white">
                        メモ・説明メタ情報
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-200/78">
                        保存したファイルには後から説明を付けられる想定です。
                        写真には何の写真か、CSVやPDFには何のファイルかを残し、最大枚数なしでも探しやすくします。
                    </p>
                    <div className="mt-4 grid gap-3">
                        {uploadMetadataGroups.map((group) => (
                            <div
                                key={group.title}
                                className="min-w-0 rounded-lg border border-white/12 bg-slate-950/35 p-3 text-white"
                            >
                                <p className="font-semibold">{group.title}</p>
                                <p className="mt-1 text-sm leading-6 text-slate-200/78">
                                    {group.role}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {group.points.map((point) => (
                                        <span
                                            key={point}
                                            className="rounded-full border border-cyan-100/24 bg-cyan-100/10 px-3 py-1 text-xs font-semibold text-cyan-50"
                                        >
                                            {point}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 grid gap-3">
                        {uploadMetadataNotes.map((note) => (
                            <div
                                key={note.title}
                                className="rounded-lg border border-amber-200/25 bg-amber-200/10 p-3 text-amber-50"
                            >
                                <p className="font-semibold">{note.title}</p>
                                <p className="mt-2 text-sm leading-6 opacity-85">
                                    {note.detail}
                                </p>
                            </div>
                        ))}
                    </div>
                </article>
            </div>
        </section>
    );
}
