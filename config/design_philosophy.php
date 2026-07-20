<?php

return [
    /*
     * Design Philosophy LP の固定9章について、有効化、並び順、見出し、説明文を管理します。
     * 任意の新しいセクションを自由に追加するための仕組みではありません。
     * 章内のカードや一覧は、Frontend表示契約に閉じた型付きデータとして React 側が持ちます。
     */
    'sections' => [
        [
            'key' => 'hero',
            'sort_order' => 10,
            'enabled' => true,
            'eyebrow' => 'ポートフォリオ／設計思想',
            'title' => '責務でつなぐ AI駆動開発',
            'lead' => '速く作るためだけではない。速く作っても壊れず、後から理解し直せるシステムを設計する。',
            'body' => '人間が目的と境界を設計し、AIが境界内で反復する。その結果を、人間とAIのどちらでも理解し直せる形で残します。',
        ],
        [
            'key' => 'principles',
            'sort_order' => 20,
            'enabled' => true,
            'eyebrow' => '01 / PRINCIPLES',
            'title' => '速さを、腐敗の理由にしない。',
            'lead' => '責務・契約・段階・理解の4原則で、変更の影響範囲を閉じ込めます。',
            'body' => 'AIで実装速度が上がっても、将来の変更を受け止められる場所へ差分を配置します。',
        ],
        [
            'key' => 'architecture',
            'sort_order' => 30,
            'enabled' => true,
            'eyebrow' => '02 / ARCHITECTURE',
            'title' => 'コードの責務を、変更理由で分ける。',
            'lead' => 'このプロジェクトのADR Patternは、Action - Domain - Responderを意味します。',
            'body' => 'Architecture Decision Recordの略称ではありません。HTTP入力、ユースケース、業務判断、永続化、出力整形を1か所へ集めないための境界です。',
        ],
        [
            'key' => 'development-stages',
            'sort_order' => 40,
            'enabled' => true,
            'eyebrow' => '03 / DEVELOPMENT STAGES',
            'title' => '検討・確認・本実装を、同じコードで済ませない。',
            'lead' => 'IDEA BOARD、MOCK、必要時のみPROTOTYPE、PRODUCTを混ぜません。',
            'body' => 'PROTOTYPEは通信や技術的成立性を確認する必要がある場合だけ使う任意工程です。',
        ],
        [
            'key' => 'human-ai-flow',
            'sort_order' => 50,
            'enabled' => true,
            'eyebrow' => '04 / HUMAN + AI',
            'title' => 'コードだけでなく、AIにも責務を分ける。',
            'lead' => '人間、ChatGPT、Codex親Agentの判断と作業を混ぜない。',
            'body' => '人間が判断と許可を持ち、ChatGPTが仕様へ翻訳し、Codex親Agentが正本と停止条件を照合します。',
        ],
        [
            'key' => 'subagents',
            'sort_order' => 60,
            'enabled' => true,
            'eyebrow' => '05 / 18 SUBAGENTS',
            'title' => '必要な役だけを選ぶ。',
            'lead' => '役を増やすことではなく、判断・実装・検証を分離することが目的です。',
            'body' => '18役を常にすべて起動せず、作業範囲とリスクに合う専門性だけを選びます。',
        ],
        [
            'key' => 'engineering-loop',
            'sort_order' => 70,
            'enabled' => true,
            'eyebrow' => '06 / LOOP ENGINEERING',
            'title' => '一度で正解にせず、ズレを検出して戻す。',
            'lead' => '仕様、設計、実装、検証、再確認を循環させます。',
            'body' => 'AIの初回出力を完成扱いせず、正本、Test、Browser、Sensors、独立レビューで照合します。',
        ],
        [
            'key' => 'understanding-reboot',
            'sort_order' => 80,
            'enabled' => true,
            'eyebrow' => '07 / UNDERSTANDING REBOOT',
            'title' => '会話が消えても、開発を再開できる。',
            'lead' => '良いコードは、動くだけのコードではありません。',
            'body' => '次の担当者や次のAIが、なぜその構造なのかを型、Test、コメント、docsから再構築できる状態を残します。',
        ],
        [
            'key' => 'closing',
            'sort_order' => 90,
            'enabled' => true,
            'eyebrow' => 'DESIGN PHILOSOPHY',
            'title' => 'レイヤードアーキテクチャによるコードの責務分離と、SubagentによるAIの責務分離を、同じ原則で設計する。',
            'lead' => 'レイヤードアーキテクチャによるコードの責務分離と、SubagentによるAIの責務分離を、同じ原則で設計します。',
            'body' => '特定のAIモデルへ品質を依存させず、正本・責務・契約・停止条件・検証によって、速さと保守性を両立します。',
        ],
    ],
];
