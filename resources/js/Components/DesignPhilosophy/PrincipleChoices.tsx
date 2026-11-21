import PhilosophyInkText from './PhilosophyInkText';
import { useState } from 'react';
import { trustFrame } from './designPhilosophyData';
const labels = ['主張', '証拠', '許可', '受入'] as const;
const examples = ['「実装できた」という説明は、確認の出発点です。', '対象版・差分・テスト・実画面の確認記録を照合します。', 'その変更や外部操作をしてよい範囲を、個別に確かめます。', '証拠と未確認を見て、人が採否と完成を判断します。'] as const;

export default function PrincipleChoices() {
    const [selected, setSelected] = useState(0);
    return <>
        <p className="dp-diagram-hint">同じ意味へ置き換えず、それぞれを確かめます。</p>
        <div className="dp-principle-choices">{trustFrame.map((item, index) => <button type="button" key={item.label} data-principle-choice={item.label} aria-pressed={selected === index} aria-controls="dp-principle-description" onClick={() => setSelected(index)}><small>{item.label}</small><strong><PhilosophyInkText text={labels[index]} /></strong><span>{item.description}</span></button>)}</div>
        <div key={selected} id="dp-principle-description" className="dp-principle-description" data-principle-description aria-live="polite"><strong>{labels[selected]}を確かめる</strong><p>{examples[selected]}</p></div>
        <div className="dp-principle-loop" aria-label="確認と修正の関係"><ol><li>テスト・実画面確認</li><li>独立して照合</li><li>指摘・修正</li><li>再確認</li></ol><p>未解決の指摘は、修正へ戻す ↶</p></div><figcaption>テストの成功と画面の確認は別の証拠です。独立して照合し、指摘を直したら同じ条件で再確認します。</figcaption>
    </>;
}
