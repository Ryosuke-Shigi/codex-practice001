import RpgText from '@/Components/DesignPhilosophy/RpgText';
import { zeroTrustPath } from '@/Components/DesignPhilosophy/designPhilosophyData';

export default function HeroSystemCore() {
    return (
        <div
            className="dp-system-core"
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
                    <li key={node.label} data-control-node>
                        <RpgText className="dp-card__index">
                            {String(index + 1).padStart(2, '0')}
                        </RpgText>
                        <RpgText as="strong">{node.label}</RpgText>
                        <RpgText as="small">{node.description}</RpgText>
                    </li>
                ))}
            </ol>
        </div>
    );
}
