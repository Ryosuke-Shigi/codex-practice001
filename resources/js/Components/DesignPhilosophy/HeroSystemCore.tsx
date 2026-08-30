import RpgText from '@/Components/DesignPhilosophy/RpgText';
import { zeroTrustPath } from '@/Components/DesignPhilosophy/designPhilosophyData';

export default function HeroSystemCore() {
    return (
        <figure
            className="dp-system-core"
            data-diagram="control-plane"
            data-hero-system-core
            data-structure-motion="hero-path"
        >
            <div aria-hidden="true" className="dp-system-core__grid" />
            <div className="dp-system-core__heading">
                <RpgText className="dp-technical">CONTROL PLANE / DP-ZT-01</RpgText>
                <RpgText as="strong">信用ではなく、境界とEvidenceで接続する</RpgText>
            </div>
            <ol aria-label="CODEXゼロトラスト設計の責務順序" className="dp-system-core__path">
                {zeroTrustPath.map((node, index) => (
                    <li
                        key={node.label}
                        data-control-node={`control-${index + 1}`}
                        data-diagram-node={node.label}
                    >
                        <RpgText className="dp-card__index">
                            {String(index + 1).padStart(2, '0')}
                        </RpgText>
                        <RpgText as="strong">{node.label}</RpgText>
                        <RpgText as="small">{node.description}</RpgText>
                        {index < zeroTrustPath.length - 1 && (
                            <span
                                aria-hidden="true"
                                className="dp-diagram-edge dp-diagram-edge--down"
                                data-diagram-edge
                            />
                        )}
                    </li>
                ))}
            </ol>
            <figcaption className="dp-diagram-caption">
                <RpgText>
                    Human authorityからHuman judgmentへ、契約・実行・Evidence・独立確認を通って制御を戻す経路。
                </RpgText>
            </figcaption>
        </figure>
    );
}
