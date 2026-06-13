/**
 * 工事発注管理・請求システム MOCK のタブナビゲーション Component です。
 *
 * 画面内 tab state の切替だけを担当し、route 遷移や保存済み業務状態とは接続しません。
 */
import type { TabKey } from './mockData';
import { tabs } from './mockData';

type MockTabNavigationProps = {
    activeTab: TabKey;
    onChange: (tab: TabKey) => void;
};

function tabClassName(isActive: boolean) {
    return isActive
        ? 'border-cyan-100 bg-cyan-100 text-slate-950 shadow-[0_10px_24px_rgba(103,232,249,0.2)]'
        : 'border-white/15 bg-white/8 text-slate-100 hover:bg-white/14';
}

export default function MockTabNavigation({
    activeTab,
    onChange,
}: MockTabNavigationProps) {
    return (
        <nav className="overflow-x-auto rounded-lg border border-white/15 bg-slate-950/70 p-2 backdrop-blur-xl">
            <div className="flex min-w-max gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        className={`min-h-11 rounded-lg border px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 ${tabClassName(activeTab === tab.key)}`}
                        onClick={() => onChange(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </nav>
    );
}
