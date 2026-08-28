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
            'title' => '人間が判断し、AIは分離された責務を実行する。',
            'lead' => '目的、優先順位、操作許可、採否、完成判断は人間が持ちます。',
            'body' => 'このページは、何を分け、誰が書き、何をEvidenceとして受け取り、Findingをどこへ戻すかを示します。',
        ],
        [
            'key' => 'principles',
            'sort_order' => 20,
            'enabled' => true,
            'eyebrow' => '01 / TASK CONTRACT',
            'title' => 'Task Contractで、変更の境界を固定する。',
            'lead' => '実装より先に、目的、範囲、許可、停止、確認方法を揃えます。',
            'body' => '変更対象と変更禁止を分け、成功・失敗・停止条件を同じTaskの契約として扱います。',
        ],
        [
            'key' => 'human-ai-roles',
            'sort_order' => 30,
            'enabled' => true,
            'eyebrow' => '02 / HUMAN + AI',
            'title' => '必要な専門性だけを、Taskごとに選ぶ。',
            'lead' => '人間、ChatGPT、親Agent、Specialist、Writer、Verifier、Reviewerの責務を分けます。',
            'body' => 'read-heavyな独立作業は条件付きで並列化しても、repository-wideのwriterは同時最大1体です。',
        ],
        [
            'key' => 'ai-development-flow',
            'sort_order' => 40,
            'enabled' => true,
            'eyebrow' => '03 / CURRENT FLOW',
            'title' => '8段階で、調査からAcceptanceまでをつなぐ。',
            'lead' => '契約固定から最終Acceptanceまで、各段階の出力を次の入力へ渡します。',
            'body' => 'Task Dependency DAGは依存関係を示し、Parallel Writerの許可としては扱いません。',
        ],
        [
            'key' => 'architecture',
            'sort_order' => 50,
            'enabled' => true,
            'eyebrow' => '04 / ADR PATTERN',
            'title' => 'Action - Domain - Responderで、変更理由を分ける。',
            'lead' => 'このprojectでのADRはArchitecture Decision Recordではありません。',
            'body' => 'HTTP入口、Action、Domain、Responder、presentationを分け、Taskに必要な責務だけを配置します。',
        ],
        [
            'key' => 'development-stages',
            'sort_order' => 60,
            'enabled' => true,
            'eyebrow' => '05 / DEVELOPMENT STAGES',
            'title' => '開発段階を混同しない。',
            'lead' => 'IDEA BOARD、MOCK、PROTOTYPE、PRODUCTは目的と完成条件が異なります。',
            'body' => '前段階の仮データや仮処理ではなく、確認したUI契約と振る舞いを次段階へ渡します。',
        ],
        [
            'key' => 'quality-gates',
            'sort_order' => 70,
            'enabled' => true,
            'eyebrow' => '06 / EVIDENCE',
            'title' => 'Evidenceを相互代替しない。',
            'lead' => 'Static、Installed、Runtime、Browser、独立確認、Human Reviewを分けます。',
            'body' => '設定値や静的checkerの成功をruntime成功へ読み替えず、FigmaやScreenshotをBrowser Evidenceの代替にしません。',
        ],
        [
            'key' => 'improvement-loop',
            'sort_order' => 80,
            'enabled' => true,
            'eyebrow' => '07 / IMPROVEMENT LOOP',
            'title' => 'Findingを、再発防止へ戻す。',
            'lead' => 'FindingからEvidence、root cause、scope、owner、Fix、Verify、Feedbackへ進みます。',
            'body' => '結果をCode、Test、Type、Docs、Policy、Checker、Sensors、Harnessの適切な正本へ戻します。',
        ],
        [
            'key' => 'closing',
            'sort_order' => 90,
            'enabled' => true,
            'eyebrow' => 'FINAL ACCEPTANCE',
            'title' => '完成は、Evidenceと未確認事項を分けて判断する。',
            'lead' => '検証結果は完成判断の材料であり、判断そのものは人間が持ちます。',
            'body' => '確認済み事実、失敗、未確認範囲、残る人間判断を分けて次の行動を選びます。',
        ],
    ],
];
