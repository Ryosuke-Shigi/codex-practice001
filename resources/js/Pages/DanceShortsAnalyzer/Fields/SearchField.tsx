/**
 * DanceShortsAnalyzer Search 画面の検索フォーム Field Component です。
 *
 * 入力値と送信先 props を表示し、保存済み動画の検索条件や validation は Request / Action 側へ委譲します。
 */
import type { FormEvent } from 'react';

export type DanceShortsAnalyzerSearchFieldProps = {
    keyword: string;
    action: string;
    analyze_action: string;
    placeholder: string;
    button_label: string;
};

type SearchFieldProps = {
    searchField: DanceShortsAnalyzerSearchFieldProps;
    keyword: string;
    loading: boolean;
    statusMessage: string;
    onKeywordChange: (keyword: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function SearchField({
    searchField,
    keyword,
    loading,
    statusMessage,
    onKeywordChange,
    onSubmit,
}: SearchFieldProps) {
    return (
        <section className="shrink-0 rounded-lg border border-white/14 bg-slate-900 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.24)] backdrop-blur-xl sm:p-4">
            <form className="flex min-w-0 flex-col gap-2 sm:flex-row" onSubmit={onSubmit}>
                <label className="sr-only" htmlFor="analyzer-keyword">検索キーワード</label>
                <input
                    id="analyzer-keyword"
                    aria-describedby="analyzer-search-help analyzer-search-status"
                    type="search"
                    aria-label="検索キーワード"
                    value={keyword}
                    disabled={loading}
                    placeholder={searchField.placeholder}
                    onChange={(event) => onKeywordChange(event.target.value)}
                    className="min-h-11 min-w-0 flex-1 rounded-lg border border-white/16 bg-white/10 px-3 text-sm font-semibold text-white outline-none placeholder:text-slate-300/62 focus:border-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-blue-100/40 bg-blue-500 px-5 text-sm font-bold text-white transition hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 disabled:cursor-wait disabled:opacity-70"
                >
                    {loading ? '検索中' : searchField.button_label}
                </button>
            </form>
            <p id="analyzer-search-help" className="mt-2 text-xs leading-5 text-slate-300">保存済み動画のID・タイトル・説明・チャンネル名・タグを検索できます。</p>
            <p id="analyzer-search-status" role="status" aria-live="polite" className="mt-2 text-sm text-slate-100">{statusMessage}</p>
        </section>
    );
}
