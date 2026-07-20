export type DesignPhilosophySectionKey =
    | 'hero'
    | 'principles'
    | 'architecture'
    | 'development-stages'
    | 'human-ai-flow'
    | 'subagents'
    | 'engineering-loop'
    | 'understanding-reboot'
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
    details: string[];
};

export type ArchitectureLayer = {
    key: 'Action' | 'Domain' | 'Responder';
    title: string;
    description: string;
    responsibilities: string[];
};

export type DevelopmentStage = {
    key: 'IDEA BOARD' | 'MOCK' | 'PROTOTYPE' | 'PRODUCT';
    label: string;
    description: string;
    details: string[];
    optional: boolean;
};

export type HumanAiActor = {
    label: string;
    title: string;
    description: string;
    responsibilities: string[];
    primary: boolean;
};

export type SubagentFilterKey = 'all' | 'discover' | 'implement' | 'verify';

export type SubagentDefinition = {
    name: string;
    group: Exclude<SubagentFilterKey, 'all'>;
    groupLabel: string;
    roleLabel: string;
    description: string;
};

export type EngineeringLoopStep = {
    title: string;
    description: string;
};
