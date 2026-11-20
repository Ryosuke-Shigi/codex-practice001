import PhilosophyInkText from './PhilosophyInkText';
import { useState } from 'react';

const nodes = [
    { key: 'human', title: '開発者', copy: '目的・操作許可・最終判断', x: 50, y: 9 },
    { key: 'contract', title: '作業条件', copy: '対象・範囲・完了条件・確認方法', x: 16, y: 44 },
    { key: 'parent', title: '進行・統合担当', copy: '担当への依頼と結果の照合', x: 50, y: 44 },
    { key: 'writer', title: '実装担当', copy: '許可された変更を作る', x: 84, y: 44 },
    { key: 'verify', title: '検証担当', copy: '動作と結果を確認', x: 16, y: 88 },
    { key: 'artifact', title: '成果物・確認資料', copy: '対象版・差分・確認記録', x: 50, y: 88 },
    { key: 'review', title: 'レビュー担当', copy: '指示・責務・差分を照合', x: 84, y: 88 },
] as const;
type NodeKey = typeof nodes[number]['key'];
const edges: { from: NodeKey; to: NodeKey; label: string; path: string }[] = [
    { from: 'human', to: 'contract', label: '目的・操作許可', path: 'M50 17C50 29 16 25 16 35' },
    { from: 'contract', to: 'parent', label: '作業の基準', path: 'M30 44H36' },
    { from: 'parent', to: 'writer', label: '依頼・修正の差戻し', path: 'M64 44H70' },
    { from: 'writer', to: 'artifact', label: '変更内容', path: 'M84 53C84 67 50 66 50 79' },
    { from: 'artifact', to: 'verify', label: '確認対象', path: 'M36 88H30' },
    { from: 'artifact', to: 'review', label: '照合対象', path: 'M64 88H70' },
    { from: 'parent', to: 'verify', label: '確認方法・範囲', path: 'M37 48C30 61 16 64 16 79' },
    { from: 'parent', to: 'review', label: '照合の観点', path: 'M63 48C70 61 84 64 84 79' },
    { from: 'verify', to: 'parent', label: '結果・未確認事項', path: 'M28 81C35 70 40 61 44 53' },
    { from: 'review', to: 'parent', label: '指摘・未確認事項', path: 'M72 81C65 70 60 61 56 53' },
    { from: 'parent', to: 'human', label: '証拠をまとめて判断へ', path: 'M37 40C30 20 32 9 36 9' },
];
function name(key: NodeKey) { return nodes.find(node => node.key === key)!.title; }

export default function HarnessStructure() {
    const [selected, setSelected] = useState<NodeKey>('parent');
    return <>
        <p className="dp-diagram-hint">項目を選ぶと、つながりと受け渡す内容を確認できます。</p>
        <div className="dp-harness-map" aria-label="ハーネスの7項目">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="dp-harness-lines">
                <defs><marker id="dp-harness-arrow" markerUnits="userSpaceOnUse" markerWidth="1.3" markerHeight="1.3" viewBox="0 0 6 6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" /></marker></defs>
                {edges.map(edge => <path key={`${selected}-${edge.from}-${edge.to}`} d={edge.path} pathLength="1" data-harness-edge={`${edge.from}-${edge.to}`} data-related={edge.from === selected || edge.to === selected} markerEnd="url(#dp-harness-arrow)" />)}
            </svg>
            {nodes.map(node => <button key={node.key} type="button" className="dp-harness-node" data-harness-node={node.key} aria-pressed={selected === node.key} aria-controls="dp-harness-connections" onClick={() => setSelected(node.key)} style={{ left: `${node.x}%`, top: `${node.y}%` }}><strong><PhilosophyInkText text={node.title} /></strong><span>{node.copy}</span></button>)}
        </div>
        <div id="dp-harness-connections" className="dp-harness-connections" data-harness-connections aria-live="polite" aria-atomic="true">
            <h3>{name(selected)}につながる受け渡し</h3>
            <ul>{edges.filter(edge => edge.from === selected || edge.to === selected).map(edge => <li key={`${edge.from}-${edge.to}`}><span>{name(edge.from)} <b aria-hidden="true">→</b><span className="sr-only">から</span> {name(edge.to)}</span><strong>{edge.label}</strong></li>)}</ul>
        </div>
        <figcaption><strong>編集は同時に一担当。確認時は編集を止め、別担当へ渡します。</strong><br />共通ルール・担当定義と、対象プロジェクトの仕様・コード・テストを参照して進めます。</figcaption>
        <p className="dp-diagram-scope">この図は運用設計の概略です。全機能の実稼働や、権限・通信制御の保証を示すものではありません。</p>
    </>;
}
