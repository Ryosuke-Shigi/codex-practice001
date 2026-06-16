import DocumentPreviewPanel from './DocumentPreviewPanel';
import type { DocumentType, Project } from './mockData';
import { documentTypeTabs } from './mockData';

type DocumentWorkspacePanelProps = {
    project: Project;
    activeDocumentType: DocumentType;
    onDocumentTypeChange: (documentType: DocumentType) => void;
};

export default function DocumentWorkspacePanel({
    project,
    activeDocumentType,
    onDocumentTypeChange,
}: DocumentWorkspacePanelProps) {
    return (
        <section className="grid gap-3">
            <div className="rounded-lg border border-amber-200 bg-white p-1 shadow-sm">
                <div
                    aria-label="書類切り替え"
                    className="grid grid-cols-3 gap-1"
                >
                    {documentTypeTabs.map((tab) => {
                        const isActive = tab.key === activeDocumentType;

                        return (
                            <button
                                key={tab.key}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => onDocumentTypeChange(tab.key)}
                                className={[
                                    'min-h-9 rounded-md border px-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-100 sm:text-sm',
                                    isActive
                                        ? 'border-amber-600 bg-amber-600 text-white'
                                        : 'border-amber-100 bg-white text-amber-900 hover:bg-amber-50',
                                ].join(' ')}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <DocumentPreviewPanel
                documentType={activeDocumentType}
                project={project}
            />
        </section>
    );
}
