import {
    createElement,
    type ComponentType,
} from 'react';

import AiDevelopmentFlow from '@/Components/DesignPhilosophy/AiDevelopmentFlow';
import ArchitectureMap from '@/Components/DesignPhilosophy/ArchitectureMap';
import ClosingStatement from '@/Components/DesignPhilosophy/ClosingStatement';
import DevelopmentStages from '@/Components/DesignPhilosophy/DevelopmentStages';
import Hero from '@/Components/DesignPhilosophy/Hero';
import HumanAiRoles from '@/Components/DesignPhilosophy/HumanAiRoles';
import ImprovementLoop from '@/Components/DesignPhilosophy/ImprovementLoop';
import Principles from '@/Components/DesignPhilosophy/Principles';
import QualityGates from '@/Components/DesignPhilosophy/QualityGates';
import type {
    DesignPhilosophySection as DesignPhilosophySectionData,
    DesignPhilosophySectionKey,
} from '@/Components/DesignPhilosophy/designPhilosophyTypes';

type SectionRendererProps = {
    section: DesignPhilosophySectionData;
};

const sectionRegistry: Record<
    DesignPhilosophySectionKey,
    ComponentType<SectionRendererProps>
> = {
    hero: Hero,
    principles: Principles,
    'human-ai-roles': HumanAiRoles,
    'ai-development-flow': AiDevelopmentFlow,
    architecture: ArchitectureMap,
    'development-stages': DevelopmentStages,
    'quality-gates': QualityGates,
    'improvement-loop': ImprovementLoop,
    closing: ClosingStatement,
};

export default function DesignPhilosophySection({
    section,
}: SectionRendererProps) {
    return createElement(sectionRegistry[section.key], { section });
}
