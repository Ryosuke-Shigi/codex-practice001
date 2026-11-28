import type { ReactNode } from 'react';
import { DevelopmentStageIllustration, StrategySwapIllustration, type DevelopmentStageDrawing } from './PhilosophyDiagramArt';
import type { PhilosophyTopicDetailKey } from './philosophyTopics';

type Node = readonly [name: string, description: string];
type FlowStep = readonly [name: string, description: string, drawing?: DevelopmentStageDrawing];
type Transfer = readonly [from: string, value: string, to: string];

function Point({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="dp-point" data-scroll-reveal>
            <h3>{title}</h3>
            <p>{children}</p>
        </div>
    );
}

type DiagramVariant = 'layers' | 'swap' | 'assemble' | 'stages' | 'handoff';

function Diagram({ title, children, variant }: { title: string; children: ReactNode; variant?: DiagramVariant }) {
    return (
        <figure className="dp-diagram" data-diagram={variant} data-scroll-reveal>
            <figcaption>{title}</figcaption>
            {children}
        </figure>
    );
}

function Nodes({ items }: { items: readonly Node[] }) {
    return (
        <dl className="dp-diagram-nodes">
            {items.map(([name, description]) => (
                <div key={name}>
                    <dt>{name}</dt>
                    <dd>{description}</dd>
                </div>
            ))}
        </dl>
    );
}

function Flow({ steps }: { steps: readonly FlowStep[] }) {
    return (
        <ol className={steps.length > 4 ? 'dp-diagram-flow dp-diagram-flow--long' : 'dp-diagram-flow'}>
            {steps.map(([name, description, drawing], index) => (
                <li key={name}>
                    {index > 0 && <span className="dp-diagram-arrow" aria-hidden="true" />}
                    {drawing && <DevelopmentStageIllustration drawing={drawing} />}
                    <strong>{name}</strong>
                    <span>{description}</span>
                </li>
            ))}
        </ol>
    );
}

function Transfers({ items }: { items: readonly Transfer[] }) {
    return (
        <ul className="dp-diagram-transfers">
            {items.map(([from, value, to]) => (
                <li key={from + '/' + to}>
                    <span>{from}<span className="dp-visually-hidden">から</span></span>
                    <small><i aria-hidden="true" />{value}</small>
                    <span>{to}<span className="dp-visually-hidden">へ</span></span>
                </li>
            ))}
        </ul>
    );
}

function Example({ children }: { children: ReactNode }) {
    return (
        <div className="dp-story" data-scroll-reveal>
            <h3>実装事例</h3>
            {children}
        </div>
    );
}

function Architecture() {
    return (
        <>
            <Point title="責務の分離">
                ADR（Action–Domain–Responder）とレイヤードアーキテクチャを軸に、処理手順、業務判断、データ入出力、表示の責務を分けます。
            </Point>
            <Diagram title="ADRの責務構造" variant="layers">
                <Nodes items={[
                    ['Action', 'ユースケースの手順を組み立てる'],
                    ['Domain', '業務判断やデータ入出力を、必要な担当が受け持つ'],
                    ['Responder', '処理結果を利用先に合わせて整える'],
                ]} />
            </Diagram>
            <Point title="処理のつながり">
                Actionは処理に必要な担当を呼び出します。DTOは担当間で受け渡す値を表し、必要な責務だけを組み合わせます。
            </Point>
            <Diagram title="LinksLauncherのHTTP処理">
                <Transfers items={[
                    ['HTTP Request', '参照するリンク集と選択情報', 'Controller'],
                    ['Controller', '入力DTO', 'Action'],
                    ['Action', 'リンク集と公開リンクの取得依頼', 'Repository'],
                    ['Repository', '取得したデータ', 'Action'],
                    ['Action', '結果DTO', 'Controller'],
                    ['Controller', 'Requestと結果DTO', 'Responder'],
                    ['Responder', 'Inertiaの表示データ', 'React'],
                ]} />
            </Diagram>
            <Diagram title="必要に応じて使う担当">
                <Nodes items={[
                    ['Controller / Request', 'HTTPの入口。必要な場合はFormRequestに入力検証を委ねる'],
                    ['Service', '業務ルールに沿った判断を担当する'],
                    ['Repository', 'データの取得・保存を担当する'],
                    ['React', '渡された表示データから画面と操作を組み立てる'],
                ]} />
            </Diagram>
            <Example>
                <p>LinksLauncherでは、Repositoryでデータを取得し、Actionで参照手順を組み立てます。Responderが表示データを整え、Reactが画面を表示します。</p>
            </Example>
        </>
    );
}

function Change() {
    return (
        <>
            <Point title="変更理由を分ける">
                業務ルール、データ取得、画面表示を分け、それぞれの変更が他の責務へ広がりにくい構造を目指します。
            </Point>
            <Point title="必要な設計パターンを選ぶ">
                Strategy、Factory、Repositoryは、処理の違いや差し替えを整理する必要がある場面で使います。
            </Point>
            <Diagram title="DanceShortsRadarの表示カード取得" variant="swap">
                <StrategySwapIllustration />
                <Transfers items={[['解決済みの画面タブ', 'タブに対応する方式を選ぶ', 'Factory']]} />
                <div className="dp-diagram-branch">
                    <p>選択されたStrategyが表示カードを取得</p>
                    <Nodes items={[
                        ['上昇候補', '上昇候補のカードを取得'],
                        ['まとめ', 'まとめランキングのカードを取得'],
                        ['地域別', '選択地域のランキングカードを取得'],
                    ]} />
                </div>
            </Diagram>
            <Diagram title="差し替えを支える一般的な境界">
                <Transfers items={[
                    ['処理の手順', '取得・保存を依頼', 'Repository'],
                    ['表示用データの契約', '必要な値を受け渡す', '表示Component'],
                ]} />
            </Diagram>
            <Example>
                <p>DanceShortsRadarでは、選んだタブに応じて、用意済みのランキングから表示カードを取得する方式を切り替えています。</p>
                <p>API Catalogでは、一覧データの再取得を検索操作や画面移動から分けました。操作が重なる条件をテストで再現し、遅れて届いた応答が利用者の操作を上書きしないことを確かめています。</p>
            </Example>
        </>
    );
}

function Understanding() {
    return (
        <>
            <Point title="意図を残す">
                型で入出力を、コメントで判断理由を、文書で機能の制約を、テストで期待する動作をたどれるようにします。
            </Point>
            <Diagram title="異なる手掛かりを合わせて設計意図をたどる" variant="assemble">
                <Nodes items={[
                    ['コード', '実際に行う処理'],
                    ['型', '入出力の形と制約'],
                    ['コメント', '選択の理由と注意点'],
                    ['文書', '機能の目的と境界'],
                    ['テスト', '期待する動作と失敗条件'],
                ]} />
                <p className="dp-diagram-result"><span aria-hidden="true">↓</span> 設計の目的・責務・制約</p>
            </Diagram>
            <Point title="実装と説明を一致させる">
                変更時にはコードと型、PHPDoc、JSDoc、文書、テストの整合を確かめます。情報源ごとの役割に合わせて必要な手掛かりを残します。
            </Point>
            <Example>
                <p>LinksLauncherでは、公開中で表示対象が0件の場合と、非公開の場合の違いを、仕様文書・型・Featureテストから確認できます。</p>
                <p>開発環境の導入手順では、設定例と確認方法を文書に残し、内容レビューと自動検査で別々に見つかった不足を修正しました。</p>
                <p>DanceShortsAnalyzerでは、欠測をゼロに置き換えず、比較区間や丸めによる表示を区別しました。確認済みの入力条件で新旧の表示用データと数値を照合しています。</p>
            </Example>
        </>
    );
}

function DevelopmentStages() {
    return (
        <>
            <Point title="開発段階を分ける">
                構想、画面試作、導線確認、本実装を分け、それぞれの段階で確認した成果を次へ引き継ぎます。
            </Point>
            <Diagram title="開発段階と次に渡す成果" variant="stages">
                <Flow steps={[
                    ['IDEA BOARD', '目的・未確定事項を整理する', 'idea'],
                    ['MOCK', '一画面の構成と主要な表示状態を確かめる', 'mock'],
                    ['PROTOTYPE', '画面間の導線と状態の変化を確かめる', 'prototype'],
                    ['PRODUCT', '確認した振る舞いをテストで定め、本実装する', 'product'],
                ]} />
            </Diagram>
            <Point title="仕様をテストで確かめる">
                必要な振る舞いをテストで定め、実装と改善を繰り返します。
            </Point>
            <Diagram title="TDDで進める実装">
                <Flow steps={[
                    ['Red', '期待する振る舞いをテストで書き、失敗を確認する'],
                    ['Green', 'テストが通る実装を作る'],
                    ['Refactor', '振る舞いを保ちながら構造を整える'],
                ]} />
            </Diagram>
        </>
    );
}

function Improvement() {
    return (
        <>
            <Point title="問題を発見し、改善する">
                実画面の確認、テスト、差分レビューで見つかった問題を調べ、修正した結果を再確認します。
            </Point>
            <Diagram title="指摘から再確認まで">
                <Flow steps={[
                    ['指摘', '確認した事実を記録する'],
                    ['原因特定', '影響する責務と再現条件を調べる'],
                    ['修正', '原因がある箇所を直す'],
                    ['再確認', '同じ条件と必要な回帰範囲を確かめる'],
                ]} />
            </Diagram>
            <Example>
                <p>DanceShortsRadarでは、別担当による確認で、補足情報への到達、数値の符号、選択状態の色に問題が見つかりました。指摘箇所を修正し、確認した条件で再検証しました。</p>
            </Example>
        </>
    );
}

function NoTrust() {
    return (
        <>
            <Point title="ノートラスト">
                AIの回答をそのまま事実として扱わず、主張・証拠・操作の許可・完成判断を区別します。
            </Point>
            <Diagram title="区別して確かめる四つの要素">
                <Nodes items={[
                    ['主張', 'AIや作業者が述べたこと'],
                    ['証拠', '対象と条件を照合できる確認結果'],
                    ['操作の許可', '誰がどの操作を許可できるか'],
                    ['完成判断', '確認結果と未確認事項を踏まえた人の判断'],
                ]} />
            </Diagram>
        </>
    );
}

function Roles() {
    return (
        <>
            <Point title="開発を支える仕組み">
                仕様整理、実装、検証、レビューの役割を分け、作業条件と確認結果を次の担当へ渡します。
            </Point>
            <Diagram title="担当間で受け渡すもの" variant="handoff">
                <Transfers items={[
                    ['開発者', '目的・操作の許可', '進行管理'],
                    ['技術相談', '必要なときの助言', '進行管理'],
                    ['進行管理', '作業条件・修正依頼', '実装担当'],
                    ['実装担当', '対象版の成果物', '検証担当'],
                    ['実装担当', '対象版の差分', 'レビュー担当'],
                    ['検証担当', '確認結果・未確認事項', '進行管理'],
                    ['レビュー担当', '指摘・照合結果', '進行管理'],
                    ['進行管理', '確認結果と残る判断事項', '開発者'],
                ]} />
            </Diagram>
            <Example>
                <p>このポートフォリオでは、同時に編集する担当を一人にし、対象版と確認条件を別の担当に渡して照合します（Single Writerと独立確認）。</p>
            </Example>
        </>
    );
}

function AiProcess() {
    return (
        <Diagram title="作業条件から最終判断まで">
            <Flow steps={[
                ['作業条件', '目的・範囲・許可と受入条件を定める'],
                ['調査', '根拠となる資料・コード・既存の挙動を確認する'],
                ['実装', '合意した条件で成果物を作る'],
                ['検証', '対象版に対して動作と結果を確かめる'],
                ['レビュー', '差分と証拠を照合し、指摘があれば修正へ戻す'],
                ['最終判断', '開発者が確認結果と未確認事項から判断する'],
            ]} />
        </Diagram>
    );
}

function Evidence() {
    return (
        <Point title="確認と証拠">
            テスト結果、実画面、差分などの証拠を対象版と確認条件に結び付けます。検証とレビューは編集担当と分け、確認できたことと未確認事項を記録します。
        </Point>
    );
}

function Closing() {
    return (
        <Point title="人が判断する">
            確認結果と未確認事項を整理し、人が設計の採否と完成を判断します。
        </Point>
    );
}

const detailComponents = {
    architecture: Architecture,
    'change-module': Change,
    'understanding-notes': Understanding,
    'development-stages': DevelopmentStages,
    'improvement-loop': Improvement,
    principles: NoTrust,
    'human-ai-roles': Roles,
    'ai-development-flow': AiProcess,
    'quality-gates': Evidence,
    closing: Closing,
} satisfies Record<PhilosophyTopicDetailKey, () => ReactNode>;

export default function PhilosophyTopicDetail({ kind }: { kind: PhilosophyTopicDetailKey }) {
    const Detail = detailComponents[kind];
    return <Detail />;
}
