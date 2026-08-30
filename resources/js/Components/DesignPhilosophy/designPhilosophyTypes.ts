export type DesignPhilosophySectionKey =
    | 'hero'
    | 'principles'
    | 'human-ai-roles'
    | 'ai-development-flow'
    | 'architecture'
    | 'development-stages'
    | 'quality-gates'
    | 'improvement-loop'
    | 'closing';

export type DesignPhilosophySection = {
    key: DesignPhilosophySectionKey;
    sortOrder: number;
    eyebrow: string;
    title: string;
    lead: string;
    body: string;
};

export type TaskContractItem = {
    title: string;
    description: string;
    group: 'intent' | 'boundary' | 'acceptance';
};

export type BlueprintNode = {
    label: string;
    description: string;
};

export type PublicRole = {
    label: string;
    title: string;
    description: string;
    responsibility: string;
};

export type AiDevelopmentStep = {
    step: number;
    title: string;
    description: string;
    owner: string;
    handoff: string;
};

export type TaskDependencyNode = {
    title: string;
    dependency: string;
    lane: 'root' | 'branch' | 'merge';
};

export type ArchitectureLayer = {
    key: 'Action' | 'Domain' | 'Responder';
    title: string;
    description: string;
};

export type ArchitectureResponsibility = {
    value: string;
    technicalLabel: string;
    description: string;
    category:
        | 'entry'
        | 'application'
        | 'domain'
        | 'infrastructure'
        | 'contract'
        | 'side-effect'
        | 'read-side'
        | 'presentation';
};

export type DevelopmentStage = {
    key: 'IDEA BOARD' | 'MOCK' | 'PROTOTYPE' | 'PRODUCT';
    label: string;
    purpose: string;
    includes: string[];
    excludes: string[];
    deliverable: string;
};

export type EvidenceType = {
    title: string;
    description: string;
    boundary: string;
};

export type ImprovementStep = {
    step: number;
    title: string;
    description: string;
};
