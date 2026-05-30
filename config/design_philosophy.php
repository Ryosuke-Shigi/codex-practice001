<?php

return [
    /*
     * Design Philosophy LP の本文データです。
     * 追加、除外、並び替えは enabled と sort_order で制御し、
     * React 側には固定配列を持たせません。
     *
     * 本番で config:cache を使っている環境では、このファイルを変更した後に
     * config cache を再生成する必要があります。DB・S3・画像URLは今回扱いません。
     */
    'sections' => [
        [
            'key' => 'hero',
            'sort_order' => 10,
            'enabled' => true,
            'title' => 'AIに丸投げしない。',
            'lead' => '仕様・責務・判断は人間が握る。',
            'body' => 'AIは実装速度を上げる補助として使い、完成判断は人間が行う。',
            'proof_label' => '開発運用',
            'proof_text' => 'ChatGPTで仕様整理し、CodexAppで実装し、GitHub差分とテストで確認する。',
        ],
        [
            'key' => 'agent-guide',
            'sort_order' => 20,
            'enabled' => true,
            'title' => 'AGENTS.mdでAIの作業範囲を固定する。',
            'lead' => 'AIに自由に作らせない。',
            'body' => 'ルール、責務境界、禁止事項、テスト方針を先に渡す。',
            'proof_label' => '作業入口',
            'proof_text' => 'AIが最初に読む入口としてAGENTS.mdを置き、作業前に参照すべきdocsを明示する。',
        ],
        [
            'key' => 'spec-first',
            'sort_order' => 30,
            'enabled' => true,
            'title' => 'コードを書く前に仕様を決める。',
            'lead' => '目的、入力、出力、成功条件を先に整理する。',
            'body' => '実装は仕様と責務が見えてから進める。',
            'proof_label' => '仕様整理',
            'proof_text' => '何を作るか、何を作らないか、完成条件を先に決めてから差分を作る。',
        ],
        [
            'key' => 'dto-boundary',
            'sort_order' => 40,
            'enabled' => true,
            'title' => 'DTO / ListDTOを境界にする。',
            'lead' => 'レイヤー間で何を渡すかを固定する。',
            'body' => '責務混在を防ぎ、テストしやすい構造にする。',
            'proof_label' => 'DTO運用',
            'proof_text' => '配列やModelを曖昧に渡さず、画面やユースケースが必要な値をDTOで明示する。',
        ],
        [
            'key' => 'layered-architecture',
            'sort_order' => 50,
            'enabled' => true,
            'title' => 'ADR / レイヤードで責務を分ける。',
            'lead' => 'どこに何を書くかを曖昧にしない。',
            'body' => 'Action、Service、Repository、Responderの責務を分ける。',
            'proof_label' => '責務分離',
            'proof_text' => 'Controllerは入口、Actionは手順、Serviceは判断、Repositoryはデータ境界、Responderは出力整形に限定する。',
        ],
        [
            'key' => 'tdd-guardrail',
            'sort_order' => 60,
            'enabled' => true,
            'title' => 'TDDはAI実装のガードレール。',
            'lead' => 'AIが壊してはいけない仕様をテストで固定する。',
            'body' => '動いた気がする、ではなく、テストで確認できる状態にする。',
            'proof_label' => 'テスト方針',
            'proof_text' => 'Featureテストで画面導線とpropsを守り、UnitテストでActionやDTO境界を確認する。',
        ],
        [
            'key' => 'review-flow',
            'sort_order' => 70,
            'enabled' => true,
            'title' => '差分を見て、人間が採用する。',
            'lead' => 'テスト、GitHub差分、レビューで確認する。',
            'body' => 'AIの出力をそのまま完成扱いにしない。',
            'proof_label' => 'レビュー',
            'proof_text' => '目的外の変更、責務違反、テスト不足、秘密情報の混入がないかを確認してから採用する。',
        ],
        [
            'key' => 'closing',
            'sort_order' => 80,
            'enabled' => true,
            'title' => '後から読めて、直せて、説明できる構造へ。',
            'lead' => '速く作るだけで終わらせない。',
            'body' => '保守できるポートフォリオとして、設計思想ごと見せる。',
            'proof_label' => '完成判定',
            'proof_text' => '成果物だけではなく、判断の順番、責務境界、確認方法まで説明できる状態にする。',
        ],
    ],
];
