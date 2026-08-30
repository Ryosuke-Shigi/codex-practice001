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
            'eyebrow' => 'PORTFOLIO / CODEX ZERO TRUST',
            'title' => '人間が判断し、AIは検証可能な境界で実行する。',
            'lead' => 'AIは誤読・省略・過剰実装・誤報告し得る。だから、信用ではなく検証可能な構造を先に置きます。',
            'body' => 'Human intent / authorityからHuman judgmentまで責務を分離し、AIの自己申告だけをAcceptance Evidenceにはしません。',
        ],
        [
            'key' => 'principles',
            'sort_order' => 20,
            'enabled' => true,
            'eyebrow' => '01 / VERIFY, THEN ACCEPT',
            'title' => 'AIを信用するのではなく、検証可能な構造を置く。',
            'lead' => 'Claim、Evidence、Authority、Acceptanceを独立させます。',
            'body' => 'Task Contractで目的、範囲、成功、失敗、停止、permissionを固定し、ClaimをEvidenceへ読み替えません。',
        ],
        [
            'key' => 'human-ai-roles',
            'sort_order' => 30,
            'enabled' => true,
            'eyebrow' => '02 / SEPARATION OF DUTIES',
            'title' => '実行・検証・Review・統合・判断を分離する。',
            'lead' => 'Human、Parent、Writer、Verifier、Reviewerを混同しません。',
            'body' => 'repository-wide Single Writerを維持し、実行できるCapabilityと、その操作をしてよいAuthorityを分けます。',
        ],
        [
            'key' => 'ai-development-flow',
            'sort_order' => 40,
            'enabled' => true,
            'eyebrow' => '03 / EVIDENCE PIPELINE',
            'title' => 'Evidenceを手渡す8段階で、Acceptanceまで進む。',
            'lead' => '契約固定から最終Acceptanceまで、各段階のEvidenceを次の入力へ渡します。',
            'body' => 'Task Dependency DAGは依存関係を示し、Parallel Writerの許可としては扱いません。',
        ],
        [
            'key' => 'architecture',
            'sort_order' => 50,
            'enabled' => true,
            'eyebrow' => '04 / ADR PATTERN',
            'title' => 'Action - Domain - Responderで、責務と依存方向を描く。',
            'lead' => '入口、use case、rule、I/O、data contract、副作用、read side、presentationを分けます。',
            'body' => 'このprojectでのADRはArchitecture Decision Recordではありません。必要な責務だけを配置し、業務判断と実装都合を混ぜません。',
        ],
        [
            'key' => 'development-stages',
            'sort_order' => 60,
            'enabled' => true,
            'eyebrow' => '05 / DEVELOPMENT STAGES',
            'title' => '段階を越えるときは、契約を渡して人間が判断する。',
            'lead' => 'IDEA BOARD、MOCK、PROTOTYPE、PRODUCTは確認対象も作らないものも異なります。',
            'body' => '前段階の成果は次の判断材料です。仮処理を流用せず、PROTOTYPEからPRODUCTへ自動昇格させません。',
        ],
        [
            'key' => 'quality-gates',
            'sort_order' => 70,
            'enabled' => true,
            'eyebrow' => '06 / FAIL CLOSED',
            'title' => 'Evidenceは独立した計器で測り、不明なら閉じる。',
            'lead' => 'Static、Installed、Runtime、Browser、Verification / Review、Human Reviewを分けます。',
            'body' => 'Evidence不足、矛盾、drift、権限不足、unknown stateでは、巨大なPASSへまとめず勝手に先へ進みません。',
        ],
        [
            'key' => 'improvement-loop',
            'sort_order' => 80,
            'enabled' => true,
            'eyebrow' => '07 / IMPROVEMENT LOOP',
            'title' => 'Findingを循環させ、適切な正本へ戻す。',
            'lead' => 'FindingからEvidence、root cause、scope、owner、Fix、Verify、Feedbackへ進みます。',
            'body' => '結果はCode、Test、Type、Docs、Policy、Checker、Sensors、Harnessから、原因を所有する適切な戻し先を選びます。',
        ],
        [
            'key' => 'closing',
            'sort_order' => 90,
            'enabled' => true,
            'eyebrow' => 'FINAL / HUMAN AUTHORITY',
            'title' => '実行可能であることを、実行してよいことへ変換しない。',
            'lead' => 'AI、tool、Capability、Writer Leaseが存在しても、Operation Authorityへ自動変換しません。',
            'body' => 'Evidenceと未確認事項を分け、最終Acceptanceと次の操作はHuman Judgmentへ戻します。',
        ],
    ],
];
