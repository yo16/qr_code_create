# アーキテクチャ設計

## 関連ドキュメント

- [ディレクトリ構造設計](./directory-structure.md)
- [コンポーネント設計](./component-design.md)
- [ページ・ルーティング設計](./page-routing.md)
- [データモデル設計](./data-model.md)
- [UI/UX仕様](./ui-ux-spec.md)
- [要件定義書](../requirements.md)
- [マーケティング戦略](../marketing-strategy.md)

---

## 1. アーキテクチャ概要

### 1.1 方針

QR Code Create は Next.js App Router ベースの**フロントエンド完結型アプリケーション**である。バックエンド API・データベース・認証は不要であり、すべての処理をクライアントサイドまたはビルド時の静的生成で完結させる。

```
┌─────────────────────────────────────────────────────┐
│                     Vercel                          │
│  ┌───────────────────────────────────────────────┐  │
│  │           Next.js App Router                  │  │
│  │                                               │  │
│  │  ┌─────────────┐   ┌──────────────────────┐   │  │
│  │  │   SSG Pages  │   │  Client Components   │   │  │
│  │  │  (marketing) │   │   (QR Generator)     │   │  │
│  │  └─────────────┘   └──────────────────────┘   │  │
│  │                                               │  │
│  │  ┌─────────────┐   ┌──────────────────────┐   │  │
│  │  │ MDX Content │   │  Static Assets       │   │  │
│  │  │ (gray-matter)│   │  (images, fonts)     │   │  │
│  │  └─────────────┘   └──────────────────────┘   │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  CDN Edge Cache                                     │
└─────────────────────────────────────────────────────┘
         │                        │
    SSG HTML/CSS/JS          GA4 (gtag.js)
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────┐
│   ブラウザ       │    │  Google Analytics │
│  QR生成処理      │    │  イベント収集     │
│  画像ダウンロード │    │                  │
│  ロゴアップロード │    │                  │
└─────────────────┘    └──────────────────┘
```

### 1.2 技術スタック

| カテゴリ | 技術 | バージョン（推奨） | 用途 |
|---|---|---|---|
| フレームワーク | Next.js (App Router) | 15.x | SSG/SSR、ルーティング、メタデータ |
| 言語 | TypeScript | 5.x | 型安全なコード |
| スタイリング | CSS Modules + CSS Custom Properties | - | コンポーネントスコープのスタイル |
| QRコード生成 | qrcode (npm) | 1.5.x | QRコード画像生成 |
| PDF出力 | jsPDF | 2.5.x | PDF形式でのダウンロード |
| HTML→画像変換（ポスター用） | html2canvas | 1.4.x | `/poster` のA4 2x2 PDF生成（HTML要素を画像化してjsPDFへ渡す） |
| MDX解析 | gray-matter | 4.0.x | フロントマター解析 |
| MDXレンダリング | next-mdx-remote | 5.x | MDXコンテンツのレンダリング |
| GFM拡張 | remark-gfm | 4.x | テーブル・打ち消し線等のGFM構文対応 |
| フォント | next/font (Noto Sans JP) | - | Webフォント最適化 |
| アナリティクス | GA4 (gtag.js) | - | イベントトラッキング |
| デプロイ | Vercel | - | ホスティング・CDN |
| リンター | ESLint + Prettier | - | コード品質 |

### 1.3 依存ライブラリ詳細

```json
{
  "dependencies": {
    "next": "16.4.2",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "qrcode": "^1.5.4",
    "jspdf": "^2.5.2",
    "html2canvas": "^1.4.1",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0",
    "gray-matter": "^4.0.3",
    "next-mdx-remote": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/qrcode": "^1.5.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "prettier": "^3.4.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "@playwright/test": "^1.49.0"
  }
}
```

---

## 2. レンダリング戦略

### 2.1 ページ別レンダリング方式

| ページ | 方式 | 理由 |
|---|---|---|
| `/` (トップ) | SSG | 静的マーケティングページ。変更頻度低い |
| `/create` | SSG + CSR | ページシェルはSSG。QR生成ロジックはClient Component |
| `/guide/*` | SSG (generateStaticParams) | MDXコンテンツから静的生成 |
| `/use-cases/*` | SSG (generateStaticParams) | MDXコンテンツから静的生成 |
| `/industry/*` | SSG (generateStaticParams) | MDXコンテンツから静的生成 |
| `/blog` (一覧) | SSG | MDX一覧の静的生成 |
| `/blog/[slug]` | SSG (generateStaticParams) | MDXコンテンツから静的生成 |
| `/blog/category/[category]` | SSG (generateStaticParams) | カテゴリ一覧の静的生成 |
| `/compare/*` | SSG (generateStaticParams) | MDXコンテンツから静的生成 |
| `/faq` | SSG | 静的ページ |
| `/privacy` | SSG | 静的ページ |
| `/terms` | SSG | 静的ページ |

### 2.2 Server Components vs Client Components

**原則**: ページレベル（`page.tsx`）は全てServer Componentとし、`export const metadata` を使ったメタデータ生成を行う。インタラクティブな部分のみ Client Component として切り出す。

```
page.tsx (Server Component)
├── metadata export        ← Server Componentだからこそ可能
├── JsonLd コンポーネント   ← Server Component
├── 静的コンテンツ部分      ← Server Component
└── QrGenerator            ← 'use client' (Client Component)
    ├── UrlInput
    ├── UtmBuilder
    ├── DecorationPanel
    ├── QrPreview
    └── QrDownload
```

**Client Component にする基準**:
- `useState`, `useEffect`, `useRef` 等の React hooks を使用する
- ブラウザ API（File API, Canvas API 等）にアクセスする
- ユーザーイベント（onClick, onChange 等）を直接ハンドルする

**Client Component の一覧**:
- `QrGenerator` およびその子コンポーネント全て
- `ColorPicker`
- `LogoUploader`
- `FrameSelector`
- `CaptionEditor`
- `PresetSelector`
- `ProgressBar`（インタラクティブな進捗表示）
- モバイルハンバーガーメニュー（`MobileNav`）

---

## 3. データフロー

### 3.1 QRコード生成のデータフロー

```
[UrlInput]──────┐
                │
[UtmBuilder]────┤
                ├──→ [QrState (useState)] ──→ [QrPreview]
[DecorationPanel]                               │
  ├─ ColorPicker                                │
  ├─ LogoUploader                               ├──→ [QrDownload]
  ├─ FrameSelector                              │
  ├─ CaptionEditor                              │
  └─ PresetSelector                             │
                                                │
[ProgressBar] ←─── QrState の入力完了度を算出 ──┘
```

- 全状態は `QrGenerator` コンポーネント内の `useState` で管理する
- 外部状態管理ライブラリ（Redux, Zustand等）は不要（単一ページ内の状態のみ）
- QRコード生成は入力変更から 500ms のデバウンスを挟んでからプレビュー更新

### 3.2 MDXコンテンツのデータフロー

```
ビルド時:
  src/content/**/*.mdx
    ↓ gray-matter で解析
  { frontmatter, content }
    ↓ generateStaticParams で slug 一覧取得
  各ページの静的HTML生成
    ↓ next-mdx-remote でMDXレンダリング
  完成ページ

リクエスト時:
  CDN → 静的HTMLをそのまま配信
```

### 3.3 GA4イベントのデータフロー

```
Client Component内のユーザー操作
  ↓ lib/analytics/events.ts の関数呼び出し
  ↓ window.gtag('event', eventName, params)
Google Analytics 4 へ送信
```

- GA4スクリプトは `app/layout.tsx` で `next/script` (`strategy="afterInteractive"`) を使って読み込む
- 全16種のカスタムイベントを `lib/analytics/events.ts` に定義する（[マーケティング戦略 セクション10](../marketing-strategy.md) 参照）

---

## 4. パフォーマンス戦略

### 4.1 コード分割

| 対象 | 手法 | 理由 |
|---|---|---|
| QRコードライブラリ (`qrcode`) | `next/dynamic` (ssr: false) | QR生成はクライアントサイド専用。初期バンドルから除外 |
| jsPDF | `dynamic import` | PDF出力時のみ必要。ダウンロード操作時にロード |
| 装飾プリセットデータ | 通常 import | データ量が小さいため分割不要 |

```typescript
// QRライブラリの動的インポート例
import dynamic from 'next/dynamic';

const QrGenerator = dynamic(() => import('@/components/qr/QrGenerator'), {
  ssr: false,
  loading: () => <QrGeneratorSkeleton />,
});
```

### 4.2 画像最適化

- `next/image` を使用し、自動で WebP/AVIF 変換・リサイズを行う
- OGP画像は `public/images/og/` に配置
- ユーザーがアップロードするロゴ画像はクライアントサイドで処理し、サーバーに送信しない

### 4.3 フォント最適化

```typescript
// app/layout.tsx
import { Noto_Sans_JP } from 'next/font/google';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: true,
});
```

### 4.4 キャッシュ戦略

- 全SSGページはVercel CDNでキャッシュされる
- `Cache-Control: public, max-age=31536000, immutable` が静的アセットに適用される
- MDXコンテンツの更新はビルド時に反映（再デプロイで更新）

---

## 5. SEO アーキテクチャ

### 5.1 メタデータ管理

各 `page.tsx` で `export const metadata` を使い、ページ固有のメタデータを定義する。共通の生成ロジックは `lib/metadata/` に集約する。

```typescript
// lib/metadata/generateMeta.ts
import type { Metadata } from 'next';

const SITE_NAME = 'QR Code Create';
const BASE_URL = 'https://www.qr-create.jp';

export function generatePageMetadata(params: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
}): Metadata {
  const fullTitle = `${params.title} | ${SITE_NAME}`;
  return {
    title: fullTitle,
    description: params.description,
    openGraph: {
      title: fullTitle,
      description: params.description,
      url: `${BASE_URL}${params.path}`,
      siteName: SITE_NAME,
      images: [params.ogImage || `${BASE_URL}/images/og/default.png`],
      locale: 'ja_JP',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: params.description,
    },
    alternates: {
      canonical: `${BASE_URL}${params.path}`,
    },
  };
}
```

### 5.2 JSON-LD 構造化データ

[マーケティング戦略 セクション9](../marketing-strategy.md) で定義された以下のスキーマを実装する。

| スキーマ | 適用ページ |
|---|---|
| WebApplication | `/create` |
| FAQPage | `/faq`, ガイドページ |
| HowTo | `/create`, ガイドページ |
| BreadcrumbList | 全ページ |
| Organization | サイト全体（layout.tsx） |
| BlogPosting | `/blog/[slug]` |
| Article | `/guide/[slug]`, `/use-cases/[slug]`, `/industry/[slug]` |

`lib/schema/` にスキーマ生成関数を配置し、`components/seo/JsonLd.tsx`（Server Component）で `<script type="application/ld+json">` として出力する。

### 5.3 サイトマップ・robots.txt

- `app/sitemap.ts` で動的にサイトマップを生成（MDXコンテンツの slug を列挙）
- `app/robots.ts` でロボットファイルを生成（全ボット許可、AIボット含む）
- `public/llms.txt` にAI検索向けサイト説明を配置

---

## 6. セキュリティ

### 6.1 入力バリデーション

- URL入力は `URL` コンストラクタでの形式検証 + XSS文字列のサニタイズ
- UTMパラメータ値は `encodeURIComponent` でエスケープ
- アップロード画像は `FileReader` でクライアントサイド処理のみ（サーバーへの送信なし）

### 6.2 CSP (Content Security Policy)

`next.config.ts` で以下のヘッダーを設定する。

```typescript
// next.config.ts
const nextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ],
};
```

---

## 7. テスト戦略

| テスト種別 | ツール | 対象 |
|---|---|---|
| 単体テスト | Jest + React Testing Library | ユーティリティ関数、コンポーネント |
| コンポーネントテスト | React Testing Library | QrGenerator以下の各コンポーネント |
| E2Eテスト | Playwright | QRコード生成フロー、ダウンロード、ナビゲーション |
| スナップショットテスト | Jest | レイアウト崩れ検出 |

### テスト方針

- ビジネスロジック（URL生成、UTMパラメータ結合、コントラスト計算等）は必ず単体テストを書く
- QR生成ライブラリの動的インポートを含むコンポーネントは E2E テストでカバーする
- MDXコンテンツの存在・フロントマター整合性はビルド時テストで検証する
- ESM 専用パッケージ（remark-gfm 等）は Jest が構文解析できないため、`tests/__mocks__/` にモックを置き `jest.config.ts` の `moduleNameMapper` で差し替える。テストファイル個別の `jest.mock` ではなく設定側で解決する（qr_code_create-5ls で追加）
- 件数を固定値で検証するテスト（サイトマップのエントリ数、フレーム種類数、ガイド本数など）は、実装の定数やコンテンツディレクトリから導出した値と比較する（qr_code_create-5ls で方針化）

---

## 8. ビルド・デプロイ

### 8.1 ビルドプロセス

```
npm run build
  ↓
Next.js が全SSGページを静的生成
  ↓ MDXファイルを読み込み、generateStaticParams で全ページ列挙
  ↓ 各ページのHTML/CSS/JSを生成
.next/ に出力
```

### 8.2 デプロイフロー

```
GitHub main ブランチへ push
  ↓
Vercel が自動デプロイ
  ↓
Preview deploy (PR時) / Production deploy (main マージ時)
```

### 8.3 環境変数

| 変数名 | 用途 | 設定場所 |
|---|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 測定ID | Vercel Environment Variables |
| `NEXT_PUBLIC_SITE_URL` | サイトURL（OGP等で使用） | Vercel Environment Variables |

---

## 9. `/poster` への state 引き継ぎ機構

### 9.1 概要

`/create` で構築したQRコード設定（URL・UTM・装飾）を、別ページ `/poster` でそのまま使えるようにするための仕組み。同一オリジン内のページ間 state 受け渡しには **sessionStorage** を使用する。

### 9.2 採用方針: sessionStorage

| 項目 | 値 | 理由 |
|---|---|---|
| ストレージ | `sessionStorage` | タブを閉じた時点で破棄される。プライバシー配慮（特にロゴ画像 base64 を含むため） |
| キー名 | `qr-poster-handoff` | プロジェクト固有プレフィクス `qr-` を付与 |
| 値の形式 | `JSON.stringify(PosterHandoffPayload)` | 型定義は [データモデル設計 2.8](./data-model.md#28-ポスター関連の型) を参照 |
| 寿命 | タブを閉じるまで（最大セッション内） | sessionStorage の仕様に従う |
| 鮮度チェック | `savedAt` から **1時間以上経過した payload は破棄** | 古い state を誤って引き継ぐリスクを抑制 |
| サイズ上限 | 概ね 5MB 以内（ブラウザ依存） | ロゴ画像 base64 を含めても通常は数百KB〜1MB以内に収まる前提。超える場合はロゴを除外して保存する |

### 9.3 ガード条件

- **必ず `typeof window !== "undefined"` で囲む**: SSR時（およびNext.js のビルド時）に sessionStorage にアクセスするとエラーになるため、保存・読込関数の内部で必ずブラウザ環境チェックを行う
- **try/catch で囲む**: クォータ超過やプライベートブラウジングで例外が出る可能性があるため、保存失敗時は黙って失敗してよい（引き継ぎは「ベストエフォート」扱い）
- **JSON.parse 失敗時**: payload を破棄して、`/poster` 側は引き継ぎなしのフォールバック（最小入力欄）にフォールバック

### 9.4 ライフサイクル

```
[/create ステップ4]
  ユーザーが「印刷用ポスターを作る →」CTAをクリック
    ↓
  posterHandoff.save(payload) を呼ぶ
    ├── typeof window !== "undefined" チェック
    ├── try: sessionStorage.setItem("qr-poster-handoff", JSON.stringify(payload))
    └── catch: 失敗を黙殺
    ↓
  router.push("/poster")
    ↓
[/poster] PosterEditor マウント
    ↓
  posterHandoff.load() を呼ぶ
    ├── typeof window !== "undefined" チェック
    ├── sessionStorage.getItem("qr-poster-handoff")
    ├── JSON.parse + savedAt 鮮度チェック（1時間以内か）
    └── 成功: PosterState の初期値として展開
        失敗: 最小入力欄から開始（URL未入力状態）
    ↓
  読込完了後、posterHandoff.clear() でキーを削除（リロード時に再消費しない）
```

### 9.5 ロゴ画像 base64 のサイズ配慮

- ロゴ画像は dataURL (base64) として `DecorationConfig.logo.dataUrl` に格納されている
- JPEG/PNG/SVG いずれも base64 化すると元サイズの約1.33倍になる
- アップロード時点で 500KB 上限が設けられているため、base64化後でも 700KB 程度に収まる
- それでも 5MB のクォータに収まらない可能性が出てきた場合、`posterHandoff.save()` 内でサイズチェックを行い、超過時は `decoration.logo = null` として保存する（ユーザーに通知する設計は実装時に検討する）

### 9.6 PDF生成ライブラリ選定

`/poster` のA4 2x2 PDF生成には **`jsPDF` + `html2canvas`** の組み合わせを採用する。

**選定理由**:

| 選択肢 | 採否 | 理由 |
|---|---|---|
| `jsPDF` + `html2canvas` | **採用** | (1) `/create` で既に `jsPDF` を採用しており、依存ライブラリの追加が最小限。(2) html2canvas でHTML要素（プレビュー）をそのまま画像化できるため、複雑なMarkdownレンダリング結果やCSSスタイルを忠実にPDFへ反映できる。(3) Next.js App Router 環境での動作実績が豊富。(4) Client Component + 動的インポートで bundle size の影響を初期表示から切り離せる |
| `@react-pdf/renderer` | 不採用 | React コンポーネントとして PDF を組み立てる必要があり、Markdown レンダリング結果やフレーム画像をそのまま流用しにくい。専用のスタイル定義が必要になり実装コストが高い |
| `pdf-lib` | 不採用 | 低レベル PDF 生成APIで、HTML/CSS のレンダリング結果を取り込む機能がない。Markdown表示やフレームの忠実な再現が困難 |
| Vercel上のサーバーサイド生成 (puppeteer等) | 不採用 | フロントエンド完結型の方針 ([セクション1.1](#11-方針)) と整合しない |

**実装方針**:
- `/poster` の右カラムにある A4 プレビュー DOM（2x2のカード配置）を **html2canvas で高解像度 (scale: 2 〜 3) でラスタライズ**し、得られた canvas を jsPDF に `addImage` で貼り付けて A4 1ページの PDF として出力する
- フォント: Noto Sans JP を `next/font` で読み込み済みのため、html2canvas のレンダリング結果に反映される
- 注意点: html2canvas は外部画像（フレーム素材）の CORS に注意。`public/images/frames/` 配下の同一オリジン画像のみを使用するため CORS 問題は発生しない見込み
- bundle size 配慮: `jsPDF` と `html2canvas` は **動的インポート**（`await import('html2canvas')`）でダウンロード操作時のみ読み込む

### 9.7 セキュリティ上の留意点

- sessionStorage は JavaScript からアクセス可能であり、XSS 脆弱性があれば窃取される可能性がある。本アプリは入力されるURLをサニタイズしているが、Markdown 入力では `rehype-raw` を使わない（生 HTML を許可しない）方針とする（詳細は [コンポーネント設計 7.2 MarkdownInput](./component-design.md#72-markdowninput) を参照）
- 引き継ぎ payload にはユーザーが入力したURL・UTM値が含まれるが、機密情報（パスワード・トークン等）は構造上含まれない
