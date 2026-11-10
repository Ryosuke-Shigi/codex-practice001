import RpgText from '@/Components/DesignPhilosophy/RpgText';
import { taskDependencyNodes } from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { TaskDependencyNode } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

const dagEdges = {
    next: { wide: 'M0 50H44', compact: 'M150 0V44' },
    fork: { wide: 'M0 50H20V24H44M20 50V76H44', compact: 'M150 0V22H75V44M150 22H225V44' },
    join: { wide: 'M0 24H23V50H44M0 76H23V50', compact: 'M75 0V22H150V44M225 0V22H150' },
};

function DagEdge({ kind }: { kind: keyof typeof dagEdges }) {
    const edge = dagEdges[kind];

    return (
        <div className={`dp-dag__edge dp-dag__edge--${kind}`} aria-hidden="true" data-dag-edge={kind}>
            <svg className="dp-dag__edge--wide" viewBox="0 0 44 100" preserveAspectRatio="none">
                <path d={edge.wide} pathLength="1" />
            </svg>
            <svg className="dp-dag__edge--compact" viewBox="0 0 300 44" preserveAspectRatio="none">
                <path d={edge.compact} pathLength="1" />
            </svg>
        </div>
    );
}

function DagNode({ node }: { node: TaskDependencyNode }) {
    return (
        <div className="dp-dag__node" data-dag-lane={node.lane}>
            <RpgText as="strong">{node.title}</RpgText>
            <RpgText as="small">{node.dependency}</RpgText>
        </div>
    );
}

export default function TaskDependencyGraph() {
    // 現行DAGは調査、分割、A/Bの分岐、統合の順で定義されています。
    const [research, split, branchA, branchB, merge] = taskDependencyNodes;

    return (
        <div className="dp-dag__map">
            <DagNode node={research} />
            <DagEdge kind="next" />
            <DagNode node={split} />
            <DagEdge kind="fork" />
            <div className="dp-dag__branches" role="group" aria-label="Task分割に依存する実装Task">
                <DagNode node={branchA} />
                <DagNode node={branchB} />
            </div>
            <DagEdge kind="join" />
            <DagNode node={merge} />
        </div>
    );
}
