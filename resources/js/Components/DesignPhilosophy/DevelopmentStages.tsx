import { CircleCheck, FlaskConical, Layers3, Lightbulb } from 'lucide-react';

import SectionHeading from '@/Components/DesignPhilosophy/SectionHeading';
import { developmentStages } from '@/Components/DesignPhilosophy/designPhilosophyData';
import type { DesignPhilosophySection } from '@/Components/DesignPhilosophy/designPhilosophyTypes';

const stageIcons = [Lightbulb, Layers3, FlaskConical, CircleCheck];

export default function DevelopmentStages({
    section,
}: {
    section: DesignPhilosophySection;
}) {
    return (
        <section
            id={section.key}
            aria-labelledby={`design-philosophy-${section.key}`}
            className="dp-section dp-section--stages"
        >
            <div className="dp-shell">
                <SectionHeading section={section} />

                <div className="dp-stage-grid" data-stage-cards>
                    {developmentStages.map((stage, index) => {
                        const Icon = stageIcons[index];

                        return (
                            <article
                                key={stage.key}
                                className="dp-card dp-stage-card dp-reveal"
                                data-tilt
                            >
                                <div className="dp-stage-card__top">
                                    <span>
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <Icon aria-hidden="true" />
                                </div>
                                <p>{stage.key}</p>
                                <h3>{stage.label}</h3>
                                <strong>
                                    {stage.optional ? '必要時に選択' : '基本工程'}
                                </strong>
                                <dl className="dp-stage-card__comparison">
                                    <div>
                                        <dt>目的</dt>
                                        <dd>{stage.purpose}</dd>
                                    </div>
                                    <div>
                                        <dt>扱うもの</dt>
                                        <dd>
                                            <ul>
                                                {stage.includes.map((item) => (
                                                    <li key={item}>{item}</li>
                                                ))}
                                            </ul>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>扱わないもの</dt>
                                        <dd>
                                            <ul>
                                                {stage.excludes.map((item) => (
                                                    <li key={item}>{item}</li>
                                                ))}
                                            </ul>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>成果</dt>
                                        <dd>{stage.deliverable}</dd>
                                    </div>
                                    <div>
                                        <dt>完了条件</dt>
                                        <dd>{stage.completion}</dd>
                                    </div>
                                </dl>
                            </article>
                        );
                    })}
                </div>

                <div className="dp-stage-table-wrap dp-reveal">
                    <table data-stage-table>
                        <caption>
                            4つの開発段階における目的、扱うもの、扱わないもの、成果、完了条件
                        </caption>
                        <thead>
                            <tr>
                                <th scope="col">段階</th>
                                <th scope="col">目的</th>
                                <th scope="col">扱うもの</th>
                                <th scope="col">扱わないもの</th>
                                <th scope="col">成果</th>
                                <th scope="col">完了条件</th>
                            </tr>
                        </thead>
                        <tbody>
                            {developmentStages.map((stage) => (
                                <tr key={stage.key}>
                                    <th scope="row">
                                        <span>{stage.key}</span>
                                        <small>{stage.label}</small>
                                    </th>
                                    <td data-label="目的">{stage.purpose}</td>
                                    <td data-label="扱うもの">
                                        <ul>
                                            {stage.includes.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td data-label="扱わないもの">
                                        <ul>
                                            {stage.excludes.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td data-label="成果">
                                        {stage.deliverable}
                                    </td>
                                    <td data-label="完了条件">
                                        {stage.completion}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
