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

export type Principle = {
    title: string;
    description: string;
    signal: string;
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
        | 'output';
};

export type DevelopmentStage = {
    key: 'IDEA BOARD' | 'MOCK' | 'PROTOTYPE' | 'PRODUCT';
    label: string;
    purpose: string;
    includes: string[];
    excludes: string[];
    deliverable: string;
    completion: string;
    optional: boolean;
};

export type QualityGate = {
    title: string;
    description: string;
    check: string;
};

export type ImprovementStep = {
    step: number;
    title: string;
    description: string;
};
