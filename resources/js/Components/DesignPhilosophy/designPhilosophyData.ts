import type {
    AiDevelopmentStep,
    ArchitectureLayer,
    ArchitectureResponsibility,
    DevelopmentStage,
    EvidenceType,
    ImprovementStep,
    NamedFact,
    PublicRole,
    TaskContractItem,
    TaskDependencyNode,
} from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export const heroSignals = [
    '人間主導',
    'Task Contract',
    'Single Writer',
    '独立検証',
    'Evidence分離',
    'Finding還元',
] as const;

export const taskContractItems: TaskContractItem[] = [
    { title: '目的', description: '今回達成する結果を固定する。' },
    { title: '範囲', description: 'Taskが扱う境界を固定する。' },
    { title: '変更対象', description: '編集してよい成果物を特定する。' },
    { title: '変更禁止', description: '触れない領域を先に分離する。' },
    { title: '成功条件', description: '完了を判断するEvidenceを定める。' },
    { title: '失敗条件', description: '成功へ読み替えない状態を定める。' },
    { title: '停止条件', description: '推測せず人間へ戻す地点を定める。' },
    { title: '操作許可', description: '外部変更やGit操作の権限を分ける。' },
    { title: '検証 / Review経路', description: '誰が何を確認するかを定める。' },
];

export const publicRoles: PublicRole[] = [
    {
        label: 'DECIDE',
        title: '人間',
        description: '目的、優先順位、操作許可、採否、完成を判断します。',
        responsibility: '最終判断',
    },
    {
        label: 'TRANSLATE',
        title: 'ChatGPT',
        description: '対話を、境界と受入条件のあるTaskへ整理します。',
        responsibility: '意図の構造化',
    },
    {
        label: 'ORCHESTRATE',
        title: '親Agent',
        description: '契約、依存関係、順序、停止条件を統合します。',
        responsibility: 'Task統合',
    },
    {
        label: 'ANALYZE',
        title: 'Specialist',
        description: 'Taskに必要な専門領域だけを調査・設計します。',
        responsibility: '専門判断の補助',
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
    'normal working tree + linked worktreeを含むrepository-wide',
    'read-heavy独立作業だけを条件付き並列',
    'writer作業は直列',
    'Verifier / Reviewer中はwriter停止',
] as const;

export const isolatedWorktreeRules = [
    'opt-in',
    'sequential physical isolation',
    'repository-wide Single Writerを維持',
    'commit-based integration',
    'Parallel Writerではない',
] as const;

export const aiDevelopmentSteps: AiDevelopmentStep[] = [
    {
        step: 1,
        title: '契約固定',
        description: '目的、範囲、禁止、停止、許可、検証経路を固定します。',
        owner: 'Human / Parent',
    },
    {
        step: 2,
        title: '証拠駆動調査',
        description: '正本、コード、テスト、実測を分けて確認します。',
        owner: 'Specialist',
    },
    {
        step: 3,
        title: '親統合 / Task分割',
        description: '依存関係と完了可能なTask境界を固定します。',
        owner: 'Parent Agent',
    },
    {
        step: 4,
        title: 'Task実行ループ',
        description: '必要な専門性を選び、Single Writerで差分を作ります。',
        owner: 'Specialist / Writer',
    },
    {
        step: 5,
        title: '検証済みTask checkpoint',
        description: 'Task単位の結果と未確認事項を分離します。',
        owner: 'Verifier',
    },
    {
        step: 6,
        title: '統合検証',
        description: '依存Taskを統合し、全体の回帰と副作用を確認します。',
        owner: 'Parent / Verifier',
    },
    {
        step: 7,
        title: 'Review / 改善評価',
        description: '指示、正本、差分、Evidence、Findingを照合します。',
        owner: 'Reviewer',
    },
    {
        step: 8,
        title: '最終Acceptance',
        description: 'Evidenceと未確認事項を分け、人間が完成を判断します。',
        owner: 'Human',
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
        value: 'HTTP入口',
        technicalLabel: 'Request / Controller',
        description: '入力形式とHTTPの受付を担当します。',
        category: 'entry',
    },
    {
        value: 'ユースケース',
        technicalLabel: 'Action',
        description: '一つの目的に必要な手順を担当します。',
        category: 'application',
    },
    {
        value: 'Domain',
        technicalLabel: 'Service / Repository / DTO',
        description: '業務判断、データ境界、レイヤー間の値を分けます。',
        category: 'domain',
    },
    {
        value: '出力整形',
        technicalLabel: 'Responder',
        description: '画面やAPIへ渡す形を担当します。',
        category: 'output',
    },
    {
        value: '表示',
        technicalLabel: 'Page / Feature Component',
        description: 'propsを受け取り、表示と画面内UI状態を担当します。',
        category: 'presentation',
    },
];

export const technologyComposition: NamedFact[] = [
    { title: 'Technology', description: '利用可能な技術を確認する。' },
    { title: 'Capability', description: 'Taskに必要な能力を選ぶ。' },
    { title: 'Integration', description: '接続点と依存方向を固定する。' },
    { title: 'Role', description: '責務と編集可否を割り当てる。' },
    { title: 'Evidence', description: '完了判断に必要な証拠を定める。' },
];

export const developmentStages: DevelopmentStage[] = [
    {
        key: 'IDEA BOARD',
        label: '構想',
        purpose: '利用者、課題、機能候補、未確定事項を整理する。',
        includes: ['目的', '利用場面', '未確定事項'],
        excludes: ['完成仕様の断定'],
        deliverable: '構想と問い',
        completion: '最初に確認する対象を説明できる',
        optional: false,
    },
    {
        key: 'MOCK',
        label: '画面単体',
        purpose: '固定データでUI構造、状態、操作感を確認する。',
        includes: ['UI契約', '表示幅', '主要状態'],
        excludes: ['DB保存', '本番業務判断'],
        deliverable: '画面のUI契約',
        completion: '各表示幅で画面単体を判断できる',
        optional: false,
    },
    {
        key: 'PROTOTYPE',
        label: '導線',
        purpose: '画面間の接続、操作順、仮のデータ流れを確認する。',
        includes: ['画面間接続', '仮データ', '状態の受け渡し'],
        excludes: ['本番業務ロジック', '正式DB設計'],
        deliverable: '導線と入出力候補',
        completion: 'Productへ渡す振る舞いを説明できる',
        optional: true,
    },
    {
        key: 'PRODUCT',
        label: '本実装',
        purpose: '仕様、責務、データ境界、テストを固定する。',
        includes: ['本データ', '責務分離', '検証'],
        excludes: ['未確認仕様の補完', '仮処理の流用'],
        deliverable: '製品コードとEvidence',
        completion: '受入条件と必要なゲートを満たす',
        optional: false,
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
        description: '登録されたcommandを実行して得た結果。',
        boundary: 'Browser表示へ読み替えない',
    },
    {
        title: 'Browser',
        description: 'URL、viewport、操作を固定した実画面の結果。',
        boundary: 'Screenshotだけで完了にしない',
    },
    {
        title: 'independent Verifier / Reviewer',
        description: '実装担当から分離した検証と照合。',
        boundary: 'Human Reviewへ読み替えない',
    },
    {
        title: 'Human Review',
        description: '採否、完成、最終visualを人間が判断する。',
        boundary: '他のEvidenceで代替しない',
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
