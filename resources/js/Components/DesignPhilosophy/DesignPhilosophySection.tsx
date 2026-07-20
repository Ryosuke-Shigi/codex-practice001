import ArchitectureMap from '@/Components/DesignPhilosophy/ArchitectureMap';
import ClosingStatement from '@/Components/DesignPhilosophy/ClosingStatement';
import DevelopmentStages from '@/Components/DesignPhilosophy/DevelopmentStages';
import EngineeringLoop from '@/Components/DesignPhilosophy/EngineeringLoop';
import Hero from '@/Components/DesignPhilosophy/Hero';
import HumanAiFlow from '@/Components/DesignPhilosophy/HumanAiFlow';
import Principles from '@/Components/DesignPhilosophy/Principles';
import SubagentCatalog from '@/Components/DesignPhilosophy/SubagentCatalog';
import UnderstandingReboot from '@/Components/DesignPhilosophy/UnderstandingReboot';
import type { DesignPhilosophySection as DesignPhilosophySectionData } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

function assertNever(key: never): never {
    throw new Error(`Unsupported design philosophy section key: ${key}`);
}

export default function DesignPhilosophySection({
    section,
}: {
    section: DesignPhilosophySectionData;
}) {
    switch (section.key) {
        case 'hero':
            return <Hero section={section} />;
        case 'principles':
            return <Principles section={section} />;
        case 'architecture':
            return <ArchitectureMap section={section} />;
        case 'development-stages':
            return <DevelopmentStages section={section} />;
        case 'human-ai-flow':
            return <HumanAiFlow section={section} />;
        case 'subagents':
            return <SubagentCatalog section={section} />;
        case 'engineering-loop':
            return <EngineeringLoop section={section} />;
        case 'understanding-reboot':
            return <UnderstandingReboot section={section} />;
        case 'closing':
            return <ClosingStatement section={section} />;
        default:
            return assertNever(section.key);
    }
}
