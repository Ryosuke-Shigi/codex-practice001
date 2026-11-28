<?php

return [
    /*
     * 設計思想の冒頭・5節へ引き継ぐ、固定9キーの詳細メタデータを管理します。
     * 任意の新しいセクションを自由に追加するための仕組みではありません。
     * 章内のカードや一覧は、Frontend表示契約に閉じた型付きデータとして React 側が持ちます。
     */
    'sections' => [
        [
            'key' => 'hero',
            'sort_order' => 10,
            'enabled' => true,
            'eyebrow' => '設計思想',
            'title' => '変更できる。理解し直せる。確かめられる。',
            'lead' => '継続的に開発・保守できるシステムを目指し、責務を分け、設計の意図を残し、実際の結果を確かめます。',
            'body' => '',
        ],
        [
            'key' => 'principles',
            'sort_order' => 20,
            'enabled' => true,
            'eyebrow' => 'VERIFY, THEN ACCEPT',
            'title' => 'AIを信用するのではなく、検証可能な構造を置く。',
            'lead' => 'Claim、Evidence、Authority、Acceptanceを独立させます。',
            'body' => 'Task Contractで目的、範囲、成功、失敗、停止、permissionを固定し、ClaimをEvidenceへ読み替えません。',
        ],
        [
            'key' => 'human-ai-roles',
            'sort_order' => 30,
            'enabled' => true,
            'eyebrow' => 'ハーネスの構造',
            'title' => '役割と作業条件を、仕組みでつなぐ。',
            'lead' => 'AIの開発作業を支える仕組みを、ハーネスと呼んでいます。作業条件を先に定め、実装・検証・レビューの担当と、成果物の受け渡しを整理します。',
            'body' => '',
        ],
        [
            'key' => 'ai-development-flow',
            'sort_order' => 40,
            'enabled' => true,
            'eyebrow' => 'EVIDENCE PIPELINE',
            'title' => '作業条件から最終判断まで、確認結果をつなぐ。',
            'lead' => '作業条件、調査、実装、検証、レビュー、最終判断へと、確認結果と未確認事項を渡します。',
            'body' => '技術相談は必要な場合に依頼し、指摘があれば修正と再確認へ戻します。',
        ],
        [
            'key' => 'architecture',
            'sort_order' => 50,
            'enabled' => true,
            'eyebrow' => 'コーディング思想',
            'title' => '責務を分け、意図を残す。',
            'lead' => 'ADR（Action–Domain–Responder）を軸に、ユースケースの手順と業務ルールを分離します。設計パターンは必要な場面で使い、後から目的を読み直せるコードを目指します。',
            'body' => '後から読む人が、意図から理解し直せるように。コード・型・テストに加え、PHPDocに目的や責務、入出力、成功条件、担当しない処理を残します。',
        ],
        [
            'key' => 'development-stages',
            'sort_order' => 60,
            'enabled' => true,
            'eyebrow' => '開発段階',
            'title' => '試してから、本番へ進める。',
            'lead' => '構想・画面試作・導線確認・本実装。それぞれの段階で、確かめることを変えます。',
            'body' => '各段階の成果を判断材料に、人が次へ進むかを決めます。確認した振る舞いと入出力を引き継ぎ、本実装に必要な責務とテストを整えます。',
        ],
        [
            'key' => 'quality-gates',
            'sort_order' => 70,
            'enabled' => true,
            'eyebrow' => '大切にする原則',
            'title' => 'AIの答えを、そのまま完成にしない。',
            'lead' => 'AIは間違えることを前提に、主張・確認できた証拠・操作の許可・完成の判断を分けます。このノートラストの考え方に基づき、未確認を明示し、最終判断は人が行います。',
            'body' => '',
        ],
        [
            'key' => 'improvement-loop',
            'sort_order' => 80,
            'enabled' => true,
            'eyebrow' => 'IMPROVEMENT LOOP',
            'title' => 'Findingを循環させ、適切な正本へ戻す。',
            'lead' => 'FindingからEvidence、root cause、scope、owner、Fix、Verify、Feedbackへ進みます。',
            'body' => '結果はCode、Test、Type、Docs、Policy、Checker、Sensors、Harnessから、原因を所有する適切な戻し先を選びます。',
        ],
        [
            'key' => 'closing',
            'sort_order' => 90,
            'enabled' => true,
            'eyebrow' => 'HUMAN AUTHORITY',
            'title' => '実行可能であることを、実行してよいことへ変換しない。',
            'lead' => 'AI、tool、Capability、Writer Leaseが存在しても、Operation Authorityへ自動変換しません。',
            'body' => 'Evidenceと未確認事項を分け、最終Acceptanceと次の操作はHuman Judgmentへ戻します。',
        ],
    ],
];
