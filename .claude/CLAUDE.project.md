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
- 日本語UIのみ（Phase 1）
