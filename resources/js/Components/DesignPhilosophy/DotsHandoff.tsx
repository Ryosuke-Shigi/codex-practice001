import RpgText from '@/Components/DesignPhilosophy/RpgText';

function Exchange({
    className,
    connection,
    labels,
}: {
    className: string;
    connection: string;
    labels: string;
}) {
    return (
        <div className={`dp-dots-panel__exchange ${className}`} data-scroll-reveal>
            <div className="dp-dots-panel__exchange-label">
                <RpgText as="strong">{connection}</RpgText>
                <RpgText as="small">{labels}</RpgText>
            </div>
        </div>
    );
}

export default function DotsHandoff() {
    return (
        <figure
            aria-labelledby="design-philosophy-dots-handoff"
            className="dp-paper-card dp-dots-panel"
            data-diagram="dots-handoff"
        >
            <RpgText as="h3" id="design-philosophy-dots-handoff">
                dotsを介した技術相談と開発
            </RpgText>
            <RpgText as="p">
                8段階図は作業の順序を示し、この図は誰が何を受け渡すかを示します。
            </RpgText>

            <div className="dp-dots-panel__network">
                <div className="dp-dots-panel__group">
                    <RpgText as="strong" className="dp-dots-panel__group-title">
                        相談の往復
                    </RpgText>
                    <RpgText as="strong" className="dp-dots-panel__node dp-dots-panel__dots">
                        dots
                    </RpgText>
                    <Exchange
                        className="dp-dots-panel__work-link"
                        connection="dots ↔ ChatGPT Work"
                        labels="相談事項／仕様・判断材料"
                    />
                    <RpgText as="strong" className="dp-dots-panel__node dp-dots-panel__work">
                        ChatGPT Work
                    </RpgText>
                    <Exchange
                        className="dp-dots-panel__codex-link"
                        connection="dots ↔ Codex"
                        labels="作業依頼／調査・実装・検証結果"
                    />
                    <RpgText as="strong" className="dp-dots-panel__node dp-dots-panel__codex">
                        Codex
                    </RpgText>
                </div>
                <div className="dp-dots-panel__group">
                    <RpgText as="strong" className="dp-dots-panel__group-title">
                        本人への報告
                    </RpgText>
                    <Exchange
                        className="dp-dots-panel__report-link"
                        connection="本人 ↔ dots"
                        labels="方針・優先順位／進捗・残件"
                    />
                    <div className="dp-dots-panel__node dp-dots-panel__human">
                        <RpgText as="strong">本人</RpgText>
                        <RpgText as="small" className="dp-dots-panel__decision">
                            最終判断
                        </RpgText>
                    </div>
                </div>
            </div>

            <RpgText as="p">
                本人とdotsが目的・優先順位・進行を確認します。ChatGPT Workは技術相談と仕様整理を担い、Codexは許可された範囲で調査・実装・検証します。dotsは相談と結果を中継し、確認できたこと、未確認事項、判断が必要な点を本人に要約します。開発上の採否は本人が判断し、操作に必要な許可は別途確認します。
            </RpgText>
            <figcaption className="dp-dots-panel__note">
                <RpgText as="small">Notionは経過をまとめて保存</RpgText>
            </figcaption>
        </figure>
    );
}
