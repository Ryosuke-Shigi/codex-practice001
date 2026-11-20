import PhilosophyInkText from './PhilosophyInkText';
import { useState } from 'react';
import HarnessStructure from './HarnessStructure';
import PrincipleChoices from './PrincipleChoices';
import { architectureResponsibilities, developmentStages } from './designPhilosophyData';

type DiagramKind = 'roles' | 'structure' | 'checks' | 'stages';
const structureAreas = [
    { key: 'screen', label: '画面', copy: '見せ方と操作を整える', layers: 'Responder → Page → Feature Component', categories: ['presentation'] },
    { key: 'process', label: '処理', copy: '目的に沿って手順と判断を進める', layers: 'Controller / Request → Action → Service', categories: ['entry', 'application', 'domain', 'side-effect', 'read-side'] },
    { key: 'data', label: 'データ', copy: '取得・保存と、受け渡す値を分ける', layers: 'Repository / DTO / ListDTO', categories: ['infrastructure', 'contract'] },
];

function StructureOverview() {
    const [selected, setSelected] = useState('screen');
    const area = structureAreas.find(item => item.key === selected)!;
    return <>
        <div className="dp-area-choices" aria-label="責務を確認する領域">
            {structureAreas.map(item => <button key={item.key} type="button" data-structure-choice={item.key} aria-pressed={selected === item.key} aria-describedby={`dp-area-${item.key}`} onClick={() => setSelected(item.key)}>
                <strong><PhilosophyInkText text={item.label} /></strong><span id={`dp-area-${item.key}`}>{item.copy}</span><small>{item.layers}</small>
            </button>)}
        </div>
        <div key={selected} className="dp-area-result" data-structure-highlight={selected}>
            <p data-structure-description><strong>{area.label}の担当</strong> — {area.layers}</p><div className="dp-selected-layer-path" aria-label="選んだ責務の依存関係">{area.layers.split(' → ').map((layer, index) => <span key={layer}>{index > 0 && <i aria-hidden="true">→</i>}<b>{layer}</b></span>)}</div>
            <ul>{architectureResponsibilities.filter(item => area.categories.includes(item.category)).map(item => <li key={item.value}><strong>{item.technicalLabel}</strong><span>{item.description}</span></li>)}</ul>
        </div>
        <figcaption>3つは変更箇所を探すための俯瞰です。実際の責務と依存関係は、下の詳細で確認できます。</figcaption>
    </>;
}

export default function PhilosophyOverviewDiagram({ kind }: { kind: DiagramKind }) {
    const [selectedStage, setSelectedStage] = useState(0);
    return <figure data-scroll-reveal className={`dp-overview-diagram dp-overview-diagram--${kind}`} aria-label={{ roles: 'ハーネスの構造と受け渡し', structure: '画面・処理・データの責務', checks: '主張・証拠・許可・受入の違い', stages: '段階ごとの確認対象と人の判断' }[kind]}>
        {kind === 'roles' && <HarnessStructure />}
        {kind === 'structure' && <StructureOverview />}
        {kind === 'checks' && <PrincipleChoices />}
        {kind === 'stages' && <>
            <ol className="dp-simple-flow dp-stage-overview">
                {developmentStages.map((stage, index) => <li key={stage.key} data-scroll-reveal data-stage-selected={selectedStage === index}>
                    <span className="dp-overview-index">{stage.key}</span>
                    <button type="button" data-stage-choice={stage.key} aria-pressed={selectedStage === index} aria-controls="dp-stage-description" onClick={() => setSelectedStage(index)}>{['構想', '画面試作', '導線確認', '本実装'][index]}</button>
                    <span>{stage.includes.join('・')}</span><small className="dp-human-gate">{index === 3 ? '人が受入条件で判断' : '次へ進む前に、人が判断'}</small>
                </li>)}
            </ol>
            <div className="dp-stage-description" key={selectedStage} id="dp-stage-description" aria-live="polite"><strong>{developmentStages[selectedStage].label}で確かめること</strong><p>{developmentStages[selectedStage].purpose}</p><span>次へ渡す：{developmentStages[selectedStage].deliverable}</span></div>
            <figcaption>確認した成果と入出力を引き継ぎます。試作のコードが自動的に本番へ進むことはありません。</figcaption>
        </>}
    </figure>;
}
