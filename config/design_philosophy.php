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
            'title' => '人間主導のAI開発設計思想',
            'lead' => 'AIの速さを、人間が制御できる品質へ変える。',
            'body' => '目的、契約、責務、検証を先に設計し、AIの反復をその境界内で活かします。',
        ],
        [
            'key' => 'principles',
            'sort_order' => 20,
            'enabled' => true,
            'eyebrow' => '01 / CORE PRINCIPLES',
            'title' => '品質を支える、8つの制御原則。',
            'lead' => '速さを目的にせず、判断と変更を追跡できる状態をつくります。',
            'body' => '人間主導、契約、責務、編集、検証、停止、工程、改善の原則を一つの制御系として扱います。',
        ],
        [
            'key' => 'human-ai-roles',
            'sort_order' => 30,
            'enabled' => true,
            'eyebrow' => '02 / HUMAN + AI',
            'title' => '判断と作業の責務を分ける。',
            'lead' => '人間が目的と採否を持ち、AIは役割ごとに調査、実装、確認を担います。',
            'body' => '誰が決め、誰が書き、誰が確かめるかを分けることで、速度と説明可能性を両立します。',
        ],
        [
            'key' => 'ai-development-flow',
            'sort_order' => 40,
            'enabled' => true,
            'eyebrow' => '03 / CONTROLLED FLOW',
            'title' => '速さではなく、制御できる流れをつくる。',
            'lead' => '構想から採否までを11の工程に分け、各地点で入力と確認方法を明確にします。',
            'body' => '確認できない状態では先へ進まず、必要な判断を人間へ戻せる流れを設計します。',
        ],
        [
            'key' => 'architecture',
            'sort_order' => 50,
            'enabled' => true,
            'eyebrow' => '04 / LARAVEL ARCHITECTURE',
            'title' => 'Laravelの責務を、変更理由で分ける。',
            'lead' => 'Action - Domain - Responderを中心に、入力、判断、データ、出力を分離します。',
            'body' => '層の数を増やすのではなく、変更理由が異なる責務を離し、影響範囲を狭く保ちます。',
        ],
        [
            'key' => 'development-stages',
            'sort_order' => 60,
            'enabled' => true,
            'eyebrow' => '05 / DEVELOPMENT STAGES',
            'title' => '目的に合う段階だけを使う。',
            'lead' => '構想、画面確認、技術検証、本実装を同じ成果物として扱いません。',
            'body' => '各段階の目的、成果、完了条件を分け、未確定なものを製品仕様へ持ち込みません。',
        ],
        [
            'key' => 'quality-gates',
            'sort_order' => 70,
            'enabled' => true,
            'eyebrow' => '06 / QUALITY GATES',
            'title' => '変更内容に必要な品質ゲートを選ぶ。',
            'lead' => 'すべてを同じ強度で確認せず、影響範囲と失敗時の大きさに応じてゲートを組み合わせます。',
            'body' => 'コード、画面、データ、安全性、運用まで、変更が触れる境界を見落とさずに確認します。',
        ],
        [
            'key' => 'improvement-loop',
            'sort_order' => 80,
            'enabled' => true,
            'eyebrow' => '07 / CONTROLLED IMPROVEMENT',
            'title' => '問題を、次の品質へ戻す。',
            'lead' => '失敗を隠さず、原因と影響を確認し、知見を再利用できる場所へ戻します。',
            'body' => '採用、保留、却下、別課題化を明示し、同じ問題を無目的に反復しない改善ループをつくります。',
        ],
        [
            'key' => 'closing',
            'sort_order' => 90,
            'enabled' => true,
            'eyebrow' => 'DESIGN PHILOSOPHY',
            'title' => '壊さず、迷わず、成長し続ける。',
            'lead' => 'AI開発の価値は、生成量ではなく、変更を制御し続けられることにあります。',
            'body' => '人間が目的と完成を判断し、契約、責務、検証、改善が次の変更を支える設計を続けます。',
        ],
    ],
];
