import type {
    ArchitectureLayer,
    DevelopmentStage,
    EngineeringLoopStep,
    HumanAiActor,
    Principle,
    SubagentDefinition,
    SubagentFilterKey,
} from '@/Components/DesignPhilosophy/designPhilosophyTypes';

export const heroKeywords = [
    'ADR Pattern',
    'Layered Architecture',
    'DTO Boundary',
    'TDD',
    'Subagent',
    'Understanding Reboot',
];

export const principles: Principle[] = [
    {
        title: '責務を分ける',
        description: 'クラスを増やすこと自体を目的にしません。',
        details: ['変更理由を分ける', '影響範囲を閉じ込める'],
    },
    {
        title: '契約を固定する',
        description: '層と層をまたぐ曖昧さを減らします。',
        details: ['DTO', 'Type', 'Props', 'Event', 'Test'],
    },
    {
        title: '段階を混ぜない',
        description: '検討、画面確認、任意の接続検証、本実装を分けます。',
        details: ['IDEA BOARD', 'MOCK', '必要時のみPROTOTYPE', 'PRODUCT'],
    },
    {
        title: '理解を再起動できる状態を残す',
        description: '目的、責務、入力、出力、制約を後から回収できることも完成条件です。',
        details: ['コード', '型', 'Test', 'コメント', 'docs'],
    },
];

export const architectureLayers: ArchitectureLayer[] = [
    {
        key: 'Action',
        title: '入口と手順',
        description: 'HTTPやCLIの入力を1ユースケースの手順へ接続し、業務判断や永続化を持ちません。',
        responsibilities: ['FormRequest / Request', 'Controller', 'Action / Query', 'Application Authentication'],
    },
    {
        key: 'Domain',
        title: '判断と契約',
        description: '業務判断、データ契約、永続化境界、副作用境界を分離します。',
        responsibilities: ['Service / Strategy / Factory', 'DTO / Value Object', 'Repository Port / Adapter', 'Event / Listener / Job'],
    },
    {
        key: 'Responder',
        title: '利用者へ返す',
        description: '業務結果を、利用者向けの表示・API・参照形式へ変換します。',
        responsibilities: ['Responder / Presenter', 'Inertia Props / JSON', 'Read Model / Projection', 'React Page / Component'],
    },
];

export const developmentStages: DevelopmentStage[] = [
    { key: 'IDEA BOARD', label: '構想', description: '利用者と解決する問題を整理します。', details: ['利用者', '解決する問題', '価値', '機能候補', 'フロー', '図や説明'], optional: false },
    { key: 'MOCK', label: '画面契約', description: '固定データで画面と操作感を確認します。DBや本番APIは持ち込みません。', details: ['固定データ', '画面', '導線', '状態', '操作感'], optional: false },
    { key: 'PROTOTYPE', label: '任意工程', description: '通信や技術的成立性が必要な場合だけ確認します。', details: ['標準フローの必須工程にしない', '検証コードをPRODUCTへ昇格させない'], optional: true },
    { key: 'PRODUCT', label: '長期保守', description: '確定した契約を、長期保守可能な本実装として作り直します。', details: ['責務分離', 'DB', 'Validation', '認証認可', 'Test', 'docs', '運用'], optional: false },
];

export const humanAiActors: HumanAiActor[] = [
    { label: 'Human', title: '人間', description: '目的と境界を決め、最終判断と書込み操作の許可を持ちます。', responsibilities: ['構想・仕様確定', '責務境界・DB設計', '完成判定', '書込み操作の許可', 'merge・本番反映'], primary: false },
    { label: 'Translator', title: 'ChatGPT', description: '壁打ちの内容を、責務境界のある実装可能な指示へ翻訳します。', responsibilities: ['壁打ち・仕様整理', '責務分離', 'Codexへ渡す指示用まとめ', 'PRレビュー', '理解再起動・情報源整理'], primary: true },
    { label: 'Orchestrator', title: 'Codex親Agent', description: '正本を読み、必要な役だけを選び、結果と停止判断を統合します。', responsibilities: ['AGENTSとMDルーターの確認', '作業範囲確定', '必要なSubagentだけを選択', '単一writer管理', '検証・レビュー結果の統合'], primary: false },
];

export const contextSources = ['AGENTS', 'MDルーター', '正本docs', '作業境界', '停止条件', 'Context Harness'];

export const subagentFilters: Array<{ key: SubagentFilterKey; label: string }> = [
    { key: 'all', label: 'すべて' },
    { key: 'discover', label: '探索・設計' },
    { key: 'implement', label: '実装' },
    { key: 'verify', label: '検証・レビュー' },
];

export const subagents: SubagentDefinition[] = [
    { name: 'luna_explorer', group: 'discover', groupLabel: '探索・仕様・設計・環境確認', roleLabel: '探索', description: '対象ファイルと参照関係を根拠付きで特定し、仕様や設計は決定しません。' },
    { name: 'specification_reviewer', group: 'discover', groupLabel: '探索・仕様・設計・環境確認', roleLabel: '仕様監査', description: '指示、正本、コード、Testの矛盾と受入条件を実装前に確認します。' },
    { name: 'architecture_specialist', group: 'discover', groupLabel: '探索・仕様・設計・環境確認', roleLabel: '設計監査', description: 'ADR Pattern、依存方向、DTO境界、DI、テスト可能性を監査します。' },
    { name: 'design_specialist', group: 'discover', groupLabel: '探索・仕様・設計・環境確認', roleLabel: 'UI設計', description: '情報階層、幅別の構成、状態、操作、アクセシビリティを実装前に確認します。' },
    { name: 'environment_specialist', group: 'discover', groupLabel: '探索・仕様・設計・環境確認', roleLabel: '環境確認', description: 'repo、branch、working tree、runtime、sandbox、実行導線を読み取りで確認します。' },
    { name: 'terra_implementer', group: 'implement', groupLabel: '実装・修正', roleLabel: '横断実装', description: '契約が確定した低リスクな機械的横断変更を、単一writerで実装します。' },
    { name: 'frontend_specialist', group: 'implement', groupLabel: '実装・修正', roleLabel: 'Frontend', description: '確定したUI契約に従い、React・Inertia・TypeScriptと画面状態を実装します。' },
    { name: 'backend_specialist', group: 'implement', groupLabel: '実装・修正', roleLabel: 'Backend', description: '確定した責務配置に従い、LaravelのHTTP・Application・Domain層を実装します。' },
    { name: 'database_specialist', group: 'implement', groupLabel: '実装・修正', roleLabel: 'Database', description: 'DB変更時だけschema、Migration、rollback、既存データ影響、transactionを扱います。' },
    { name: 'test_specialist', group: 'implement', groupLabel: '実装・修正', roleLabel: 'Test', description: '正常・異常・境界・回帰観点を抽出し、壊してはいけない契約をTestへ固定します。' },
    { name: 'context_recovery', group: 'implement', groupLabel: '実装・修正', roleLabel: '理解再起動', description: 'コード、型、コメント、Test、docsから再開に必要な最小文脈を再構成します。' },
    { name: 'operations_specialist', group: 'implement', groupLabel: '実装・修正', roleLabel: 'Operations', description: '既存構成の変更、開始条件が確定した新規Operations構成、read-onlyのOperations Security監査を必要時に扱います。' },
    { name: 'information_source_curator', group: 'implement', groupLabel: '実装・修正', roleLabel: '情報源', description: '現在の情報源と正本を照合し、指定先へ次版の情報源を安全に編纂します。' },
    { name: 'terra_docs_maintainer', group: 'implement', groupLabel: '実装・修正', roleLabel: 'Docs', description: '対象docsと直接の正本だけを確認し、索引と参照導線を守って更新します。' },
    { name: 'sol_specialist', group: 'implement', groupLabel: '実装・修正', roleLabel: '高難度実装', description: 'architecture監査後の複雑・高リスク・複数レイヤー実装だけを必要時に担当します。' },
    { name: 'terra_verifier', group: 'verify', groupLabel: '検証・ブラウザ・独立レビュー', roleLabel: '検証', description: '登録済みコマンドとworking tree変化を修正せず確認し、結果を整理します。' },
    { name: 'browser_verifier', group: 'verify', groupLabel: '検証・ブラウザ・独立レビュー', roleLabel: 'Browser', description: '固定したURLと幅で、実画面・Console・Network・DOM・CSSを読み取り確認します。' },
    { name: 'sol_reviewer', group: 'verify', groupLabel: '検証・ブラウザ・独立レビュー', roleLabel: '独立レビュー', description: '指示、正本、最終差分、検証結果を実装担当から独立して照合します。' },
];

export const engineeringLoopSteps: EngineeringLoopStep[] = [
    { title: '仕様', description: '目的・境界・合格条件' },
    { title: '設計', description: '責務・契約・依存方向' },
    { title: '実装', description: '単一writerで差分作成' },
    { title: '検証', description: 'Test・Browser・Sensors' },
    { title: '再確認', description: '問題を戻し、理解を更新' },
];

export const rebootSources = ['型とDTO', 'Test', 'コメント', 'docs', 'MDルーター', 'PR', 'Sensors'];
