# 設計概要

QR Code Create の設計ドキュメントのエントリーポイント。

---

## プロダクト概要

QR Code Create は、URLからQRコードを生成する際にマーケティングに必要なUTMパラメータや装飾を「忘れずに」設定できるWebサービスである。単なるQRコード生成ではなく、マーケティング効果を最大化するためのガイド付きQRコード生成ツール。

- **ターゲット**: 日本の中小事業者・イベント主催者（マーケティング非専門家）
- **差別化**: UTMパラメータガイダンス + 装飾フレーム + 教育コンテンツ
- **技術方針**: フロントエンド完結（バックエンド・DB・認証なし）
- **完全無料・登録不要**

---

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | Next.js 15.x (App Router) |
| 言語 | TypeScript 5.x |
| スタイリング | CSS Modules + CSS Custom Properties |
| QRコード生成 | qrcode (npm) |
| PDF出力 | jsPDF |
| MDX解析 | gray-matter + next-mdx-remote |
| フォント | Noto Sans JP (next/font) |
| アナリティクス | GA4 (gtag.js) |
| デプロイ | Vercel |

**禁止事項**: Tailwind CSS の使用は禁止。CSS Modules + CSS Custom Properties を使用する。

---

## 設計ドキュメント一覧

### 1. [アーキテクチャ設計](./architecture.md)

全体のアーキテクチャ方針、技術スタック詳細、レンダリング戦略を定義する。

**主な内容**:
- システム構成図（Vercel + Next.js + クライアントサイドQR生成）
- 依存ライブラリとバージョン
- SSG/CSR判断（全ページSSG、`/create` のQR機能のみCSR）
- Server Components vs Client Components の分離方針
- データフロー（QR生成、MDXコンテンツ、GA4イベント）
- パフォーマンス戦略（コード分割、画像/フォント最適化）
- SEOアーキテクチャ（メタデータ管理、JSON-LD、サイトマップ）
- セキュリティ（入力バリデーション、CSP）
- テスト戦略
- ビルド・デプロイフロー

### 2. [ディレクトリ構造設計](./directory-structure.md)

プロジェクトのファイル・ディレクトリ構成を定義する。

**主な内容**:
- プロジェクトルート構造
- `src/` ディレクトリの全ファイル構造
  - `app/` (Next.js App Router ルーティング)
  - `components/` (ui / layout / qr / marketing / seo)
  - `content/` (MDXファイル)
  - `lib/` (ユーティリティ・ビジネスロジック)
  - `types/` (TypeScript型定義)
- 命名規則（ファイル、エクスポート、CSS Modulesクラス）
- Route Groups の設計意図（(marketing), (tool)）
- テストディレクトリ構造

### 3. [コンポーネント設計](./component-design.md)

全コンポーネントの階層構造、Props定義、責務を定義する。

**主な内容**:
- コンポーネント階層図
- QR関連コンポーネント（13コンポーネント）
  - QrGenerator（メインコンテナ、状態管理）
  - UrlInput, UtmBuilder, UtmField, UtmGuide
  - EffectivenessIndicator（マーケティング効果度の星表示）
  - DecorationPanel, PresetSelector, LogoUploader, FrameSelector, CaptionEditor
  - QrPreview, QrDownload
- UIコンポーネント（9コンポーネント）
  - Button, Input, Select, Tooltip, ColorPicker, FileUpload, ProgressBar, Tabs, Breadcrumb
- レイアウトコンポーネント（Header, Footer, Container）
- マーケティングコンポーネント（HeroSection, FeatureCard, UseCaseCard, CtaButton, ComparisonTable, MdxContent）
- SEOコンポーネント（JsonLd）

### 4. [ページ・ルーティング設計](./page-routing.md)

全ページのルーティング、レンダリング方式、メタデータ、内部リンク戦略を定義する。

**主な内容**:
- ルーティング全体図
- 各ページの詳細仕様（ファイル、レンダリング方式、コンテンツ構成、メタデータ、JSON-LD）
  - トップページ、QRコード生成、ガイド、用途別、業種別、ブログ、比較、FAQ、法的ページ
- レイアウト構造（ルート、(marketing)、(tool)）
- 内部リンク戦略（ハブ&スポーク、用途別→/create パラメータ渡し）
- サイトマップ生成
- robots.txt 生成
- 404ページ
- `generateStaticParams` の実装パターン

### 5. [データモデル設計](./data-model.md)

TypeScript型定義、MDXフロントマタースキーマ、定数データ、ユーティリティ関数のインターフェースを定義する。

**主な内容**:
- QRコード関連の型（UtmParams, DecorationConfig, QrState, DownloadOptions, QrValidationResult, ContrastResult 等）
- MDXコンテンツ関連の型（GuideFrontmatter, UseCaseFrontmatter, IndustryFrontmatter, BlogFrontmatter, CompareFrontmatter）
- GA4イベント関連の型（16種のカスタムイベント名とプロパティ型）
- 定数データ（UTMプリセット、装飾プリセット、フレーム情報、キャプションテンプレート）
- ユーティリティ関数の入出力型
- JSON-LDスキーマの型

### 6. [UI/UX仕様](./ui-ux-spec.md)

デザイントークン、画面レイアウト、インタラクション仕様、アクセシビリティ要件を定義する。

**主な内容**:
- デザイントークン（CSS Custom Properties）
  - カラーパレット、タイポグラフィ、スペーシング、レイアウト、ブレークポイント
- QRコード生成ページの詳細UI仕様
  - 全体レイアウト（デスクトップ2カラム / スマホ1カラム）
  - ステップ1〜3とダウンロードの画面仕様
  - ツールチップの内容
- プログレッシブディスクロージャー仕様
  - ステップ遷移ルール
  - ProgressBar完了度の算出ロジック
- トップページのUI仕様
- マーケティングページの共通UI仕様
- レスポンシブデザイン方針
- アクセシビリティ（WCAG 2.1 AA準拠、キーボード操作、ARIA属性、スクリーンリーダー対応）
- マイクロインタラクション
- エラー・警告表示パターン

---

## 設計上の重要な判断

### CRO施策の組み込み

[マーケティング戦略](../marketing-strategy.md) に基づき、以下の心理学原則をUIに組み込んでいる。

| 原則 | 適用箇所 | 実装コンポーネント |
|---|---|---|
| Goal-Gradient Effect | 進捗バー | ProgressBar |
| IKEA Effect | 装飾カスタマイズ | DecorationPanel |
| Default Effect | utm_medium=qr デフォルト | UtmBuilder |
| Zeigarnik Effect | 「あと1ステップ」メッセージ | ProgressBar |
| Loss Aversion | UTM未設定警告 | UtmBuilder |
| プログレッシブディスクロージャー | ステップ別展開 | QrGenerator |

### Client Component の最小化

パフォーマンスとSEOの両立のため、Client Component は QRコード生成機能（`QrGenerator` 以下）とモバイルナビゲーション（`MobileNav`）に限定する。全ページの `page.tsx` は Server Component とし、`export const metadata` によるメタデータ生成を可能にする。

### MDXによるコンテンツ管理

マーケティングコンテンツ（ガイド、用途別、業種別、ブログ、比較）は全て MDX ファイルで管理し、ビルド時に静的生成する。これにより CMS 不要でコンテンツ更新が可能となる。

---

## 参照ドキュメント

- [要件定義書](../requirements.md)
- [マーケティング戦略](../marketing-strategy.md)
