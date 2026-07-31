import type {
    AiDevelopmentStep,
    ArchitectureLayer,
    ArchitectureResponsibility,
    DevelopmentStage,
    ImprovementStep,
    Principle,
    PublicRole,
    QualityGate,
} from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export const heroSignals = [
    '人間主導',
    '契約駆動',
    '単一編集',
    '独立検証',
    '安全停止',
    '継続改善',
] as const;

export const principles: Principle[] = [
    {
        title: '人間主導',
        description: '目的、優先順位、完成の判断を人間が持ちます。',
        signal: '判断主体を曖昧にしない',
    },
    {
        title: '契約駆動',
        description: '入力、出力、禁止事項、成功条件を実装前に固定します。',
        signal: '曖昧さを境界で止める',
    },
    {
        title: '責務分離',
        description: '変更理由が異なるものを、同じ場所へ集めません。',
        signal: '影響範囲を狭く保つ',
    },
    {
        title: '単一編集',
        description: '同じ成果物を同時に変更せず、差分の所有者を明確にします。',
        signal: '競合と上書きを防ぐ',
    },
    {
        title: '独立検証',
        description: '実装した視点とは別の視点で、契約と結果を照合します。',
        signal: '思い込みを検出する',
    },
    {
        title: '安全に止まる',
        description: '不明点や権限不足を推測で埋めず、判断できる地点へ戻します。',
        signal: '不確実性を隠さない',
    },
    {
        title: '必要な工程だけを使う',
        description: '変更の大きさと危険度に合わせて、工程と専門性を選びます。',
        signal: '過剰さと不足を避ける',
    },
    {
        title: '制御された継続改善',
        description: '失敗から得た知見を、次の変更で使える形へ戻します。',
        signal: '同じ問題を反復しない',
    },
];

export const publicRoles: PublicRole[] = [
    {
        label: 'DECIDE',
        title: '人間',
        description: '構想、優先順位、許可、採否、完成を判断します。',
        responsibility: '目的と最終判断',
    },
    {
        label: 'TRANSLATE',
        title: 'ChatGPT',
        description: '対話を、境界と受入条件のある依頼へ整理します。',
        responsibility: '意図の構造化',
    },
    {
        label: 'ORCHESTRATE',
        title: '親Agent',
        description: '全体の範囲、順序、役割、停止条件を統合します。',
        responsibility: '進行と統合',
    },
    {
        label: 'ANALYZE',
        title: 'Specialist',
        description: '専門領域の事実、危険、設計上の論点を明らかにします。',
        responsibility: '専門判断の補助',
    },
    {
        label: 'IMPLEMENT',
        title: 'Writer',
        description: '固定された契約の範囲だけを、一貫した差分として実装します。',
        responsibility: '単一の変更',
    },
    {
        label: 'VERIFY',
        title: 'Verifier',
        description: '登録された確認方法で、結果と副作用を測定します。',
        responsibility: '実行結果の確認',
    },
    {
        label: 'REVIEW',
        title: 'Reviewer',
        description: '指示、設計、差分、検証結果を独立した視点で照合します。',
        responsibility: '完成前の照合',
    },
];

export const aiDevelopmentSteps: AiDevelopmentStep[] = [
    {
        step: 1,
        title: '人間が構想を定める',
        description: '誰の、どの問題を、なぜ解くのかを言語化します。',
        owner: 'Human',
    },
    {
        step: 2,
        title: 'ChatGPTで壁打ちする',
        description: '対話を通じて、構想の曖昧さと検討すべき問いを明らかにします。',
        owner: 'ChatGPT',
    },
    {
        step: 3,
        title: '目的・範囲・成功条件を固定',
        description: '今回変えるもの、変えないもの、到達点を明確にします。',
        owner: 'Contract',
    },
    {
        step: 4,
        title: '作業契約を作る',
        description: '責務、権限、停止条件、確認方法を作業前に揃えます。',
        owner: 'Contract',
    },
    {
        step: 5,
        title: '必要な専門役割だけを選ぶ',
        description: '変更の範囲と危険度に合う専門性だけを組み合わせます。',
        owner: 'Specialist',
    },
    {
        step: 6,
        title: '親Agentが結果を統合',
        description: '調査と設計の結果を照合し、一つの実装方針へまとめます。',
        owner: 'Parent Agent',
    },
    {
        step: 7,
        title: '単一Writerが実装',
        description: '所有範囲を限定し、最小の差分で契約を満たします。',
        owner: 'Writer',
    },
    {
        step: 8,
        title: 'Verifierが独立検証',
        description: '固定された方法で、結果と意図しない副作用を確認します。',
        owner: 'Verifier',
    },
    {
        step: 9,
        title: 'Reviewerが独立レビュー',
        description: '仕様、責務、差分、検証結果を実装者と別の視点で照合します。',
        owner: 'Reviewer',
    },
    {
        step: 10,
        title: '改善候補を評価',
        description: '見つかった課題を、効果と影響範囲から評価します。',
        owner: 'Improve',
    },
    {
        step: 11,
        title: '完了・修正・別課題化・人間判断へ分岐',
        description: '根拠を揃え、次に取る行動を人間が選べる状態へ戻します。',
        owner: 'Human',
    },
];

export const architectureLayers: ArchitectureLayer[] = [
    {
        key: 'Action',
        title: 'ユースケースを進める',
        description: '入口から受けた値を使い、必要な処理の順序を制御します。',
    },
    {
        key: 'Domain',
        title: '業務の意味を守る',
        description: '再利用できる業務判断、データ契約、発生した事実を表します。',
    },
    {
        key: 'Responder',
        title: '利用者へ届ける',
        description: '処理結果を、画面やAPIが利用できる出力へ整えます。',
    },
];

export const architectureResponsibilities: ArchitectureResponsibility[] = [
    {
        value: 'HTTP・画面入口',
        technicalLabel: 'Request / Controller · Page / Component',
        description: 'HTTP入力の検証と受付、画面への接続をユースケース本体から分けます。',
        category: 'entry',
    },
    {
        value: 'ユースケースの進行',
        technicalLabel: 'Action',
        description: 'Actionが一つの目的に必要な処理順序を組み立てます。',
        category: 'application',
    },
    {
        value: '再利用できる業務判断',
        technicalLabel: 'Service / Strategy',
        description: '入口や出力形式に依存しない業務判断と処理差分を担います。',
        category: 'domain',
    },
    {
        value: '事実と副作用の分離',
        technicalLabel: 'Event / Listener',
        description: '発生した事実と、それに続く副作用を主処理から分けます。',
        category: 'domain',
    },
    {
        value: 'データ契約',
        technicalLabel: 'DTO / ListDTO / Value Object',
        description: 'DTOと型が、層をまたいで運ぶ値の形を固定します。',
        category: 'domain',
    },
    {
        value: '永続化と外部接続',
        technicalLabel: 'Repository実装 / 外部Adapter',
        description: '保存先や外部サービス固有の入出力を業務判断から分離します。',
        category: 'infrastructure',
    },
    {
        value: '非同期実行',
        technicalLabel: 'Queue / Job',
        description: '実行時点、再試行、Queue固有の制御をユースケースから分けます。',
        category: 'infrastructure',
    },
    {
        value: '出力と画面接続',
        technicalLabel: 'Responder / Inertia props / JSON',
        description: 'ユースケースの結果を利用者へ返す形に整えます。',
        category: 'output',
    },
];

export const developmentStages: DevelopmentStage[] = [
    {
        key: 'IDEA BOARD',
        label: '構想',
        purpose: '利用者、課題、価値、機能候補を整理する。',
        includes: [
            '解決したいこと',
            '想定利用者と利用場面',
            '機能候補と未確定事項',
        ],
        excludes: ['完成仕様の断定', '本番構成の確定'],
        deliverable: '構想と検討すべき問い',
        completion: '目的、最初に確認する画面、採否の判断材料を説明できる',
        optional: false,
    },
    {
        key: 'MOCK',
        label: '画面確認',
        purpose: '固定データで情報階層、導線、操作感を確かめる。',
        includes: [
            '固定データ',
            '画面・導線・主要状態',
            '各表示幅での操作感',
        ],
        excludes: [
            'DB保存・本番API',
            '業務判断・権限判断',
            '正式な状態遷移',
        ],
        deliverable: '画面とUI契約',
        completion: '主要操作と状態表示を各表示幅で確認できる',
        optional: false,
    },
    {
        key: 'PROTOTYPE',
        label: '技術検証',
        purpose: '通信や技術的成立性に不確実性がある場合だけ試す。',
        includes: [
            '画面間の接続',
            '仮データ・簡易通信',
            '操作順と状態の受け渡し',
        ],
        excludes: ['本番業務ロジック', '正式なDB設計', '本番データ更新'],
        deliverable: '検証結果と正式仕様の候補',
        completion: '採用可否と本実装へ渡す入出力を説明できる',
        optional: true,
    },
    {
        key: 'PRODUCT',
        label: '本実装',
        purpose: '確定した契約を、長期保守できる責務へ配置する。',
        includes: [
            '確定した仕様と責務',
            '本データと入力検証',
            'テスト・文書・運用条件',
        ],
        excludes: ['未確認な仕様の補完', '仮処理の流用', '目的外の機能'],
        deliverable: '製品コードと品質証拠',
        completion: '受入条件と必要なゲートを満たす',
        optional: false,
    },
];

export const qualityGates: QualityGate[] = [
    {
        title: '契約と責務',
        description: '入力、出力、依存方向、所有者が一致しているか。',
        check: '設計レビュー',
    },
    {
        title: '型と静的解析',
        description: '境界の形、nullable、未使用、到達不能を検出できるか。',
        check: 'Type / Lint',
    },
    {
        title: 'テスト',
        description: '正常、異常、境界、回帰の期待が固定されているか。',
        check: 'Automated Test',
    },
    {
        title: '画面と操作性',
        description: '幅、入力方法、状態、読みやすさに破綻がないか。',
        check: 'Visual / A11y',
    },
    {
        title: 'データ変更',
        description: '既存データ、移行、索引、巻き戻しを説明できるか。',
        check: 'Data Review',
    },
    {
        title: '認証と認可',
        description: '誰が何を見て、何を変更できるかが守られているか。',
        check: 'Access Review',
    },
    {
        title: '外部接続',
        description: '失敗、遅延、制限、再試行時の挙動が安全か。',
        check: 'Boundary Test',
    },
    {
        title: '非同期処理',
        description: '重複、順序、再実行、部分失敗を制御できるか。',
        check: 'Queue / Event',
    },
    {
        title: '運用、監視、復旧',
        description: '異常を発見し、安全に切り戻して復旧できるか。',
        check: 'Operations',
    },
];

export const improvementSteps: ImprovementStep[] = [
    {
        step: 1,
        title: '違和感を捕捉',
        description: '失敗、手戻り、迷いを改善の入力として残します。',
    },
    {
        step: 2,
        title: '事実を集める',
        description: '期待、実測、差分を分けて状況を再現します。',
    },
    {
        step: 3,
        title: '原因を確認',
        description: '症状ではなく、契約や責務のどこでずれたかを探します。',
    },
    {
        step: 4,
        title: '影響を分類',
        description: '局所修正か、設計や運用へ戻す課題かを分けます。',
    },
    {
        step: 5,
        title: '対応を設計',
        description: '最小の修正と、再発を防ぐ確認方法を決めます。',
    },
    {
        step: 6,
        title: '検証して判断',
        description: '結果を確認し、採用、保留、却下、別課題化を選びます。',
    },
    {
        step: 7,
        title: '知見を戻す',
        description: '次の変更で使える型、テスト、文書へ学びを反映します。',
    },
];
