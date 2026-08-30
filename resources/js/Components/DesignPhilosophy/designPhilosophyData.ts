import type {
    AiDevelopmentStep,
    ArchitectureLayer,
    ArchitectureResponsibility,
    BlueprintNode,
    DevelopmentStage,
    EvidenceType,
    ImprovementStep,
    PublicRole,
    TaskContractItem,
    TaskDependencyNode,
} from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export const heroSignals = [
    'ZERO IMPLICIT TRUST',
    'BOUNDED EXECUTION',
    'EVIDENCE BEFORE ACCEPTANCE',
    'HUMAN AUTHORITY',
] as const;

export const zeroTrustPath: BlueprintNode[] = [
    {
        label: 'Human intent / authority',
        description: '目的と操作許可を人間が与える',
    },
    { label: 'Task Contract', description: '範囲・停止・受入条件を固定する' },
    { label: 'bounded Writer', description: '許可された差分だけを作る' },
    { label: 'Evidence', description: '自己申告と実測を分けて残す' },
    {
        label: 'Verification / Review',
        description: '実装担当から分離して測定・照合する',
    },
    { label: 'Parent integration', description: '正本・差分・結果を統合する' },
    { label: 'Human judgment', description: '最終Acceptanceを人間へ戻す' },
];

export const aiFailureModes: BlueprintNode[] = [
    { label: '誤読', description: '意図や正本を別の意味へ置き換える' },
    { label: '省略', description: '必要な条件や検証を落とす' },
    { label: '過剰実装', description: '許可されていない範囲まで広げる' },
    { label: '誤報告', description: '未確認を成功したように扱う' },
];

export const trustFrame: BlueprintNode[] = [
    { label: 'Claim', description: 'AIや作業者が述べたこと' },
    { label: 'Evidence', description: '独立して確認できる事実' },
    { label: 'Authority', description: '誰が何を許可できるか' },
    { label: 'Acceptance', description: 'Evidenceを基にした完成判断' },
];

export const taskContractItems: TaskContractItem[] = [
    {
        title: '目的',
        description: '今回達成する結果を固定する。',
        group: 'intent',
    },
    {
        title: '範囲',
        description: 'Taskが扱う境界を固定する。',
        group: 'intent',
    },
    {
        title: '変更対象',
        description: '編集してよい成果物を特定する。',
        group: 'boundary',
    },
    {
        title: '変更禁止',
        description: '触れない領域を先に分離する。',
        group: 'boundary',
    },
    {
        title: '停止条件',
        description: '推測せず人間へ戻す地点を定める。',
        group: 'boundary',
    },
    {
        title: '操作許可',
        description: '外部変更やGit操作の権限を分ける。',
        group: 'boundary',
    },
    {
        title: '成功条件',
        description: '完了を判断するEvidenceを定める。',
        group: 'acceptance',
    },
    {
        title: '失敗条件',
        description: '成功へ読み替えない状態を定める。',
        group: 'acceptance',
    },
    {
        title: '検証 / Review経路',
        description: '誰が何を確認するかを定める。',
        group: 'acceptance',
    },
];

export const publicRoles: PublicRole[] = [
    {
        label: 'AUTHORITY',
        title: 'Human',
        description: '目的、優先順位、操作許可、採否、完成を判断します。',
        responsibility: '最終判断',
    },
    {
        label: 'INTEGRATE',
        title: 'Parent',
        description: '契約、依存関係、順序、停止条件を統合します。',
        responsibility: 'Task統合',
    },
    {
        label: 'IMPLEMENT',
        title: 'Writer',
        description: '固定された所有範囲を、同時最大1体で編集します。',
        responsibility: '単一の差分',
    },
    {
        label: 'VERIFY',
        title: 'Verifier',
        description: '登録された方法で結果と副作用を測定します。',
        responsibility: '実行結果の確認',
    },
    {
        label: 'REVIEW',
        title: 'Reviewer',
        description: '指示、正本、差分、検証結果を独立して照合します。',
        responsibility: '完成前の照合',
    },
];

export const singleWriterRules = [
    '親を含め同時writer最大1',
    'repository-wideで同時最大1',
    'read-heavy独立作業だけを条件付き並列',
    'writer作業は直列',
    'Verifier / Reviewer中はwriter停止',
] as const;

export const writerBoundaries = [
    '自分でAcceptanceを決めない',
    'Verifierを兼ねたことにしない',
    'Reviewerを兼ねたことにしない',
    'Human judgmentを代替しない',
] as const;

export const authorityBoundaries: BlueprintNode[] = [
    {
        label: 'Capability',
        description: 'toolやroleが実行可能な能力。許可そのものではない。',
    },
    {
        label: 'Operation Authority',
        description: 'そのTaskで特定の操作をしてよい明示的な許可。',
    },
];

export const aiDevelopmentSteps: AiDevelopmentStep[] = [
    {
        step: 1,
        title: '契約固定',
        description: '目的、範囲、禁止、停止、許可、検証経路を固定します。',
        owner: 'Human / Parent',
        handoff: '固定済みTask Contract',
    },
    {
        step: 2,
        title: '証拠駆動調査',
        description: '正本、コード、テスト、実測を分けて確認します。',
        owner: 'Read-only exploration',
        handoff: '出典つきEvidence',
    },
    {
        step: 3,
        title: '親統合 / Task分割',
        description: '依存関係と完了可能なTask境界を固定します。',
        owner: 'Parent',
        handoff: '依存関係とTask境界',
    },
    {
        step: 4,
        title: 'Task実行ループ',
        description: '必要な専門性を選び、Single Writerで差分を作ります。',
        owner: 'Specialist / Writer',
        handoff: '差分とTask内Evidence',
    },
    {
        step: 5,
        title: '検証済みTask checkpoint',
        description:
            'Task Contractで選択した検証主体が、Task単位の結果と未確認事項を確認します。',
        owner: 'Task Contract',
        handoff: '検証済みcheckpoint',
    },
    {
        step: 6,
        title: '統合検証',
        description: '依存Taskを統合し、全体の回帰と副作用を確認します。',
        owner: 'Parent / Verifier',
        handoff: '統合Evidence',
    },
    {
        step: 7,
        title: 'Review / 改善評価',
        description:
            'Reviewerが指示、正本、差分、Evidence、Findingを照合し、改善候補は現在のTask Contract内で評価します。',
        owner: 'Reviewer / Task Contract',
        handoff: 'Findingと未確認事項',
    },
    {
        step: 8,
        title: '最終Acceptance',
        description: 'Evidenceと未確認事項を分け、人間が完成を判断します。',
        owner: 'Human',
        handoff: 'Acceptance / Stop',
    },
];

export const taskDependencyNodes: TaskDependencyNode[] = [
    { title: '基礎調査', dependency: '開始', lane: 'root' },
    { title: 'Task分割', dependency: '基礎調査に依存', lane: 'root' },
    { title: '実装Task A', dependency: 'Task分割に依存', lane: 'branch' },
    { title: '実装Task B', dependency: 'Task分割に依存', lane: 'branch' },
    {
        title: '統合検証',
        dependency: 'A / Bの検証済みcheckpointに依存',
        lane: 'merge',
    },
];

export const architectureLayers: ArchitectureLayer[] = [
    {
        key: 'Action',
        title: 'ユースケースを進める',
        description: '一つの目的に必要な処理順序を制御します。',
    },
    {
        key: 'Domain',
        title: '業務の意味を守る',
        description: '必要なService、Repository、DTO等を配置します。',
    },
    {
        key: 'Responder',
        title: '出力を整える',
        description: '結果をInertia propsやJSON等へ整形します。',
    },
];

export const architectureResponsibilities: ArchitectureResponsibility[] = [
    {
        value: '入口',
        technicalLabel: 'Route / Controller / Request',
        description: 'HTTPの受付と入力形式の検証。業務判断はしない。',
        category: 'entry',
    },
    {
        value: 'use case',
        technicalLabel: 'Command Action / Query Action',
        description: '一つの目的に必要な手順を担当します。',
        category: 'application',
    },
    {
        value: 'domain / rule',
        technicalLabel: 'Service / Strategy',
        description: '業務判断と必要な処理差分を担当します。',
        category: 'domain',
    },
    {
        value: 'I/O',
        technicalLabel: 'Repository',
        description: 'DBや外部データソースとの境界を担当します。',
        category: 'infrastructure',
    },
    {
        value: 'data contract',
        technicalLabel: 'DTO / ListDTO',
        description: 'レイヤー間で運ぶ値の形を固定します。',
        category: 'contract',
    },
    {
        value: 'side effect',
        technicalLabel: 'Event / Listener / Job',
        description: '事実、副作用、非同期実行を本体から分けます。',
        category: 'side-effect',
    },
    {
        value: 'read side',
        technicalLabel: 'Query Action / Output DTO',
        description: '参照ユースケースの取得と出力契約を分けます。',
        category: 'read-side',
    },
    {
        value: 'presentation',
        technicalLabel: 'Responder / Page / Feature Component',
        description: '出力整形、表示、画面内UI状態を担当します。',
        category: 'presentation',
    },
];

export const architectureGuardrails = [
    'Repositoryに業務判断を置かない',
    'ServiceにDB都合を置かない',
    'Componentに業務判断を置かない',
] as const;

export const developmentStages: DevelopmentStage[] = [
    {
        key: 'IDEA BOARD',
        label: '構想',
        purpose: '利用者、課題、機能候補、未確定事項を整理する。',
        includes: ['目的', '利用場面', '未確定事項'],
        excludes: ['完成仕様の断定'],
        deliverable: '構想と問い',
    },
    {
        key: 'MOCK',
        label: '画面単体',
        purpose: '固定データでUI構造、状態、操作感を確認する。',
        includes: ['UI契約', '表示幅', '主要状態'],
        excludes: ['DB保存', '本番業務判断'],
        deliverable: '画面のUI契約',
    },
    {
        key: 'PROTOTYPE',
        label: '導線',
        purpose: '画面間の接続、操作順、仮のデータ流れを確認する。',
        includes: ['画面間接続', '仮データ', '状態の受け渡し'],
        excludes: ['本番業務ロジック', '正式DB設計'],
        deliverable: '導線と入出力候補',
    },
    {
        key: 'PRODUCT',
        label: '本実装',
        purpose: '仕様、責務、データ境界、テストを固定する。',
        includes: ['本データ', '責務分離', '検証'],
        excludes: ['未確認仕様の補完', '仮処理の流用'],
        deliverable: '製品コードとEvidence',
    },
];

export const evidenceTypes: EvidenceType[] = [
    {
        title: 'Static',
        description: 'コード、型、設定、静的checkerで確認した事実。',
        boundary: 'Runtime成功へ読み替えない',
    },
    {
        title: 'Installed',
        description: '依存やtoolが導入され、呼び出せる状態。',
        boundary: '実行結果へ読み替えない',
    },
    {
        title: 'Runtime',
        description:
            '実行中に観測したeffective stateやruntime metadataなどの実測結果。',
        boundary: '設定値やInstalledの確認から推測しない',
    },
    {
        title: 'Browser',
        description: 'URL、viewport、操作を固定した実画面の結果。',
        boundary: 'Screenshotだけで完了にしない',
    },
    {
        title: 'Verification / Review',
        description: '実装担当から分離した検証と照合。',
        boundary: 'Human Reviewへ読み替えない',
    },
    {
        title: 'Human Review',
        description: '採否、完成、最終visualを人間が判断する。',
        boundary: '他のEvidenceで代替しない',
    },
];

export const failClosedConditions = [
    'Evidence不足',
    'identity mismatch',
    'stale / drift',
    'permission不足',
    '正本衝突',
    'unknown state',
    '人間判断が必要',
] as const;

export const closingAuthorityPath: BlueprintNode[] = [
    { label: 'Capability', description: '実行できる' },
    { label: 'Operation Authority', description: 'この操作をしてよい' },
    { label: 'Evidence', description: '何が確認できたか' },
    {
        label: 'Human Judgment',
        description: '実行・停止・Acceptanceを判断する',
    },
];

export const improvementSteps: ImprovementStep[] = [
    { step: 1, title: 'Finding', description: '違和感、失敗、手戻りを捕捉する。' },
    { step: 2, title: 'Evidence', description: '期待値、設定値、実測を分けて集める。' },
    { step: 3, title: 'root cause', description: '症状ではなく発生源を特定する。' },
    { step: 4, title: 'scope', description: '影響範囲と非対象を固定する。' },
    { step: 5, title: 'owner', description: '修正と判断の責務を割り当てる。' },
    { step: 6, title: 'Fix', description: '固定した範囲へ最小の修正を行う。' },
    { step: 7, title: 'Verify', description: '同じEvidence経路で再確認する。' },
    { step: 8, title: 'Feedback', description: '再発防止の正本へ知見を戻す。' },
];

export const feedbackDestinations = [
    'Code',
    'Test',
    'Type',
    'Docs',
    'Policy',
    'Checker',
    'Sensors',
    'Harness',
] as const;
