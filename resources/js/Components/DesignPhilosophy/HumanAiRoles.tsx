import RpgText from '@/Components/DesignPhilosophy/RpgText';
import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import {
    authorityBoundaries,
    publicRoles,
    singleWriterRules,
    writerBoundaries,
} from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

function RuleList({ items }: { items: readonly string[] }) {
    return (
        <ul>
            {items.map((item) => (
                <li key={item}>
                    <RpgText>{item}</RpgText>
                </li>
            ))}
        </ul>
    );
}

const roleEdges = [
    { from: 'Human', to: 'Parent', kind: 'authority' },
    { from: 'Parent', to: 'Writer', kind: 'delegation' },
    { from: 'Writer', to: 'Verifier', kind: 'verify-branch' },
    { from: 'Writer', to: 'Reviewer', kind: 'review-branch' },
    { from: 'Verifier', to: 'Parent', kind: 'verification-return' },
    { from: 'Reviewer', to: 'Parent', kind: 'review-return' },
    { from: 'Parent', to: 'Human', kind: 'judgment-return' },
] as const;

function RoleEdges({ compact = false }: { compact?: boolean }) {
    const paths = compact
        ? [
              'M50 85V100',
              'M50 185V200',
              'M50 285V300',
              'M100 250H103V450H100',
              'M0 350H-3V150H0',
              'M0 450H-4V150H0',
              'M0 150H-5V50H0',
          ]
        : [
              'M90 100H105',
              'M190 100H205',
              'M295 85H300V50H305',
              'M295 115H300V150H305',
              'M350 0V-5H150V0',
              'M350 200V205H150V200',
              'M150 0V-8H50V0',
          ];

    return (
        <svg
            aria-hidden="true"
            className={`dp-role-edges dp-role-edges--${compact ? 'compact' : 'wide'}`}
            preserveAspectRatio="none"
            viewBox={compact ? '0 0 100 500' : '0 0 400 200'}
        >
            <defs>
                <marker
                    id={`dp-role-arrow-${compact ? 'compact' : 'wide'}`}
                    markerHeight="6"
                    markerWidth="6"
                    orient="auto"
                    refX="5"
                    refY="3"
                    viewBox="0 0 6 6"
                >
                    <path d="M0 0L6 3L0 6Z" />
                </marker>
            </defs>
            {roleEdges.map((edge, index) => (
                <path
                    aria-hidden="true"
                    key={edge.kind}
                    d={paths[index]}
                    data-diagram-edge
                    data-edge-id={edge.kind}
                    data-edge-from={edge.from}
                    data-edge-kind={edge.kind}
                    data-edge-to={edge.to}
                    markerEnd={`url(#dp-role-arrow-${compact ? 'compact' : 'wide'})`}
                />
            ))}
        </svg>
    );
}

export default function HumanAiRoles({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <section
            id={section.key}
            aria-labelledby={`design-philosophy-${section.key}`}
            className="dp-section dp-section--roles"
            data-rpg-section
        >
            <div className="dp-shell">
                <SectionHeading section={section} />

                <figure
                    className="dp-role-lanes"
                    data-diagram="responsibility-lanes"
                >
                    <div className="dp-role-map">
                        <ol className="dp-role-grid" data-structure-motion="role-rail">
                            {publicRoles.map((role, index) => (
                                <li key={role.title} data-diagram-node={role.title}>
                                    <article className="dp-paper-card dp-role-card">
                                        <RpgText className="dp-card__index">
                                            {String(index + 1).padStart(2, '0')}
                                        </RpgText>
                                        <RpgText className="dp-technical">
                                            {role.label}
                                        </RpgText>
                                        <RpgText as="h3">{role.title}</RpgText>
                                        <RpgText as="p">{role.description}</RpgText>
                                        <RpgText as="strong">
                                            {role.responsibility}
                                        </RpgText>
                                    </article>
                                </li>
                            ))}
                        </ol>
                        <RoleEdges />
                        <RoleEdges compact />
                    </div>
                    <figcaption className="dp-diagram-caption">
                        <RpgText>
                            Humanが権限を与え、Parentが統合し、Single Writerの後にVerifierとReviewerが独立経路で確認する責務レーン。
                        </RpgText>
                    </figcaption>
                </figure>

                <div className="dp-writer-layout">
                    <article
                        className="dp-blueprint-panel dp-writer-lease"
                        data-structure-motion="writer-lease"
                    >
                        <RpgText className="dp-technical">WRITER LEASE</RpgText>
                        <RpgText as="h3">repository-wide Single Writer</RpgText>
                        <RuleList items={singleWriterRules} />
                    </article>
                    <article className="dp-blueprint-panel dp-writer-boundary">
                        <RpgText className="dp-technical">WRITER IS NOT THE JUDGE</RpgText>
                        <RpgText as="h3">Writerが越えない4つの境界</RpgText>
                        <RuleList items={writerBoundaries} />
                    </article>
                </div>

                <div className="dp-authority-split">
                    <div className="dp-authority-split__heading">
                        <RpgText className="dp-technical">
                            CAPABILITY ≠ AUTHORITY
                        </RpgText>
                        <RpgText as="h3">できることと、してよいことを分ける</RpgText>
                    </div>
                    <ol>
                        {authorityBoundaries.map((boundary) => (
                            <li key={boundary.label}>
                                <RpgText as="strong">{boundary.label}</RpgText>
                                <RpgText as="p">{boundary.description}</RpgText>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
