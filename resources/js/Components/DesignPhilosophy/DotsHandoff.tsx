import RpgText from './RpgText';

export default function DotsHandoff() {
    return <aside className="dp-paper-card dp-consultation" aria-label="技術相談と進行管理の役割">
        <h3>相談と進行をつなぐ</h3>
        <dl><div><dt>開発者</dt><dd>目的・方針・優先順位と、開発上の採否を判断します。</dd></div><div><dt>進行管理</dt><dd>相談事項と作業依頼を受け渡し、進捗・残件・判断が必要な点をまとめます。</dd></div><div><dt>技術相談</dt><dd>仕様と技術上の選択肢を整理し、判断材料を返します。</dd></div><div><dt>実装・検証・レビュー担当</dt><dd>許可された役割の範囲で作業し、確認できたことと未確認事項を返します。</dd></div></dl>
        <RpgText as="p">経過は記録へまとめ、次の担当に引き継ぎます。開発上の採否と、外部操作に必要な許可は分けて確認します。</RpgText>
    </aside>;
}