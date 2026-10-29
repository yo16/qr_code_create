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
