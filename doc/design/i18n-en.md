# 英語版（/en）設計（Phase 1.5）

2026-10-24 作成（qr_code_create-01z）。既存サイトに英語版 `/en` を足すための設計。日本語版の URL・表示・既存テストは変えない。

## 1. 関連ドキュメント

- [要件定義 9. 英語版（/en）の要件](../requirements.md#9-英語版enの要件phase-152026-10-24-追加qr_code_create-01z)（F-010〜F-013、受け入れ条件 9.6）
- [設計概要](./overview.md)
- [ページ・ルーティング設計](./page-routing.md)（1. ルーティング全体図、3. レイアウト構造）
- [ディレクトリ構造設計](./directory-structure.md)
- [コンポーネント設計](./component-design.md)（7. 英語版（i18n）関連コンポーネント）
- [UI/UX仕様](./ui-ux-spec.md)（[1.6 AIっぽさを避ける方針](./ui-ux-spec.md#16-aiっぽさを避ける方針)。英語版も同じトークンとレイアウト）

---

## 2. 方針の要約

**採用（B 案）: `app/en/` を日本語版と並置し、ルートレイアウトを `(ja)` と `en` の 2 つに分ける。文言はライブラリなしの型付き辞書。**

- URL は日本語版そのまま、英語版は `/en` 配下。全ページ SSG のまま。英語版があるページだけ作る
- 英語版の無い slug は 404。日本語へのフォールバックはしない
- hreflang は両言語が揃うページ（`/`、`/create`、`/guide/getting-started`）だけに出す
- `Accept-Language` による自動リダイレクト、`next.config.ts` の `i18n`、middleware は使わない
- 新しい npm 依存は追加しない（next-intl も入れない。3 言語以上、ICU 複数形、翻訳者の JSON 作業、ロケール整形が増えたら再検討）

**不採用の案**
- **A: `app/[locale]/` へ全ページ移動** — `/` を `[locale]` に当てるには middleware の rewrite が要る。全ページの移動と既存テストの大改修になり、「日本語版を変えない」に反する
- **C: middleware で `/en/*` を rewrite** — リクエストごとに Edge で処理が入り SSG の利点が減る。Edge の制約も負う。ページごとの静的出力が確認しにくい

---

## 3. ルーティングとレイアウト

### 3.1 ファイル木（Phase 1.5 で作るもの・動かすもの）

```
src/app/
├── (ja)/                         # 新規 Route Group。既存ページを git mv で移す（URL 不変）
│   ├── layout.tsx                # ルートレイアウト ja: export metadata = buildRootMetadata("ja") / <RootShell locale="ja">
│   ├── not-found.tsx             # 新規: 日本語 404
│   ├── page.tsx                  # 移動: /（中身は <HomePageView locale="ja" />）
│   ├── (marketing)/              # 移動: guide, use-cases, blog, faq, privacy, terms, contact（中身は変えない）
│   └── (tool)/                   # 移動: create, poster
├── en/
│   ├── layout.tsx                # ルートレイアウト en: buildRootMetadata("en") / <RootShell locale="en">
│   ├── not-found.tsx             # 新規: 英語 404
│   ├── page.tsx                  # /en
│   ├── (tool)/
│   │   ├── layout.tsx            # Container size="wide"（ja の (tool) と同じ）
│   │   └── create/page.tsx       # /en/create
│   └── (marketing)/
│       ├── layout.tsx            # Container size="narrow"
│       └── guide/[slug]/page.tsx # /en/guide/getting-started（dynamicParams = false）
├── globals.css                   # 残す。両ルートレイアウトが import する
├── sitemap.ts / robots.ts        # 残す（メタデータルートはレイアウト不要）
└── icon.svg / icon.png / apple-icon.png / favicon.ico   # 残す
```

`src/app/layout.tsx` は削除する（残すと `<html>` が二重になる）。`headers()` で lang を決める方式は全ページが動的になるので禁止。

### 3.2 RootShell

`src/components/layout/RootShell/RootShell.tsx`（Server Component）。現在の `src/app/layout.tsx` の本体をそのまま移す。

```typescript
interface RootShellProps {
  locale: Locale;            // "ja" | "en"
  children: React.ReactNode;
}
```

- 責務: `<html lang={locale} className={notoSansJP.variable}>`、`<body>`、`I18nProvider`、`Header locale`、`children`、`Footer locale`、GA4 の `Script`
- `Noto_Sans_JP` の呼び出しも RootShell のモジュールに移す（英語版も同じ書体。トークンを変えない）
- `I18nProvider` には `locale` を必ず渡す。`messages` は en のときだけ `getClientMessages("en")` を渡す（ja は Client 側の既定に任せ、同じ文字列を RSC ペイロードに二重に載せない。4.4 節）

### 3.3 rootMetadata

`src/lib/metadata/rootMetadata.ts` に `buildRootMetadata(locale: Locale): Metadata` を置く。`title.template`（`%s | QR Code Create`）と `metadataBase` は共通、`title.default` と `description` を言語別に返す。`buildRootMetadata("ja")` の戻り値は現行 `layout.tsx` の `metadata` と同一にする（テストで比較）。

### 3.4 404

- `notFound()` を呼んだページは、同じルートレイアウト配下の `not-found.tsx` が出る（ja は日本語、en は英語）。いまは `not-found.tsx` が無く Next.js 既定の 404 なので、ja 側の見た目は新規になる
- どのルートにも一致しない URL（`/foo`、`/en/foo`）は、ルート直下のレイアウトが無くなるため扱いが変わる。T1 で Next.js 16 の `global-not-found.tsx`（要否と安定性）を公式ドキュメントで確認して決める。第 1 案は `src/app/global-not-found.tsx` を日本語で置く。`/en/foo` が日本語 404 になるのは Phase 1.5 では許容する（[13 節](#13-ユーザーに確認したい点)）

### 3.5 ルートレイアウトをまたぐ遷移

`/` と `/en` の間の遷移は別ルートレイアウトなので full page reload になる。言語切り替えでは許容する。同じ言語の中（`/en` → `/en/create`）は通常のクライアント遷移のまま。

---

## 4. 文言辞書（i18n 基盤）

### 4.1 構成

```
src/i18n/
├── types.ts          # Locale = "ja" | "en"、Dict = typeof ja、ClientDict（Client に渡すスライス）
├── ja.ts             # 日本語辞書。既存の文字列を一字一句そのまま移す
├── en.ts             # 英語辞書。export const en = { ... } satisfies Dict
├── getDict.ts        # Server 専用: getDict(locale): Dict、getClientMessages(locale): ClientDict
├── format.ts         # formatMessage("あと{n}ステップ", { n: 1 })（Client 用の補間）
├── I18nProvider.tsx  # 'use client'。props: { locale, messages?: ClientDict, children }
└── useDict.ts        # 'use client'。useDict(): ClientDict、useLocale(): Locale
src/lib/i18n/
└── routes.ts         # localePath(locale, path)、getAlternatePath(pathname, to)、EN_AVAILABLE_PATHS
```

### 4.2 辞書の構造

| スライス | 使う側 | 内容 |
|---|---|---|
| `common` | Client | 言語切り替えのラベル、モバイルメニューの開閉ラベル、読み込み中、404 |
| `header` / `footer` | Server | ナビ項目、CTA、規約導線と「日本語のみ」の注記 |
| `home` | Server | ヒーロー、できること 4 項目、締めの案内 |
| `tool` | Client | ステップ名、URL 入力、プログレスバー、プレビュー、ダウンロード、バリデーションとエラー |
| `utm` | Client | フィールド名とヘルプ、`sourceLabels` / `mediumLabels`（値をキー）、用途別設定例のラベル、効果度 |
| `decoration` | Client | 装飾プリセット名と説明（プリセット id をキー）、フレーム名、キャプションテンプレート、ロゴ、配色・コントラスト警告 |
| `guide` | Server | パンくず、記事末尾の CTA |
| `meta` / `schema` | Server | ページの title / description、JSON-LD の description・featureList |

- キーは camelCase、画面の場所 → 要素の順に入れ子にする（`tool.download.pngButton`、`utm.fieldHelp.source`）。値の言い換えでキー名を変えない
- 補間: Server 専用スライスは関数値 `(n: number) => string` を使ってよい。Client スライス（`ClientDict`）は Server → Client の props で渡すため関数を持てない。`{n}` 形式のプレースホルダと `formatMessage` を使う。`ClientDict` は「文字列と入れ子オブジェクトだけ」の型制約をかけ、関数が混ざったらコンパイルエラーにする

### 4.3 Server と Client での受け渡し

- Server Component: `locale` を props で受け、`getDict(locale)` で引く。既存の Server Component は `locale = "ja"` を既定値にする（既存テストの `<HeroSection />` がそのまま通る）
- Client Component: `useDict()` で `ClientDict` を受け取る。Provider が無いとき、または `messages` が無いときは ja を返す（既存のコンポーネントテストを無変更で通すため）
- `useLocale()` は Provider が無ければ `"ja"`。Client からのリンクは `localePath(useLocale(), "/create")` で作る

### 4.4 Client で辞書を直接 import しない

- コンポーネントから `src/i18n/ja.ts` / `en.ts` を import しない。import してよいのは `getDict.ts`（Server）と `useDict.ts`（ja の既定値）だけ
- 結果: `en.ts` は Client バンドルに入らない（en の文字列は RSC ペイロードで en ページにだけ届く）。ja の文字列は今もコンポーネントに直書きでバンドルに入っているので、量は増えない
- ESLint の `no-restricted-imports` で `@/i18n/ja`、`@/i18n/en` を `src/components/**` から禁止する

### 4.5 プリセットの label 分離

- 値（`flyer`、`business_card`、`qr` など）は `src/lib/constants/` に残し、言語によらず同じにする（F-012）。例: `UTM_SOURCE_VALUES = ["flyer", ...] as const`
- 表示名は辞書へ: `dict.utm.sourceLabels[value]`、`dict.decoration.presets[id].name`。組み立ては `buildUtmSourceOptions(utmDict)` のような純関数
- 互換: 既存 export（`UTM_SOURCE_OPTIONS`、`UTM_MEDIUM_OPTIONS`、`UTM_FIELD_HELP`、`UTM_USAGE_EXAMPLES`、`DECORATION_PRESETS`、フレーム・キャプションの定数）は名前と形を変えず、ja 辞書から組み立てて export し続ける。コンポーネントは `useDict()` 経由の組み立てに切り替える
- `src/lib` の純関数が日本語のメッセージを返している場合（URL バリデーション、コントラスト警告など）は、末尾に `messages` 引数を足し既定値を ja の該当スライスにする。既存の呼び出しとテストは変えない

---

## 5. ページの実装方針

### 5.1 `*PageView` への抽出

ページ本体を `src/components/pages/` に移し、`page.tsx` は metadata と View を呼ぶだけにする。

| View | 置き場所 | 使うページ |
|---|---|---|
| `HomePageView({ locale })` | `src/components/pages/HomePageView/` | `(ja)/page.tsx`、`en/page.tsx` |
| `CreatePageView({ locale })` | `src/components/pages/CreatePageView/`（`page.module.css` と `QrGeneratorLoader.tsx` も移す） | `(ja)/(tool)/create`、`en/(tool)/create` |
| `GuideArticlePageView({ locale, slug, guide })` | `src/components/pages/GuideArticlePageView/`（`guide.module.css` も移す） | `(ja)/(marketing)/guide/[slug]`、`en/(marketing)/guide/[slug]` |

```typescript
// src/app/en/(tool)/create/page.tsx
export const metadata = buildMetadata(PAGE_METADATA_EN.create);
export default function CreatePage() {
  return <CreatePageView locale="en" />;
}
```

その他の日本語ページ（faq、blog など）は View に抽出しない（英語版が無いので重複が起きない）。

### 5.2 `/en/create` と `QrGeneratorLoader`

- `QrGeneratorLoader`（`'use client'`、`dynamic(ssr: false)`）は `CreatePageView` の隣に移し、ja / en で共有する。`locale` は渡さない（`QrGenerator` 以下は `useDict()` / `useLocale()` で引く）
- QR 生成・装飾・ダウンロードの処理は言語で分岐しない。分岐するのは文言とリンク先だけ
- 英語版の無いページへの導線（`/poster` への引き継ぎ、ガイド記事へのリンクなど）は、en では出さない。判定は `EN_AVAILABLE_PATHS` に含まれるかで行う

### 5.3 プライバシーポリシー・利用規約への導線

英語版のフッターは `/privacy`、`/terms`（とお問い合わせ `/contact`）へ日本語ページのままリンクし、リンク名に「(Japanese)」を付ける。フッター内に一文で注記する: 「Our privacy policy and terms of service are available in Japanese only.」 リンクには `hrefLang="ja"` を付ける。

---

## 6. コンテンツ（MDX）

- 英語の MDX は `src/content/en/guide/getting-started.mdx`。日本語の `src/content/guide/` は動かさない
- シグネチャ（`src/lib/content/getGuide.ts`）:

```typescript
function contentDir(locale: Locale): string; // ja → src/content/guide、en → src/content/en/guide
export function getGuide(slug: string, locale: Locale = "ja"): GuideContent | null;
export function getGuideSlugList(locale: Locale = "ja"): string[];
```

- `app/en/(marketing)/guide/[slug]/page.tsx`: `generateStaticParams` は `getGuideSlugList("en")` だけ。`export const dynamicParams = false` で英語の無い slug（`/en/guide/utm-setup` など）は 404
- frontmatter のキーは ja と同じ（`GuideFrontmatter` は変えない）。`date` は ISO 文字列のまま表示（ロケール整形はしない）
- パンくず: en は「Home（`/en`）› 記事タイトル」の 2 段（`/en/guide` 一覧が無いため）。BreadcrumbList の JSON-LD も同じ 2 段
- HowTo の `url` は `${SITE_URL}/en/guide/${slug}#step-n`
- MDX 内リンクの規則: en の MDX から内部ページへのリンクは `/en/...` で書き、行き先は `EN_AVAILABLE_PATHS` に含まれること。テスト（`tests/unit/content/enGuideLinks.test.ts`）で `](/` で始まるリンクをすべて抽出して検査する

---

## 7. SEO と計測

### 7.1 `buildMetadata` の拡張

```typescript
interface BuildMetadataOptions {
  title: string;
  description: string;
  path: string;
  ogImagePath?: string;
  noIndex?: boolean;
  locale?: Locale;                                  // 既定 "ja"
  alternatePaths?: { ja: string; en: string };      // 両言語が揃うページだけ指定
}
```

- `openGraph.locale`: ja → `ja_JP`、en → `en_US`。`alternatePaths` があるときだけ `openGraph.alternateLocale` に相手側を入れる
- `alternates.canonical` は各言語の自己 URL
- `alternatePaths` があるとき `alternates.languages = { ja: SITE_URL + ja, en: SITE_URL + en, "x-default": SITE_URL + ja }`。自己参照・相互参照が揃うよう、ja 側の home / create / getting-started にも同じ `alternatePaths` を渡す
- `PAGE_METADATA` は形を保ったまま home / create に `alternatePaths` を足す。英語は同じファイルに `PAGE_METADATA_EN`（home、create。path は `/en`、`/en/create`、`locale: "en"`）を置く
- OG 画像は当面共通（`/images/og/default.png`、F-013）

### 7.2 JSON-LD（`src/lib/schema/buildJsonLd.ts`）

- `buildWebApplicationSchema(locale = "ja")`: `inLanguage`、`description`、`featureList`、`url` を言語別に。文言は `dict.schema`。Offer は価格 0 のままとし `priceCurrency` は ja=JPY、en=USD
- `buildHowToSchema` / `buildBlogPostingSchema` / `buildBreadcrumbSchema`: オプション引数に `locale`（既定 ja）を足し `inLanguage` を出す。URL を内部で組み立てている箇所は `path` を受け取れるようにする（現行シグネチャは実装時に確認）
- `buildOrganizationSchema` は変えない

### 7.3 sitemap（`src/app/sitemap.ts`）

- `/en`、`/en/create`、`getGuideSlugList("en")` から `/en/guide/{slug}` を追加
- 両言語が揃うエントリ（ja 側と en 側の両方）に `alternates: { languages: { ja, en, "x-default": ja } }` を付ける
- robots は変えない

### 7.4 GA4

ページパス（`/en` で始まる）で言語を見分ける。`gtag('config')` は変えない。カスタムディメンション `site_lang` は F-013 に従い入れない（必要になれば後続。GA 側の登録が要り、過去分は遡れない）。

---

## 8. 言語切り替え UI

### 8.1 `LanguageSwitcher`

`src/components/layout/Header/LanguageSwitcher.tsx`（`'use client'`）。

- `usePathname()` で現在パスを取り、`getAlternatePath(pathname, to)` で行き先を決める。`to` は `useLocale()` の反対
- 表示: ja のページでは「EN」、en のページでは「日本語」の固定テキスト。pill、枠、国旗の絵文字、地球アイコンは使わない（[ui-ux-spec 1.6](./ui-ux-spec.md#16-aiっぽさを避ける方針)）。見た目は既存の `navLink` と同じ（色と下線の変化だけ）
- 要素: `<a href hrefLang={to} lang={to}>`。どのみち full reload なので `next/link` のプリフェッチは使わない。「EN」の後ろに視覚的に隠した「 (English)」を置き、読み上げ名に表示文字列を含める
- クエリと hash は引き継がない（`useSearchParams` と Suspense 境界を避ける）

### 8.2 `getAlternatePath(pathname, to)`

```typescript
export const EN_AVAILABLE_PATHS = ["/", "/create", "/guide/getting-started"] as const; // ja 側のパスで持つ
export function getAlternatePath(pathname: string, to: Locale): string;
```

| 入力 | to | 出力 |
|---|---|---|
| `/` | en | `/en` |
| `/create` | en | `/en/create` |
| `/guide/getting-started` | en | `/en/guide/getting-started` |
| `/faq`、`/guide/utm-setup` | en | `/en`（対応ページなし → 相手言語のトップ） |
| `/en`、`/en/` | ja | `/` |
| `/en/create` | ja | `/create` |
| `/en/foo`（404） | ja | `/` |

- 末尾スラッシュは除いてから判定する
- `EN_AVAILABLE_PATHS` は Client でも使うので定数で持つ。`getGuideSlugList("en")` と食い違わないことを単体テストで確認する

### 8.3 配置

- デスクトップ: Header の `desktopNav` の右端（CTA の右）
- モバイル: ヘッダーバーのメニューボタンの左に常に出す。日本語が読めない人が日本語のメニューを開かずに見つけられるようにするため。`MobileNav` のパネル内には重ねて置かない
- en のヘッダーのナビは「Home（`/en`）」「Getting started（`/en/guide/getting-started`）」と CTA「Create a QR code（`/en/create`）」だけ。ja のナビは変えない

---

## 9. 英語コピーの方針

- サイト名は「QR Code Create」のまま
- トーン: 短く具体的に。sentence case（先頭だけ大文字）。感嘆符なし。「Unlock」「Supercharge」「seamless」「effortless」のような定型の売り文句を使わない。何ができて、押すと何が起きるかを平叙文で書く
- 用語: UTM parameters、campaign、source、medium は英語圏の GA の用語のまま

| 場所 | 案 |
|---|---|
| トップ h1 | 推奨「Create QR codes with UTM parameters, free」。代案「Make QR codes you can track in Google Analytics」 |
| トップ説明 | 「Enter a URL, add UTM parameters with guided presets, and download the QR code as PNG, SVG, or PDF. No sign-up.」 |
| トップ CTA | 「Create a QR code」 |
| ツールのステップ | 「1. Enter your URL」「2. Add UTM parameters」「3. Customize the design」 |
| ダウンロード | 「Download PNG」「Download SVG」「Download PDF」 |
| 規約の注記 | 「Our privacy policy and terms of service are available in Japanese only.」 |

- 運用: 機械翻訳で下書き → 人が en.ts を通読して採用。日本語の言い回しを直訳しない（「マーケティング効果を最大化」→ 測れることを具体的に書く）
- 組版: 390px 幅で h1 の折り返し、ボタン幅、プリセット名の長さを確認する。英文用の書体やトークンは足さない

---

## 10. テスト戦略

### 10.1 日本語の表示を変えない手順

1. T1: ルート移動のみ。既存テストの変更は `@/app/...` の import パス置換（11 ファイル）だけ
2. T2: `ja.ts` を既存文字列と一字一句同じに作る → コンポーネントを `useDict()` / `getDict()` に切り替える。`useDict()` の既定が ja なので、既存の 88 suites / 1194 tests を**無変更で**全通過させる
3. T3 以降で en を足す。既存テストの変更は T5 の hreflang 追加に伴う ja 側 metadata の期待値（`alternates.languages` が増える分）だけ認める

### 10.2 新規テスト

| 対象 | 種別 | 確認すること |
|---|---|---|
| `src/i18n` | 単体 | ja と en のキー集合が一致、空文字なし、en の値に仮名・漢字が無い（例外: 切り替えラベル「日本語」）、`{x}` プレースホルダの集合が ja と en で一致 |
| `formatMessage` | 単体 | 置換、未定義キーはそのまま残す |
| `useDict` / `I18nProvider` | コンポーネント | Provider なしで ja、`messages` ありでその辞書、`useLocale` の既定 |
| `routes.ts` | 単体 | 8.2 の表の全行、`localePath`、`EN_AVAILABLE_PATHS` と `getGuideSlugList("en")` の整合 |
| `getGuide` | 単体 | `locale` 省略で従来どおり、en の読み込み、en に無い slug は null |
| en MDX のリンク | 単体 | 6 節の規則 |
| `buildRootMetadata` / `buildMetadata` | 単体 | ja が現行と同一、en の `og:locale`、`languages` の 3 キーと自己参照、`alternatePaths` なしで `languages` を出さない |
| JSON-LD / sitemap | 単体 | `inLanguage`、en の URL、sitemap に en 3 件と `alternates.languages` |
| `app/en` の各ページ | コンポーネント | 英語で描画される、h1、日本語の文字列が出ない |
| `LanguageSwitcher` | コンポーネント | ja で「EN」と行き先、en で「日本語」、`hrefLang` / `lang` 属性 |
| E2E（Playwright） | E2E | `/en` 系 3 ページの `html[lang="en"]`、`link[rel=alternate][hreflang]` 3 本、切り替えで対応ページへ往復、`/en/create` で URL 入力 → PNG / SVG / PDF ダウンロード、390px 幅で横スクロールが出ない |

---

## 11. 移行手順と Beads タスク分割

依存: **T1 → T2a → T2b → T3 → (T4, T5a 並行) → T5b**。T2a と T2b は同じ `ja.ts` を編集するので順次。en.ts は T3 が全スライスまとめて作る（`satisfies Dict` が全キーを要求するため）。

| ID | 目的 | 主な対象ファイル | 完了条件 | 依存 |
|---|---|---|---|---|
| T1 | ルートレイアウト分割とルート移動 | `src/app/(ja)/**`（git mv）、`src/app/en/layout.tsx`・仮 `page.tsx`、`RootShell`、`rootMetadata.ts`、`not-found.tsx` ×2、`global-not-found` の判断、テスト 11 ファイルの import | 日本語版の URL と表示が不変、88 suites / 1194 tests 全緑、`/en` の仮ページが `lang="en"`、ビルドで全ページ静的出力、favicon が出る | なし |
| T2a | i18n 基盤とツール/QR 系の辞書化 | `src/i18n/*`、`src/lib/i18n/routes.ts`（`localePath` のみ）、`src/components/qr/**`、`src/lib/constants/*Presets.ts` ほか定数、`src/lib/url`・`src/lib/color` のメッセージ、ESLint の import 制限 | 既存テスト無変更で全緑、基盤の単体テスト、コンポーネントに日本語の直書きが残らない（`src/components/qr`） | T1 |
| T2b | トップ/共通系の辞書化 | `Header`、`MobileNav`、`Footer`、`src/components/top/**`、`ArticleCta`、`Breadcrumb` の既定ラベル、`not-found.tsx`、`meta` / `schema` スライス | 既存テスト無変更で全緑、対象コンポーネントに日本語の直書きが残らない | T2a |
| T3 | en 辞書と英語ページ（トップ、/create） | `src/i18n/en.ts`、`getClientMessages`、`HomePageView`・`CreatePageView` の抽出、`app/en/page.tsx`、`app/en/(tool)/**`、`PAGE_METADATA_EN`、en のヘッダー・フッター | 辞書の単体テスト、`/en` と `/en/create` の描画テスト、`/en/create` のダウンロード E2E、`.next/static` に en 固有の文字列が無い | T2b |
| T4 | 英語ガイドと MDX 拡張 | `getGuide.ts`、`src/content/en/guide/getting-started.mdx`、`GuideArticlePageView` の抽出、`app/en/(marketing)/**` | `getGuide` と MDX リンクのテスト、en にない slug が 404、HowTo の URL が `/en/...` | T3 |
| T5a | 言語切り替え | `routes.ts`（`getAlternatePath`、`EN_AVAILABLE_PATHS`）、`LanguageSwitcher`、`Header`（配置と CSS） | 8.2 の表の単体テスト、切り替えのコンポーネントテスト、390px で崩れない | T3 |
| T5b | SEO と最終 E2E | `buildMetadata.ts`、`buildJsonLd.ts`、`sitemap.ts`、ja / en 3 ページの metadata、Playwright | 10.2 の metadata / JSON-LD / sitemap テスト、E2E（lang・hreflang・切り替え往復）、受け入れ条件 9.6 をすべて満たす | T4、T5a |

---

## 12. リスクと対策

| リスク | 対策 |
|---|---|
| `/` ↔ `/en` が full reload になる | 言語切り替えに限るので許容。同一言語内の遷移はクライアント遷移のまま。`<a>` で明示する |
| ルート直下レイアウトが無くなり、未定義 URL の 404 の見た目が変わる | T1 で `global-not-found` を確認し、`/foo` と `/en/foo` の表示を E2E で固定する |
| 両言語の辞書が Client バンドルに入る | コンポーネントからの辞書 import を ESLint で禁止。en は props 経由のみ。T3 で `.next/static` を検索して確認 |
| 辞書化の途中で日本語の文言がずれる | ja.ts は既存文字列をコピーで作り、既存テストを無変更で通すことを T2 の完了条件にする。T2 を 2 回に分けて差分を小さくする |
| hreflang の片側欠け（相互参照が崩れる） | `alternatePaths` を ja / en の両方に渡す。sitemap と metadata の両方をテストし、E2E で 3 ページ × 2 言語の `link[hreflang]` を確認 |
| 英語の無いページへの導線が en に残る | `EN_AVAILABLE_PATHS` で判定。en ページの描画テストで `href` が `/en` 始まりか規約系だけであることを確認 |
| Client スライスに関数が入りシリアライズで落ちる | `ClientDict` の型制約でコンパイル時に止める |

---

## 13. ユーザー確認の結果

2026-10-24 にユーザーが以下 1〜8 をすべて推奨どおりで承認した。英語の h1 は「Create QR codes with UTM parameters, free」で確定。

1. **英語の h1**: 推奨「Create QR codes with UTM parameters, free」。代案「Make QR codes you can track in Google Analytics」（9 節）
2. **規約・プライバシーポリシーの英訳の時期**: Phase 1.5 では日本語ページへリンクし英語で注記する。英訳は後続タスクにする想定
3. **GA の `site_lang`**: F-013 どおり入れない（パスで区別）。言語別のコンバージョンを GA 画面で簡単に見たいなら後続で追加
4. **英語版の OG 画像**: 当面共通（日本語の見出し入り）。英語用 `og/default-en.png` を作るかどうか
5. **`/en/foo` のような未定義 URL**: 日本語の 404 になっても Phase 1.5 では許容する
6. **en の `/create` で英語版の無いページへの導線を出さない**: `/poster` への引き継ぎボタンとガイド記事リンクが en では消える
7. **モバイルの言語切り替えの位置**: メニューを開かなくても見えるよう、ヘッダーバーに常に出す
8. **JSON-LD の通貨**: en の Offer は `priceCurrency: USD`（価格 0）
