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
            'key' => 'overview',
            'sort_order' => 10,
            'enabled' => true,
            'title' => 'この設計思想について。',
            'lead' => 'できている範囲を大きく見せるためではなく、変更しながら壊しにくくするための判断基準です。',
            'body' => 'このページでは、なぜ責務、段階、確認手段を分けるのかを説明します。できている範囲を大きく見せるためではなく、後から読んで直せる状態を保つための考え方です。',
            'proof_label' => '扱っていること',
            'proof_text' => 'READMEは概要に留め、詳細な判断理由はDesign Philosophy画面とdocsへ分けます。',
        ],
        [
            'key' => 'responsibility-boundaries',
            'sort_order' => 20,
            'enabled' => true,
            'title' => '責務を分ける理由。',
            'lead' => '変更箇所と原因調査の範囲を狭める。',
            'body' => 'Controller / Requestは入口と入力形式、Actionは手順、Serviceは判断、Repositoryはデータ境界、DTOは受け渡し、Responderは出力整形、Componentは表示を担当します。',
            'proof_label' => '責務境界',
            'proof_text' => 'どこを直すべきかを、入力、手順、判断、取得、整形、表示に分けて確認できるようにします。',
        ],
        [
            'key' => 'staged-development',
            'sort_order' => 30,
            'enabled' => true,
            'title' => '段階を分ける理由。',
            'lead' => '構想、UI確認、接続検証、本実装を混ぜない。',
            'body' => 'IDEA BOARD / MOCK / PROTOTYPE / PRODUCT は目的が違います。速く作った固定データや仮処理を、そのまま完成扱いにしないために段階を分けます。',
            'proof_label' => '段階設計',
            'proof_text' => '各段階で確認したことを、次の段階で仕様、UI契約、責務境界、テスト観点へ変換します。',
        ],
        [
            'key' => 'feedback-controls',
            'sort_order' => 40,
            'enabled' => true,
            'title' => 'docs / test / PR / Sensorsを使う理由。',
            'lead' => '設計を言いっぱなしにせず、変更後のズレを検出する。',
            'body' => 'docsは目的と責務、testは実行可能な仕様、PRは差分確認、Sensorsは漏れや危険変更を見つける台帳として扱います。',
            'proof_label' => '確認手段',
            'proof_text' => '空白崩れ、docs更新漏れ、責務境界の崩れ、secrets混入、理解再起動に必要な情報の戻し漏れを確認対象にします。',
        ],
        [
            'key' => 'human-led-ai',
            'sort_order' => 50,
            'enabled' => true,
            'title' => 'AI駆動開発で人間が握るもの。',
            'lead' => 'AIは補助、人間は仕様・責務境界・完成判定を持つ。',
            'body' => 'AIは調査、実装補助、差分修正、レビュー補助に使います。何を作るか、どこに責務を置くか、完了とするか、mergeするかは人間が判断します。',
            'proof_label' => '判断主体',
            'proof_text' => 'AIに丸投げするのではなく、構造と判断を人間側に残し、差分と確認結果をレビューできる形にします。',
        ],
        [
            'key' => 'understanding-reboot',
            'sort_order' => 60,
            'enabled' => true,
            'title' => '理解再起動を重視する理由。',
            'lead' => '後から読んでも、意図と変更時の注意を回収できる状態にする。',
            'body' => 'docs、型、コメント、テストから、目的、責務、入力、出力、禁止事項、変更時の注意を読み直せる状態にします。',
            'proof_label' => '読み直せる状態',
            'proof_text' => '会話や一時メモに依存せず、コードとdocsから次の作業者が安全に再開できる構造を残します。',
        ],
    ],
];
