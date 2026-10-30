# プロジェクト固有設定

## 技術スタック

### Next.js（SSR/SSG対応、SEO重要）
- フレームワーク: Next.js (App Router)
- デプロイ: Vercel

### 共通
- DB/Auth: 不要（フロントエンドのみで完結）
- タスク管理: Beads
- テスト: Jest（+ Playwright: E2E）
- スタイリング: CSS Modules + CSS Custom Properties（Tailwind CSS は禁止）

## Git戦略

### ブランチ構成
- `main`: メインブランチ
- `dev`: 開発ブランチ（featureブランチのマージ先）
- `feature/bd-{beads-id}`: タスクごとのブランチ

### ルール
- Git Worktreeを使い、並行で進められるタスクは並行で進める
- featureブランチはBeadsのIDを使って命名する

## 要件定義ドキュメント

- 配置先: `doc/requirements.md`
- マーケティング戦略: `doc/marketing-strategy.md`

## 設計ドキュメント構成

- `doc/design/overview.md`: 設計概要
- `doc/design/architecture.md`: アーキテクチャ設計
- `doc/design/directory-structure.md`: ディレクトリ構造設計
- `doc/design/component-design.md`: コンポーネント設計
- `doc/design/page-routing.md`: ページ・ルーティング設計
- `doc/design/data-model.md`: データモデル設計
- `doc/design/ui-ux-spec.md`: UI/UX仕様

## プロジェクト固有ルール

- バックエンド・DB・認証は不要。すべてフロントエンドで完結する
- QRコード生成はクライアントサイドで完結（qrcodeライブラリ使用）
- 画像ダウンロードもクライアントサイドで実行
- UIは日本語が主。en / es / pt-br / de はトップ・作成・getting-started の3ページのみ（`doc/design/i18n-en.md`、`doc/design/i18n-multi.md`）

## プロジェクト追加エージェント

| エージェント | ファイル | 役割 |
|---|---|---|
| SEOスペシャリスト | `seo-specialist.md` | 技術的SEO・多言語SEO・構造化データ・AI検索・記事の監査と改善案（読み取り専用） |

- `security-specialist.md` は、このプロジェクト（DB・認証なしの静的サイト）の脅威に合わせて書き直してある（入力とXSS、セキュリティヘッダーとCSP、外部スクリプト、ブラウザの保存領域、依存パッケージ）
- どちらも助言のみ。指摘はPMがBeadsタスクに分け、`/dev-task` で反映する

## 作業の区切りでの Git と Beads の同期（PM必須手順）

ユーザーは作業の区切りで Claude Code を終了し、翌日などにコンテキストが空の状態から再開することがある。再開したときに Git と Beads だけで状況が分かるよう、作業を止めるときは必ず両方を同期する。

### いつ行うか
- ユーザーに問い合わせる、または判断を委ねて作業が止まるとき（本番反映の可否、設計の承認、権限が要る操作の依頼など）
- 判断を委ねなくても、作業の終了を報告するとき

### 手順（git-manager と beads-manager に順番に依頼する。並行させない）
1. **Beads**: 進めていたタスクの状態を実態に合わせる（完了ならクローズし、完了記録を本文に残す。途中なら notes に進み具合を追記する）
2. **Beads**: 区切りの記録として、ラベル `user-waiting` のタスクを 1 件作る
   - タイトル: 判断待ちなら「【ユーザー待ち】{判断してほしいこと}」、終了報告なら「【完了報告】{終わったこと}」
   - 本文: 終わったこと、ユーザーに判断してほしいこと（選択肢と推奨）、判断のあとに PM がやること、関係するブランチ・コミット・タスク ID
   - status は `blocked`（`bd ready` に出さず、エージェントが勝手に着手しないようにする）
3. **Git**: Beads の変更（`.beads/issues.jsonl`）を含めて作業ブランチにコミットし、GitHub に push する（dev、作業中の feature ブランチ）。ユーザーの承認は不要
   - main への反映は本番デプロイ（Vercel）になるので、これまでどおりユーザーの承認を得てから行う
   - `.claude/settings.local.json` と `next-env.d.ts` はコミットしない
4. **確認**: `git status` で未コミットの差分がないこと（上の 2 ファイルを除く）、`git log origin/{branch}..{branch}` が空であることを確かめてから、ユーザーに報告する

### 再開したとき
- 最初に `bd list --label user-waiting --status blocked` で待ちのタスクを見て、状況を把握する
- ユーザーが判断したら、そのタスクに判断の内容を追記してクローズし、続きの作業に進む
