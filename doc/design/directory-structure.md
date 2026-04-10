# ディレクトリ構造設計

## 関連ドキュメント

- [アーキテクチャ設計](./architecture.md)
- [コンポーネント設計](./component-design.md)
- [ページ・ルーティング設計](./page-routing.md)
- [データモデル設計](./data-model.md)
- [UI/UX仕様](./ui-ux-spec.md)

---

## 1. プロジェクトルート構造

```
qr_code_create/
├── .claude/                    # Claude Code 設定
├── doc/                        # ドキュメント
│   ├── requirements.md
│   ├── marketing-strategy.md
│   └── design/                 # 設計ドキュメント（本ファイル群）
├── public/                     # 静的アセット（Next.js public）
│   ├── images/
│   │   ├── og/                 # OGP画像
│   │   ├── frames/             # フレーム素材画像
│   │   └── logo.png            # サイトロゴ
│   └── llms.txt                # AI検索向けサイト説明
├── src/                        # アプリケーションソースコード
├── tests/                      # テストファイル
│   ├── unit/                   # 単体テスト
│   ├── component/              # コンポーネントテスト
│   └── e2e/                    # E2Eテスト (Playwright)
├── .eslintrc.json
├── .prettierrc
├── jest.config.ts
├── playwright.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 2. src/ ディレクトリ詳細

```
src/
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # ルートレイアウト（フォント、GA4、共通構造）
│   ├── page.tsx                    # トップページ（/）
│   ├── not-found.tsx               # 404ページ
│   ├── sitemap.ts                  # サイトマップ生成
│   ├── robots.ts                   # robots.txt生成
│   ├── globals.css                 # グローバルCSS（CSS Custom Properties定義）
│   │
│   ├── (marketing)/                # Route Group: マーケティング系ページ
│   │   ├── layout.tsx              # マーケティングページ共通レイアウト
│   │   ├── guide/
│   │   │   ├── page.tsx            # ガイド一覧（/guide）
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # ガイド個別記事（/guide/[slug]）
│   │   ├── use-cases/
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # 用途別ページ（/use-cases/[slug]）
│   │   ├── industry/
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # 業種別ページ（/industry/[slug]）
│   │   ├── blog/
│   │   │   ├── page.tsx            # ブログ一覧（/blog）
│   │   │   ├── category/
│   │   │   │   └── [category]/
│   │   │   │       └── page.tsx    # カテゴリ別一覧（/blog/category/[category]）
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # ブログ個別記事（/blog/[slug]）
│   │   ├── compare/
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # 比較ページ（/compare/[slug]）
│   │   ├── faq/
│   │   │   └── page.tsx            # よくある質問（/faq）
│   │   ├── privacy/
│   │   │   └── page.tsx            # プライバシーポリシー（/privacy）
│   │   └── terms/
│   │       └── page.tsx            # 利用規約（/terms）
│   │
│   └── (tool)/                     # Route Group: ツール系ページ
│       ├── layout.tsx              # ツールページ共通レイアウト
│       └── create/
│           └── page.tsx            # QRコード生成ページ（/create）
│
├── components/                     # Reactコンポーネント
│   ├── ui/                         # 汎用UIコンポーネント
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.module.css
│   │   ├── Input/
│   │   │   ├── Input.tsx
│   │   │   └── Input.module.css
│   │   ├── Select/
│   │   │   ├── Select.tsx
│   │   │   └── Select.module.css
│   │   ├── Tooltip/
│   │   │   ├── Tooltip.tsx
│   │   │   └── Tooltip.module.css
│   │   ├── ColorPicker/
│   │   │   ├── ColorPicker.tsx
│   │   │   └── ColorPicker.module.css
│   │   ├── FileUpload/
│   │   │   ├── FileUpload.tsx
│   │   │   └── FileUpload.module.css
│   │   ├── ProgressBar/
│   │   │   ├── ProgressBar.tsx
│   │   │   └── ProgressBar.module.css
│   │   ├── Tabs/
│   │   │   ├── Tabs.tsx
│   │   │   └── Tabs.module.css
│   │   └── Breadcrumb/
│   │       ├── Breadcrumb.tsx
│   │       └── Breadcrumb.module.css
│   │
│   ├── layout/                     # レイアウトコンポーネント
│   │   ├── Header/
│   │   │   ├── Header.tsx
│   │   │   ├── Header.module.css
│   │   │   └── MobileNav.tsx       # 'use client'
│   │   ├── Footer/
│   │   │   ├── Footer.tsx
│   │   │   └── Footer.module.css
│   │   └── Container/
│   │       ├── Container.tsx
│   │       └── Container.module.css
│   │
│   ├── qr/                         # QRコード関連コンポーネント（全て 'use client'）
│   │   ├── QrGenerator/
│   │   │   ├── QrGenerator.tsx     # メインコンテナ（状態管理）
│   │   │   └── QrGenerator.module.css
│   │   ├── UrlInput/
│   │   │   ├── UrlInput.tsx
│   │   │   └── UrlInput.module.css
│   │   ├── UtmBuilder/
│   │   │   ├── UtmBuilder.tsx
│   │   │   ├── UtmBuilder.module.css
│   │   │   ├── UtmField.tsx
│   │   │   └── UtmGuide.tsx
│   │   ├── DecorationPanel/
│   │   │   ├── DecorationPanel.tsx
│   │   │   ├── DecorationPanel.module.css
│   │   │   ├── LogoUploader.tsx
│   │   │   ├── FrameSelector.tsx
│   │   │   ├── CaptionEditor.tsx
│   │   │   └── PresetSelector.tsx
│   │   ├── QrPreview/
│   │   │   ├── QrPreview.tsx
│   │   │   └── QrPreview.module.css
│   │   ├── QrDownload/
│   │   │   ├── QrDownload.tsx
│   │   │   └── QrDownload.module.css
│   │   └── EffectivenessIndicator/
│   │       ├── EffectivenessIndicator.tsx
│   │       └── EffectivenessIndicator.module.css
│   │
│   ├── marketing/                  # マーケティングページ用コンポーネント
│   │   ├── HeroSection/
│   │   │   ├── HeroSection.tsx
│   │   │   └── HeroSection.module.css
│   │   ├── FeatureCard/
│   │   │   ├── FeatureCard.tsx
│   │   │   └── FeatureCard.module.css
│   │   ├── UseCaseCard/
│   │   │   ├── UseCaseCard.tsx
│   │   │   └── UseCaseCard.module.css
│   │   ├── CtaButton/
│   │   │   ├── CtaButton.tsx
│   │   │   └── CtaButton.module.css
│   │   ├── ComparisonTable/
│   │   │   ├── ComparisonTable.tsx
│   │   │   └── ComparisonTable.module.css
│   │   └── MdxContent/
│   │       ├── MdxContent.tsx
│   │       └── MdxContent.module.css
│   │
│   └── seo/                        # SEO関連コンポーネント
│       └── JsonLd/
│           └── JsonLd.tsx          # Server Component
│
├── content/                        # MDXコンテンツファイル
│   ├── guide/
│   │   ├── utm-parameters.mdx
│   │   ├── effective-qr-usage.mdx
│   │   ├── design-tips.mdx
│   │   └── analytics-measurement.mdx
│   ├── use-cases/
│   │   ├── business-card.mdx
│   │   ├── flyer.mdx
│   │   ├── poster.mdx
│   │   ├── event.mdx
│   │   ├── store.mdx
│   │   ├── product-package.mdx
│   │   ├── receipt.mdx
│   │   ├── menu.mdx
│   │   └── signage.mdx
│   ├── industry/
│   │   ├── restaurant.mdx
│   │   ├── beauty-salon.mdx
│   │   ├── real-estate.mdx
│   │   ├── event-planning.mdx
│   │   ├── retail.mdx
│   │   ├── medical-clinic.mdx
│   │   └── education.mdx
│   ├── blog/
│   │   └── (記事MDXファイル)
│   └── compare/
│       ├── other-tools.mdx
│       └── qr-no-susume.mdx
│
├── lib/                            # ユーティリティ・ビジネスロジック
│   ├── content/
│   │   ├── getContent.ts           # MDXファイル読み込み（gray-matter）
│   │   ├── getContentList.ts       # コンテンツ一覧取得
│   │   └── getSlugs.ts             # slug一覧取得（generateStaticParams用）
│   ├── metadata/
│   │   └── generateMeta.ts         # ページメタデータ生成ヘルパー
│   ├── schema/
│   │   ├── buildWebApplicationSchema.ts
│   │   ├── buildFaqSchema.ts
│   │   ├── buildHowToSchema.ts
│   │   ├── buildBreadcrumbSchema.ts
│   │   ├── buildOrganizationSchema.ts
│   │   ├── buildArticleSchema.ts
│   │   └── buildBlogPostingSchema.ts
│   ├── analytics/
│   │   └── events.ts               # GA4カスタムイベント定義
│   ├── qr/
│   │   ├── generateQr.ts           # QRコード生成ロジック
│   │   ├── validateQr.ts           # QR読み取り可否検証
│   │   └── downloadQr.ts           # ダウンロード処理（PNG/SVG/PDF）
│   ├── url/
│   │   ├── buildUtmUrl.ts          # UTMパラメータ付きURL構築
│   │   └── validateUrl.ts          # URL形式バリデーション
│   ├── color/
│   │   └── contrastChecker.ts      # コントラスト比計算・警告判定
│   └── constants/
│       ├── utmPresets.ts           # UTMパラメータおすすめ値
│       ├── framePresets.ts         # フレームプリセットデータ
│       ├── decorationPresets.ts    # 装飾プリセット（シンプル等）
│       └── captionTemplates.ts     # キャプションテンプレート
│
└── types/                          # TypeScript型定義
    ├── content.ts                  # MDXコンテンツ関連の型
    ├── qr.ts                       # QRコード関連の型
    └── analytics.ts                # GA4イベント関連の型
```

---

## 3. 命名規則

### 3.1 ファイル・ディレクトリ

| 対象 | 規則 | 例 |
|---|---|---|
| コンポーネントディレクトリ | PascalCase | `Button/`, `QrGenerator/` |
| コンポーネントファイル (.tsx) | PascalCase | `Button.tsx`, `QrPreview.tsx` |
| CSS Modules ファイル | PascalCase + `.module.css` | `Button.module.css` |
| ユーティリティファイル (.ts) | camelCase | `buildUtmUrl.ts`, `generateMeta.ts` |
| 型定義ファイル (.ts) | camelCase | `content.ts`, `qr.ts` |
| MDXコンテンツファイル | kebab-case | `utm-parameters.mdx`, `business-card.mdx` |
| Next.js ルートファイル | 規定名 | `page.tsx`, `layout.tsx`, `not-found.tsx` |

### 3.2 エクスポート

| 対象 | 規則 | 例 |
|---|---|---|
| Reactコンポーネント | named export, PascalCase | `export function Button()` |
| ユーティリティ関数 | named export, camelCase | `export function buildUtmUrl()` |
| 型定義 | named export, PascalCase | `export type QrConfig = ...` |
| 定数 | named export, UPPER_SNAKE_CASE | `export const UTM_SOURCE_OPTIONS = ...` |

### 3.3 CSS Modules クラス名

- camelCase を使用する
- コンポーネント名をプレフィクスにしない（CSS Modulesがスコープを担保）
- 状態を表すクラスは `is` プレフィクスを使用

```css
/* Button.module.css */
.root { }
.label { }
.icon { }
.isDisabled { }
.isPrimary { }
```

---

## 4. Route Groups の設計意図

### 4.1 (marketing) グループ

マーケティング系のコンテンツページをまとめるRoute Group。URLには影響しない。

**共通レイアウト**:
- パンくずリスト表示
- サイドバーまたは関連コンテンツナビゲーション
- 記事下部のCTAセクション（「QRコードを作成する」ボタン）

### 4.2 (tool) グループ

ツール系ページ（現時点では `/create` のみ）のRoute Group。

**共通レイアウト**:
- ツール用のシンプルなレイアウト（サイドバーなし）
- ツール画面に特化したヘッダー
- フッターの最小化

---

## 5. テストディレクトリ構造

```
tests/
├── unit/
│   ├── lib/
│   │   ├── url/
│   │   │   ├── buildUtmUrl.test.ts
│   │   │   └── validateUrl.test.ts
│   │   ├── color/
│   │   │   └── contrastChecker.test.ts
│   │   └── qr/
│   │       ├── generateQr.test.ts
│   │       └── validateQr.test.ts
│   └── components/
│       ├── ui/
│       │   └── Button.test.tsx
│       └── qr/
│           ├── UrlInput.test.tsx
│           ├── UtmBuilder.test.tsx
│           └── QrPreview.test.tsx
├── component/
│   └── qr/
│       └── QrGenerator.test.tsx
└── e2e/
    ├── qr-creation-flow.spec.ts
    ├── download.spec.ts
    ├── navigation.spec.ts
    └── seo.spec.ts
```

テストファイルは `src/` 内ではなく `tests/` ディレクトリに集約する。ファイルパスの対応関係で対象ファイルを特定できるようにする。
