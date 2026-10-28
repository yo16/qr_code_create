# 多言語版（es / pt-BR / de）設計

2026-10-28 作成（qr_code_create-38x）。英語版（/en）と同じ範囲で、スペイン語・ポルトガル語（ブラジル）・ドイツ語を足すための設計。日本語版と英語版の URL・表示は変えない。

## 1. 関連ドキュメント

- [英語版（/en）設計](./i18n-en.md)（本書の前提。辞書の構造、ClientDict、PageView、hreflang の考え方）
- [設計概要](./overview.md)
- [ページ・ルーティング設計](./page-routing.md)
- [ディレクトリ構造設計](./directory-structure.md)
- [コンポーネント設計](./component-design.md)（7. 英語版（i18n）関連コンポーネント）
- [UI/UX仕様](./ui-ux-spec.md)（[1.6 AIっぽさを避ける方針](./ui-ux-spec.md#16-aiっぽさを避ける方針)）

---

## 2. 目的と範囲

### 2.1 目的

英語版と同じ 3 ページを、es / pt-BR / de でも出す。ヘッダーの言語切り替えは「EN」の 1 本のリンクから、5 言語を選べる一覧に変える。言語を足すたびに直書きを探して直す作りをやめ、言語ごとの差は 1 か所の設定にまとめる。

### 2.2 範囲

| 区分 | 内容 |
|---|---|
| 対象ページ | `/{locale}`、`/{locale}/create`、`/{locale}/guide/getting-started`（locale は es、pt-br、de） |
| 対象の仕組み | ルートの 1 本化、言語設定、辞書、hreflang、sitemap、metadata、JSON-LD、言語切り替え UI、ガイド MDX、用語集テスト |
| 対象外 | 記事の翻訳（用途別・ブログ・ほかのガイド）、言語別の 404（5zk で扱う）、OG 画像の翻訳、規約とプライバシーポリシーの翻訳、GA のカスタムディメンション |

### 2.3 完了条件（タスク本文から）

- 3 言語の 3 ページが本番ビルドで描画され、lang・title・hreflang・sitemap が正しい
- 言語切り替えで 5 言語を行き来できる
- 辞書のキーの欠けが型検査で検出される
- 既存の ja / en のテストがすべて通る

---

## 3. 決めたこと一覧

| 項目 | 決定 | 理由 |
|---|---|---|
| ルートの持ち方 | `app/en` を `app/[locale]` に移して 1 本化。`(ja)` はそのまま | 言語が 5 つになり、言語ごとに薄い page.tsx を並べると重複が増える |
| 静的生成 | `generateStaticParams` で en / es / pt-br / de を返し、`dynamicParams = false` を layout と page に書く | 全ページ SSG のまま。未定義の言語は 404 |
| URL | `/es`、`/pt-br`、`/de`。ja は接頭辞なし、en は `/en` のまま | `/pt` はポルトガル向けにも読める。URL は小文字にそろえる |
| hreflang | `ja`、`en`、`es`、`pt-BR`、`de`、`x-default`（ja） | 地域は pt だけ付ける。es は中南米とスペインの両方を含めたい |
| 言語ごとの差 | `LOCALE_CONFIG` に集約（接頭辞、lang、hreflang、og:locale、通貨、言語名、対応ページ、/poster 導線） | 直書きの `"en"` をなくす |
| 辞書 | `Dict = typeof ja`。各言語は `export const es: Dict`。`DICTS satisfies Record<Locale, Dict>` | キーの欠けを型検査で止める |
| Client への辞書 | 自分の言語の `ClientDict` だけを `I18nProvider` の `messages` で渡す | バンドルに全言語を入れない |
| 404 | 未定義の `/{locale}/...` は今と同じく `global-not-found`（日本語）。catch-all と言語別 404 は作らない | 5zk で別に扱う。`notFound()` の挙動は今の en と同じに保つ |
| 言語切り替え | 自作の disclosure（`button` + リンク一覧）。`select` と `role="menu"` は使わない | リンクなのでクローラが辿れる。矢印キーで勝手に遷移しない |
| ガイド MDX | `src/content/{locale}/guide/`。slug は全言語で同じ | en と同じ形 |
| yomiyasu lint | 除外を `en/` 固定から「ja 以外の言語ディレクトリ」に変える | es / pt-br / de が日本語として lint されるのを防ぐ |
| 翻訳品質 | 言語ごとの用語集と、辞書・ガイドの訳語テスト。ネイティブ確認はしない | 機械翻訳の限界を、検査できる範囲で補う |
| レイアウト | de を中心に 390px の E2E ではみ出しを検査 | ドイツ語は語が長い |
| es の通貨 | 未決。[13 節](#13-要承認事項)で承認を取る（推奨 USD） | 価格 0 なので影響は小さいが、Offer に必須 |
| 新しい依存 | 追加しない（next-intl も入れない） | 3 ページ、ICU 複数形なし。今の型付き辞書で足りる |

---

## 4. ルート構成

### 4.1 移動前

```
src/app/
├── (ja)/                          # ルートレイアウト ja（URL 接頭辞なし）
├── en/
│   ├── layout.tsx                 # RootShell locale="en"
│   ├── not-found.tsx              # NotFoundContent locale="en"
│   ├── page.tsx                   # /en
│   ├── (tool)/layout.tsx
│   ├── (tool)/create/page.tsx     # /en/create
│   ├── (marketing)/layout.tsx
│   └── (marketing)/guide/[slug]/page.tsx   # /en/guide/getting-started
├── global-not-found.tsx           # どのルートにも一致しない URL（日本語）
├── sitemap.ts / robots.ts / icon.* / favicon.ico
└── globals.css
```

### 4.2 移動後

```
src/app/
├── (ja)/                          # 変えない
├── [locale]/                      # git mv src/app/en src/app/[locale]
│   ├── layout.tsx                 # 2 つ目のルートレイアウト。generateStaticParams / dynamicParams=false / generateMetadata
│   ├── not-found.tsx              # LocaleNotFound（Client。useLocale() で言語を知る）
│   ├── page.tsx                   # /en /es /pt-br /de
│   ├── (tool)/layout.tsx          # Container size="wide"
│   ├── (tool)/create/page.tsx     # /{locale}/create
│   ├── (marketing)/layout.tsx     # Container size="narrow"
│   └── (marketing)/guide/[slug]/page.tsx   # /{locale}/guide/getting-started
├── global-not-found.tsx           # 変えない
└── sitemap.ts ほか                # sitemap.ts だけ一般化（7.3 節）
```

`[locale]/layout.tsx` の骨格:

```typescript
export const dynamicParams = false;

export function generateStaticParams() {
  return NON_JA_LOCALES.map((locale) => ({ locale })); // en, es, pt-br, de
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return buildRootMetadata(await resolveLocale(params));
}

export default async function LocaleLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveLocale(params);
  return <RootShell locale={locale}>{children}</RootShell>;
}
```

- `resolveLocale(params): Promise<NonJaLocale>` を `src/lib/i18n/params.ts` に置く。`await params` して `isNonJaLocale` で検証し、外れたら `notFound()`。`/ja` もここで外れる
- 各 `page.tsx` にも `export const dynamicParams = false` を書く。page は `generateMetadata({ params })` で `buildMetadata(getLocalePageMetadata(locale).home, locale)` を返す
- ガイドの `generateStaticParams({ params })` は `params.locale` を受け、`getGuideSlugList(locale).map((slug) => ({ slug }))` を返す
- 静的セグメント（`/create`、`/faq` など `(ja)` のページ）は動的セグメントより優先されるので衝突しない
- `RootShell` の `locale` 型は `Locale` にする。`<html lang>` は `LOCALE_CONFIG[locale].htmlLang`。ja 以外は必ず `I18nProvider locale messages={getClientMessages(locale)}` で包む（ja は今と同じく Provider なし）
- `buildRootMetadata(locale)` は `src/lib/metadata/rootMetadata.ts` に置く。`buildRootMetadata("ja")` と `buildRootMetadata("en")` は今の `rootMetadataJa` / `rootMetadataEn` と同じ値を返す（テストで比較）

### 4.3 404 の扱い

| URL の例 | どこで 404 になるか | 表示 |
|---|---|---|
| `/foo`、`/fr`、`/ja` | `[locale]` の `dynamicParams=false` で一致しない | `global-not-found`（日本語）。今の `/foo` と同じ |
| `/es/foo`、`/de/faq` | `[locale]` の下に一致するルートが無い | `global-not-found`（日本語）。今の `/en/foo` と同じ |
| `/de/guide/utm-setup` | ガイドの `dynamicParams=false`、または `notFound()` | 今の `/en/guide/utm-setup` と同じ出方 |

- 今の en の出方は、移行の最初のタスクで E2E に記録してから動かす（[14 節](#14-タスク分解案) M2）。移行後も en は同じ、es / pt-br / de も en と同じ出方であることを E2E で固定する
- `[locale]/not-found.tsx` は params を受け取れない。`RootShell` が包む `I18nProvider` から `useLocale()` と `useDict().common.notFound` で文言を引く Client Component（`LocaleNotFound`）にする。トップへのリンクは `localePath(locale, "/")`
- `[locale]/[...rest]` の catch-all は作らない。5zk で言語別 404 を作るときに扱う

---

## 5. 言語設定 LOCALE_CONFIG

### 5.1 言語の一覧（`src/i18n/locales.ts`）

```typescript
export const LOCALES = ["ja", "en", "es", "pt-br", "de"] as const;
export type Locale = (typeof LOCALES)[number];
export type NonJaLocale = Exclude<Locale, "ja">;
export const NON_JA_LOCALES = LOCALES.filter((l): l is NonJaLocale => l !== "ja");
export function isLocale(value: string): value is Locale;
export function isNonJaLocale(value: string): value is NonJaLocale;
```

- `src/i18n/types.ts` の `Locale` はここから re-export する。`"ja" | "en"` の直書きは消す
- `RootShellLocale` も `Locale` に置き換える

### 5.2 設定の型（`src/lib/i18n/localeConfig.ts`）

```typescript
export interface LocaleConfig {
  prefix: "" | `/${string}`;          // URL 接頭辞。ja は ""
  htmlLang: string;                   // <html lang>、a の lang / hrefLang
  hreflang: string;                   // alternates.languages のキー
  ogLocale: string;                   // openGraph.locale
  currency: "JPY" | "USD" | "EUR" | "BRL"; // JSON-LD Offer.priceCurrency
  nativeName: string;                 // 切り替え一覧の表示名（自称）
  shortName: string;                  // 切り替えボタンの表示名（ヘッダーに収まる長さ）
  paths: "all" | readonly string[];   // その言語がある ja 側のパス
  poster: boolean;                    // /poster への導線を出すか
}

/** ja 以外の言語が持つページ（ja 側のパス）。EN_AVAILABLE_PATHS の一般化 */
export const TRANSLATED_PATHS = ["/", "/create", "/guide/getting-started"] as const;

export const LOCALE_CONFIG = {
  ja:      { prefix: "",       htmlLang: "ja",    hreflang: "ja",    ogLocale: "ja_JP", currency: "JPY", nativeName: "日本語",             shortName: "日本語",    paths: "all",            poster: true },
  en:      { prefix: "/en",    htmlLang: "en",    hreflang: "en",    ogLocale: "en_US", currency: "USD", nativeName: "English",            shortName: "English",   paths: TRANSLATED_PATHS, poster: false },
  es:      { prefix: "/es",    htmlLang: "es",    hreflang: "es",    ogLocale: "es_ES", currency: "USD", nativeName: "Español",            shortName: "Español",   paths: TRANSLATED_PATHS, poster: false }, // currency は要承認
  "pt-br": { prefix: "/pt-br", htmlLang: "pt-BR", hreflang: "pt-BR", ogLocale: "pt_BR", currency: "BRL", nativeName: "Português (Brasil)", shortName: "Português", paths: TRANSLATED_PATHS, poster: false },
  de:      { prefix: "/de",    htmlLang: "de",    hreflang: "de",    ogLocale: "de_DE", currency: "EUR", nativeName: "Deutsch",            shortName: "Deutsch",   paths: TRANSLATED_PATHS, poster: false },
} as const satisfies Record<Locale, LocaleConfig>;
```

- `paths` は ja 側のパスで持つ。ja は全ページがあるので `"all"`
- Client でも使う（言語切り替え）。文字列だけなのでバンドルへの影響は小さい
- `TRANSLATED_PATHS` のガイド部分は `getGuideSlugList(locale)` と食い違わないことを単体テストで確かめる

### 5.3 パスの関数（`src/lib/i18n/routes.ts`）

```typescript
export function hasVersion(locale: Locale, jaPath: string): boolean;
export function localePath(locale: Locale, jaPath: string): string;   // prefix + jaPath。"/" は prefix（ja は "/"）
export function splitLocale(pathname: string): { locale: Locale; jaPath: string }; // 先頭の接頭辞を外す
export function getAlternatePath(pathname: string, to: Locale): string;            // 8.3 節

// 互換のため残す（既存テストと既存の呼び出し）
export const EN_AVAILABLE_PATHS: readonly string[] = LOCALE_CONFIG.en.paths;
export function hasEnVersion(path: string): boolean; // = hasVersion("en", path)
```

- `splitLocale` は接頭辞を「セグメント単位」で判定する。`/es` と `/es/...` は es、`/esports` は ja の `/esports`
- `"en"` の直書き（`getDict` の三項、`localePath`、`getAlternatePath`、`buildJsonLd`、`getGuide`、`Header`、`Footer`、`GuideArticlePageView`、`RootShell`）は、すべて `LOCALE_CONFIG` か `locale !== "ja"` に置き換える

---

## 6. 辞書の型と Client への渡し方

### 6.1 ファイル

```
src/i18n/
├── locales.ts        # 5.1 節
├── types.ts          # Dict = typeof ja、ClientDict（変えない）。Locale は locales.ts から
├── ja.ts / en.ts     # 変えない（新しいキーの追加だけ）
├── es.ts             # export const es: Dict = { ... }
├── ptBr.ts           # export const ptBr: Dict = { ... }（ファイル名と識別子は camelCase）
├── de.ts             # export const de: Dict = { ... }
├── getDict.ts        # DICTS[locale]
└── glossary/         # 10 節
```

### 6.2 型

- `Dict = typeof ja` のまま。ja を `as const` にしない（値が文字列リテラル型になり、他言語が代入できなくなる）
- 各言語は `export const es: Dict = { ... }` と型注釈で書く。キーが欠けても余ってもコンパイルエラーになる
- `getDict.ts`:

```typescript
const DICTS = { ja, en, es, "pt-br": ptBr, de } satisfies Record<Locale, Dict>;
export function getDict(locale: Locale): Dict { return DICTS[locale]; }
export function getClientMessages(locale: Locale): ClientDict { return pickClientDict(getDict(locale)); }
```

- 言語を `LOCALES` に足して辞書を作り忘れると、`DICTS` の `satisfies` で止まる

### 6.3 Client への渡し方

- 今の形をそのまま一般化する。`RootShell` が ja 以外で `getClientMessages(locale)` を `I18nProvider` の `messages` に渡す。各言語のページには自分の言語の `ClientDict` だけが RSC ペイロードで届く
- `I18nProvider` は、ja 以外の `locale` で `messages` が無いとき throw する（黙って ja を出すと、翻訳漏れに気づけない）。Provider なしの既定が ja なのは変えない（既存のコンポーネントテストを無変更で通すため）
- ESLint の `no-restricted-imports` に `@/i18n/es`、`@/i18n/ptBr`、`@/i18n/de` を足し、`src/components/**` からの import を禁止する
- 確認: ビルド後の `.next/static` に es / pt-br / de の辞書固有の文字列（各言語のトップの h1 など）が無いことを、既存の `staticOutput.test.ts` を全言語に広げて検査する

### 6.4 新しく足すキー

ja と en にも同じキーを足す（`Dict` が全言語に要求するため）。ja の既存の値は変えない。

| キー | 用途 | ja の値 | en の値 |
|---|---|---|---|
| `common.languageSwitch.buttonLabel` | 切り替えボタンの読み上げ名（視覚的に隠す） | 言語（Language） | Language |
| `common.languageSwitch.listLabel` | 一覧の `aria-label` | 言語を選ぶ | Choose a language |
- 旧キー `common.languageSwitch.label` / `hint` は、翻訳タスクと衝突しないよう M9 で全辞書から消した
- フッターの「規約は日本語だけ」の注記は、今の en 用のキーをそのまま使う。`Footer.tsx` の `isEn` を `locale !== "ja"` に替えれば、各言語の辞書の値が出る。キーの実名は実装時に `Footer.tsx` で確認する

## 7. hreflang・sitemap・metadata の一般化

### 7.1 alternatesFor（`src/lib/seo/alternates.ts`）

metadata と sitemap の両方で使う 1 つの関数にする。今の `alternatePaths {ja, en}`、`alternateLocale` の反転、sitemap の `languagesFor(jaPath, enPath)` は 2 言語固定なので置き換える。

```typescript
/** jaPath を持つ全言語の hreflang → 絶対 URL。ja 以外に 1 つも無ければ undefined */
export function alternatesFor(
  jaPath: string,
  options?: { bareRoot?: boolean },
): { languages: Record<string, string> } | undefined;
```

- `bareRoot`（M3 で追加）: ja トップの URL を末尾スラッシュなしの `SITE_URL` にする。metadata の ja トップは `SITE_URL/`、sitemap の ja トップは `SITE_URL` で、どちらも既存テストが固定しているため、sitemap だけが `bareRoot: true` を渡す。表記をそろえるなら別タスクで判断する

- 集合は `LOCALES` のうち `hasVersion(locale, jaPath)` が真の言語すべて。キーは `LOCALE_CONFIG[locale].hreflang`、値は `SITE_URL + localePath(locale, jaPath)`
- `x-default` は ja の URL
- 例: `alternatesFor("/create")` は `{ ja, en, es, pt-BR, de, x-default }` の 6 キー。`alternatesFor("/faq")` は undefined
- 自己参照と相互参照は、どの言語のページから呼んでも同じ集合になるので自動でそろう

### 7.2 buildMetadata

```typescript
interface BuildMetadataOptions {
  title: string;
  description: string;
  path: string;          // そのページ自身のパス（canonical）
  ogImagePath?: string;
  noIndex?: boolean;
  jaPath?: string;       // 翻訳のあるページだけ指定。alternatePaths を置き換える
}
export function buildMetadata(options: BuildMetadataOptions, locale: Locale = "ja"): Metadata;
```

- `alternates.languages` は `alternatesFor(jaPath)`。`jaPath` が無ければ出さない
- `openGraph.locale` は `LOCALE_CONFIG[locale].ogLocale`。`openGraph.alternateLocale` は `jaPath` を持つほかの言語の `ogLocale` の配列
- `ALTERNATE_PATHS` と `getGuideAlternatePaths` は消す。ガイドは `jaPath: \`/guide/${slug}\`` を渡し、`hasVersion` が偽の言語は自動で外れる
- `PAGE_METADATA` は形を保ち、`alternatePaths` を `jaPath` に替える
- `PAGE_METADATA_EN` は `getLocalePageMetadata(locale: NonJaLocale)` に一般化する。`home` と `create` を返し、`path` は `localePath(locale, "/")` など。互換のため `PAGE_METADATA_EN = getLocalePageMetadata("en")` を残す
- ja と en の出力のうち、ja / en / x-default の値は今と同じ。増えるのは es / pt-BR / de のキーだけ

### 7.3 sitemap

- ja のエントリ: 今のまま。`alternates` は `alternatesFor(path)` があるときだけ付ける
- ja 以外: `NON_JA_LOCALES` の各言語について、`/`、`/create`、`getGuideSlugList(locale)` の各 slug のエントリを作る。`alternates` は `alternatesFor(jaPath)`
- priority は今の en と同じ（トップ 0.8、create 0.7、ガイド 0.6）を全言語に使う
- 並び順は ja のあと `LOCALES` の順。重複する URL が無いことをテストする

### 7.4 JSON-LD（`src/lib/schema/buildJsonLd.ts`）

- `priceCurrency` は `LOCALE_CONFIG[locale].currency`
- `url` は `SITE_URL + localePath(locale, "/create")`
- `inLanguage` は ja 以外で出す（今の `locale === "en"` を `locale !== "ja"` に）。値は `dict.schema.inLanguage` で、`LOCALE_CONFIG[locale].htmlLang` と一致することをテストする
- `buildOrganizationSchema` は変えない

### 7.5 そのほか

- OG 画像は全言語で共通（日本語の見出し入り）のまま
- `robots.ts` は変えない
- GA はパスの接頭辞で言語を見分ける。`site_lang` は入れない（en と同じ）

---

## 8. 言語切り替え UI

### 8.1 構造

`src/components/layout/Header/LanguageSwitcher.tsx`（`'use client'`）を作り直す。

```tsx
<div className={styles.langSwitch} ref={rootRef}>
  <button type="button" aria-expanded={open} aria-controls={listId} className={styles.langButton}>
    <span className={styles.srOnly}>{buttonLabel}: </span>
    <span lang={current.htmlLang}>{current.shortName}</span>
    <span aria-hidden="true" className={styles.chevron} />
  </button>
  <ul id={listId} aria-label={listLabel} hidden={!open} className={styles.langList}>
    {LOCALES.map((l) => (
      <li key={l}>
        <a href={getAlternatePath(pathname, l)} hrefLang={LOCALE_CONFIG[l].htmlLang}
           lang={LOCALE_CONFIG[l].htmlLang} aria-current={l === locale ? "true" : undefined}>
          {LOCALE_CONFIG[l].nativeName}
        </a>
      </li>
    ))}
  </ul>
</div>
```

- `listId` は `useId()`。`pathname` は `usePathname()`。クエリと hash は引き継がない（今と同じ）
- 一覧の順は `LOCALES` の順で固定。言語ごとに並べ替えない
- 表示名は自称（Deutsch、Português (Brasil) など）。国旗の絵文字、地球アイコン、pill は使わない（[ui-ux-spec 1.6](./ui-ux-spec.md#16-aiっぽさを避ける方針)）。ボタンの見た目は文字リンク風（旧 `.langLink` に合わせた。旧クラスは M9 で削除）。開閉の印は CSS の小さな三角（border で描く）
- 一覧は `position: absolute` でボタンの右端にそろえて下に開く。背景はサーフェス色、1px の枠線。幅は「Português (Brasil)」が 1 行に収まる最小幅
- 遷移は別ルートレイアウトへの移動で full reload になるので、`next/link` ではなく `a` を使う（今と同じ）
- JS が無いと一覧は開かない。リンクは HTML に残るのでクローラは辿れる。これは許容する
- 配置は今と同じ。デスクトップは `desktopNav` の右端、モバイルはヘッダーバーのメニューボタンの左に常に出す

### 8.2 キーボードと読み上げ

| 操作 | 動き |
|---|---|
| ボタンで Enter / Space | 開閉する（ネイティブの button の動き）。開いてもフォーカスはボタンに残す |
| Tab | ボタンの次に一覧のリンクへ順に進む（DOM 順） |
| 一覧の中で Enter | その言語のページへ移る |
| Esc（ボタンか一覧にフォーカス） | 閉じて、ボタンへフォーカスを戻す |
| 外側をクリック | 閉じる（`pointerdown` を document で見て、`rootRef` の外なら閉じる） |
| フォーカスが外へ出る | 閉じる（`focusout` の `relatedTarget` が `rootRef` の外なら閉じる） |

- 矢印キーでの移動は付けない（`role="menu"` ではないので、Tab で足りる）
- 読み上げ名は「言語（Language）: 日本語、折りたたみ」のようになる。`aria-expanded` で開閉状態が伝わる
- 現在の言語のリンクには `aria-current="true"` を付ける。各リンクの `lang` で、その言語の読み方で読まれる

### 8.3 切り替え先の規則

`getAlternatePath(pathname, to)` の手順:

1. クエリと hash を外し、末尾スラッシュを除く
2. `splitLocale` で先頭の言語接頭辞を外し、ja 側のパスにする（接頭辞が無ければ ja のパスとみなす）
3. `hasVersion(to, jaPath)` が真なら `localePath(to, jaPath)`、偽なら `localePath(to, "/")`

| 現在のパス | to | 行き先 |
|---|---|---|
| `/` | es | `/es` |
| `/create` | pt-br | `/pt-br/create` |
| `/guide/getting-started` | de | `/de/guide/getting-started` |
| `/faq`、`/guide/utm-setup` | de | `/de` |
| `/es/create` | ja | `/create` |
| `/es/create` | de | `/de/create` |
| `/de/guide/getting-started` | en | `/en/guide/getting-started` |
| `/pt-br`、`/pt-br/` | ja | `/` |
| `/en/create/` | es | `/es/create` |
| `/es` | es | `/es`（自分自身） |
| `/es/foo`（global-not-found） | ja | `/` |
| `/es/foo`（global-not-found） | es | `/es` |
| `/esports`（ja の未定義 URL） | es | `/es`（`/esports` は接頭辞と見なさない） |
| `/ja`（404） | en | `/en` |

- global-not-found は ja のシェル（Provider なし）で描くので、`useLocale()` は ja を返す。どの URL でも上の規則で自分自身を指さない行き先が出る（今の en と同じ考え方）

---

## 9. ガイド MDX の置き場と yomiyasu lint の除外

### 9.1 置き場

```
src/content/
├── guide/getting-started.mdx          # ja（動かさない）
├── en/guide/getting-started.mdx       # 動かさない
├── es/guide/getting-started.mdx       # 新規
├── pt-br/guide/getting-started.mdx    # 新規
└── de/guide/getting-started.mdx       # 新規
```

- `getGuide.ts` の `contentDir(locale)` は、ja なら `src/content/guide`、ほかは `src/content/{locale}/guide`
- slug は全言語で `getting-started`。frontmatter のキーは ja と同じ。`date` は ISO 文字列のまま
- HowTo の手順の見出しアンカー（`#step-n`）は en と同じ数と順にする。`howtoStepAnchors.test.ts` を全言語に広げる
- MDX 内の内部リンクは `/{locale}/...` で書き、行き先は `hasVersion(locale, jaPath)` が真であること。`enGuideLinks.test.ts` を `localeGuideLinks.test.ts` に一般化し、`NON_JA_LOCALES` でループする（en の検査内容は変えない）
- パンくずは en と同じ 2 段（`/{locale}` › 記事タイトル）

### 9.2 yomiyasu lint の除外

- 今は `tests/helpers/yomiyasu.ts` が `en/` だけを除外している。es / pt-br / de を置くと日本語として lint され、テストが落ちる
- 除外を `NON_JA_LOCALES` から作る: `const NON_JA_DIRS = NON_JA_LOCALES.map((l) => \`${l}/\`)`。`listJapaneseArticles` と強制ロジックの両方をこれに替える
- `yomiyasuLintGuard.test.ts` に「除外するディレクトリが `NON_JA_LOCALES` と一致する」「`src/content` 直下の言語っぽいディレクトリ（2〜5 文字の小文字とハイフン）が `NON_JA_LOCALES` に無ければ除外しない」を足す。言語でないディレクトリが黙って除外されるのを防ぐ
- `.claude/rules/yomiyasu-lint.md` の「英語版（`src/content/en/`）は対象外」は「ja 以外の言語ディレクトリ（`NON_JA_LOCALES`）は対象外」に直す必要がある。設定ファイルなので実装エージェントは触らず、PM がユーザーの了承を得て直す（[13 節](#13-要承認事項)）

---

## 10. 用語集と訳語テスト

### 10.1 用語集の置き場と型

並列の翻訳タスクが同じファイルを触らないよう、言語ごとにファイルを分ける。

```
src/i18n/glossary/
├── terms.ts     # TermId の一覧、各用語の ja / en の参照値、検査する辞書キー（M4 で作る）
├── es.ts        # export const esGlossary: Glossary（M6）
├── ptBr.ts      # （M7）
└── de.ts        # （M8）
```

```typescript
export const TERM_IDS = ["qrCode", "utmParameters", "utmSource", "utmMedium", "utmCampaign",
  "download", "png", "svg", "pdf", "url", "preset", "noSignUp", "browser", "frame", "logo",
  "caption", "contrast", "googleAnalytics"] as const;
export type TermId = (typeof TERM_IDS)[number];

export interface GlossaryEntry {
  term: string;                  // 採用する訳語
  forbidden: readonly string[];  // 使わない訳語（ゆれ、別地域の語）
}
export type Glossary = Record<TermId, GlossaryEntry>;

/** 訳語が必ず入る辞書キー（例: download → tool.download.pngButton） */
export const TERM_ANCHORS: Partial<Record<TermId, readonly string[]>>;
```

- 用語集は Client から import しない（テストと翻訳作業の参照用）。ESLint の import 制限に `@/i18n/glossary/*` も足す
- `Record<TermId, GlossaryEntry>` なので、用語を足して訳を書き忘れるとコンパイルエラー

### 10.2 用語の例（最終の値は各翻訳タスクで決める）

| TermId | es | pt-br | de |
|---|---|---|---|
| qrCode | código QR（禁止: QR-Code） | QR Code（禁止: QR-Code） | QR-Code（禁止: QR Code、QR-code） |
| utmParameters | parámetros UTM | parâmetros UTM | UTM-Parameter |
| download | descargar / Descargar | baixar / Baixar（禁止: transferir） | herunterladen / Herunterladen |
| png / svg / pdf | PNG / SVG / PDF（そのまま） | 同左 | 同左 |
| noSignUp | sin registro | sem cadastro（禁止: sem registo） | ohne Anmeldung |
| 呼びかけ | tú | você（禁止: tu、vós） | Sie（禁止: du、dein、dich、dir） |

- pt-br の禁止語には、ポルトガルの語（ficheiro、ecrã、registo、transferir）を入れる
- 呼びかけは `TermId` に入れず、言語ごとの `forbidden` 正規表現として `glossary/{locale}.ts` に `addressForbidden` で持つ

### 10.3 訳語テスト

共通の検査関数 `checkGlossary(locale)` を `tests/helpers/glossary.ts` に置き（M4）、各翻訳タスクが `tests/unit/i18n/glossary.{locale}.test.ts` から呼ぶ。

| 検査 | 対象 | 内容 |
|---|---|---|
| 禁止語 | 辞書の全値、ガイド MDX の本文と frontmatter | `forbidden` と `addressForbidden` が語の境界で現れない（大文字小文字を区別しない。de の Sie / sie は区別する） |
| 必須語 | `TERM_ANCHORS` の辞書キー | そのキーの値に `term` が入る |
| ガイドの訳語 | ガイド MDX | `qrCode`、`utmParameters`、`download` の `term` が 1 回以上現れる |
| 記号のそろい | 辞書の全値 | en の値に PNG / SVG / PDF / UTM / URL が入るキーは、その言語の値にも同じ大文字の綴りで入る |
| 文字種 | 辞書の全値、ガイド MDX | 仮名と漢字が無い |
| プレースホルダ | 辞書の全値 | `{n}` などの集合が ja と同じ |

### 10.4 この方式の限界

- 翻訳文は機械的に作る。ネイティブの確認はしない
- テストで分かるのは、用語のそろい、禁止語、記号、文字種、キーの欠けまで。文法の誤り、不自然な言い回し、意味のずれ、失礼な表現は検出できない
- 下書きの元は人が通読した `en.ts` と en のガイドにする（日本語からの直訳より、意味のずれが少ない）
- 軽くする工夫: 短い文、慣用句を使わない、sentence case、感嘆符なし、売り文句を使わない（[i18n-en 9 節](./i18n-en.md#9-英語コピーの方針)と同じ方針）
- 公開後に GA と Search Console で言語別の直帰と流入を見る。問い合わせで誤訳の指摘があれば直す

## 11. テスト方針

### 11.1 既存の ja・en テストの扱い

| 区分 | 扱い |
|---|---|
| ja のテスト | 無変更で全通過させる。例外は hreflang が増える分（下の行） |
| `@/app/en/...` を import するテスト（`hreflangPairs.test.ts`、`enGuidePage.test.tsx`） | import を `@/app/[locale]/...` に替え、`params: Promise.resolve({ locale: "en" })` を渡す形に直す。期待値は変えない |
| `routeStructure.test.ts` | `src/app/en/**` の検査を `src/app/[locale]/**` の検査に書き直す（`generateStaticParams`、`dynamicParams = false`、`RootShell` の使い方） |
| `alternates.languages` を丸ごと比べるテスト（`buildMetadataAlternates`、`hreflangPairs`、`sitemap`、`sitemapEn` など） | es / pt-BR / de のキーを足すだけ認める。ja / en / x-default の値は変えない |
| `ALTERNATE_PATHS`、`getGuideAlternatePaths`、`alternatePaths` を使うテスト | `jaPath` と `alternatesFor` の形に直す。出力の期待値は上の行と同じ規則 |
| `LanguageSwitcher.test.tsx`、`HeaderLanguageSwitch.test.tsx`、`language-switch.spec.ts`、`langLinkStyle.test.ts` | UI が変わるので書き直す。ja ↔ en の往復の検査は残す |
| `yomiyasuLint` 系 | 除外の作り方が変わるだけ。基準ファイル（baseline）は変えない |
| en の E2E（`en-pages`、`en-acceptance`、`en-guide`） | 無変更で通す |

テストを変えるときは、変えた理由（どの節の変更による期待値の追加か）をテストのコメントに 1 行書く。

### 11.2 追加する単体・コンポーネントテスト

| 対象 | 確認すること |
|---|---|
| `locales.ts` | `LOCALES` の中身、`isLocale`、`isNonJaLocale`、`NON_JA_LOCALES` に ja が無い |
| `LOCALE_CONFIG` | prefix が `/` + locale（ja は空）、`paths` の ja 以外が `TRANSLATED_PATHS`、ガイドのパスが `getGuideSlugList(locale)` と一致 |
| `routes.ts` | 8.3 節の表の全行、`localePath` の全言語、`splitLocale("/esports")` が ja |
| `resolveLocale` | en / es / pt-br / de を返す、ja と未定義の値で `notFound()` |
| `[locale]` の `generateStaticParams` | layout が 4 言語、ガイドが言語ごとの slug |
| 辞書 | 全言語のキー集合が一致、空文字なし、ja 以外に仮名・漢字なし、プレースホルダの集合が一致。es / pt-br / de の値が en と同じ文字列ばかりでない（下書きのままの検出。M4 の下書きでは落ちるので M9 で足す） |
| `I18nProvider` | ja 以外で `messages` が無いと throw |
| `alternatesFor` | 翻訳ページで 6 キー、ja だけのページで undefined、x-default が ja |
| `buildMetadata` / `buildRootMetadata` | 言語ごとの `og:locale`、canonical、`alternateLocale`、ja と en が今と同じ |
| JSON-LD | 言語ごとの `priceCurrency`、`inLanguage`、`url` |
| sitemap | ja 以外の各言語に 3 件、全件に `alternates`、URL の重複なし |
| `getGuide` | 言語ごとの読み込み、無い slug は null |
| MDX リンク、HowTo アンカー | 全言語（9.1 節） |
| yomiyasu の除外 | 9.2 節 |
| 用語集 | 10.3 節（言語ごと） |
| `.next/static` | es / pt-br / de の辞書固有の文字列が無い |
| ページ（コンポーネント） | es / pt-br / de の 3 ページが自分の言語で描画、h1、日本語の文字が無い、`href` が自分の接頭辞か規約系だけ、/poster 導線が無い |
| `LanguageSwitcher` | `aria-expanded` の開閉、Esc で閉じてフォーカスが戻る、外側クリックで閉じる、5 本のリンクと `hrefLang` / `lang`、`aria-current`、パスごとの行き先 |
| `LocaleNotFound` | 各言語の文言とトップへのリンク |
| `Footer` | 各言語で規約の注記が出る |

### 11.3 追加する E2E（Playwright）

| ファイル | 確認すること |
|---|---|
| `multi-locale-pages.spec.ts` | 3 言語 x 3 ページで `html[lang]`、`title`、`link[rel=alternate][hreflang]` が 6 本、canonical |
| `language-switch.spec.ts`（書き直し） | `/` → Deutsch → `/de`、`/de/create` → Español → `/es/create`、`/faq` → Português → `/pt-br`。キーボードだけで開いて選ぶ、Esc で閉じる |
| `not-found-locales.spec.ts` | `/fr`、`/ja`、`/es/foo`、`/de/guide/utm-setup` の出方が 4.3 節どおりで、移行前に記録した en の出方と同じ |
| `multi-locale-download.spec.ts` | `/de/create` で URL を入れて PNG / SVG / PDF をダウンロードできる |
| `multi-locale-layout.spec.ts` | 390px 幅で、3 言語 x 3 ページに横スクロールが無い（`scrollWidth <= clientWidth`）。ボタンとナビの各要素で文字がはみ出さない。切り替えの一覧を開いても画面内に収まる。de を必ず含める |
| 既存の静的ファイル | `/sitemap.xml`、`/robots.txt`、`/favicon.ico`、`/icon.svg` が `[locale]` に吸われず今どおり返る |

---

## 12. 移行の注意点

- **en の URL を変えない**: `git mv src/app/en src/app/[locale]` は 1 つのタスクで行う。ビルド出力で `/en`、`/en/create`、`/en/guide/getting-started` が静的生成（SSG）のままであることを確認する
- **先に直書きを消す**: ルートを動かす前に、`"en"` の直書きを `LOCALE_CONFIG` に置き換える（M1）。M1 は振る舞いを変えないので、既存テストが無変更で通ることで正しさを確かめられる
- **404 の出方を先に記録する**: 移行前に `/foo`、`/en/foo`、`/en/guide/utm-setup` の出方を E2E に書き、移行後も同じであることを確かめる
- **`[locale]` はトップの 1 段目すべてに当たる**: `(ja)` の静的ルート、メタデータルート（sitemap、robots、icon）、`public/` のファイルが優先される。上の E2E で確認する
- **params は Promise**: `await params` してから `resolveLocale` で検証する。型は `NonJaLocale` に絞る
- **下書きの辞書**: 3 言語の翻訳を並列にするため、M4 で es / pt-br / de の辞書と MDX を en の写しで置く。dev には一時的に英語の es ページができる。本番反映は全タスクが終わってから（M9 の「en と同じ文字列ばかりでない」テストで下書きの残りを止める）
- **辞書に足すキー**: 新しいキーは M4 で ja / en / 下書き 3 言語に一度に足す。翻訳タスクの途中でキーを足さない（並列タスクが同じ型に引きずられるため）
- **書体**: `Noto_Sans_JP` の `subsets: ["latin"]` は Latin-1 の範囲（ñ á é ü ã õ ç ß ä ö）を含む想定。ドイツ語の引用符「„ "」も含め、M9 で字形が欠けないか確認する。欠けたときは CSS の `font-family` の代替書体で表示される（新しい書体は足さない）
- **フッターの注記**: 規約が日本語だけである旨を各言語で書く（今の en と同じ位置）
- **OG 画像**: 日本語の見出しのまま。各言語用は作らない
- **設計書の更新**: 本書の承認後、`overview.md` と `page-routing.md` に本書へのリンクと `[locale]` のルートを足す（設計エージェントが行う）

---

## 13. 要承認事項

**2026-10-28 にユーザーがすべて推奨案で承認した。** es の通貨は USD、呼びかけは de Sie / es tú / pt-br você、翻訳の元は en、切り替えボタンは今の言語名を表示し読み上げ名は「言語（Language）」、yomiyasu のルール文書は PM が M4 で直す、dev では翻訳完了まで英語の写しを置き本番には出さない。

### 13.1 es の JSON-LD の通貨

| 案 | 内容 | 長所 | 短所 |
|---|---|---|---|
| **A: USD（推奨）** | en と同じ | スペイン語の話者の多くは中南米と米国にいる。hreflang の `es` は地域を限らないので、地域を指さない通貨が合う。価格 0 なので実害が無い | スペインの人には見慣れない |
| B: EUR | de と同じ | スペインには自然 | スペインだけを指しているように読める |

推奨は A（USD）。`og:locale` は A でも B でも `es_ES` にする（Open Graph に中南米をまとめる標準の値が無いため）。

### 13.2 そのほか確認したい点

1. **呼びかけの形**: de は Sie、es は tú、pt-br は você。推奨どおりでよいか（de は業務で使う人が多いので丁寧な Sie にする）
2. **翻訳の元**: 日本語ではなく、人が通読した en の辞書とガイドから訳す。推奨どおりでよいか
3. **切り替えボタンの表示**: 今の言語の名前（ja なら「日本語」）に開閉の印を付ける。ja のページで日本語が読めない人にも見つけやすいよう、読み上げ名は「言語（Language）」にする。代案は ja のページだけ見える文字を「Language」にする
4. **yomiyasu のルール文書の変更**: `.claude/rules/yomiyasu-lint.md` の対象外を「ja 以外の言語ディレクトリ」に直してよいか（9.2 節）
5. **dev での下書き表示**: 翻訳が終わるまで dev の es / pt-br / de ページが英語のままになる。本番には出さない前提でよいか

---

## 14. タスク分解案

依存: **M1 → M2 → M3 → M4 → (M5, M6, M7, M8 並列) → M9**

- M6〜M8 は自分の言語のファイル（辞書、用語集、MDX、用語集テスト）だけを触るので並列にできる
- M5 は `LanguageSwitcher` と `Header.module.css` だけを触る。必要なキーは M4 で足すので、M6〜M8 と並列にできる
- M1〜M4 は `routes.ts`、`getDict.ts`、`buildMetadata.ts`、`RootShell` などを順に触るので順次にする

| ID | 内容 | 主な変更ファイル | 完了条件 | 依存 | 担当 |
|---|---|---|---|---|---|
| M1 | 言語設定の導入と `"en"` 直書きの除去（ルートは動かさない。`LOCALES` は ja / en のまま） | `src/i18n/locales.ts`、`src/i18n/types.ts`、`src/lib/i18n/localeConfig.ts`、`src/lib/i18n/routes.ts`、`src/i18n/getDict.ts`、`src/lib/content/getGuide.ts`、`src/lib/schema/buildJsonLd.ts`、`Header.tsx`、`Footer.tsx`、`GuideArticlePageView.tsx`、`RootShell.tsx` | 既存テストが無変更で全通過。`routes.ts` と `LOCALE_CONFIG` の単体テスト。src に `=== "en"` が残らない | なし | frontend-engineer |
| M2 | `app/en` を `app/[locale]` に移す | `src/app/[locale]/**`（git mv）、`src/lib/i18n/params.ts`、`src/lib/metadata/rootMetadata.ts`、`LocaleNotFound`、`I18nProvider`（throw）、`routeStructure.test.ts` ほか import を直すテスト、404 の記録 E2E | 移動前に記録した 404 の E2E と en の E2E が通る。ビルドで en の 3 ページが SSG。`/ja` が 404。静的ファイルが返る | M1 | frontend-engineer（Next.js スペシャリストの助言どおり） |
| M3 | hreflang・metadata・sitemap の一般化 | `src/lib/seo/alternates.ts`、`buildMetadata.ts`、`sitemap.ts`、`[locale]` と `(ja)` の 3 ページの metadata 呼び出し、関係する metadata / sitemap テスト | `alternatesFor` の単体テスト。ja / en の出力が今と同じ（`LOCALES` がまだ 2 言語なので値は不変） | M2 | frontend-engineer |
| M4 | 3 言語の土台（下書き） | `locales.ts`（5 言語に）、`localeConfig.ts`（es / pt-br / de）、`src/i18n/es.ts`・`ptBr.ts`・`de.ts`（en の写し）、`getDict.ts`、新しいキー（6.4 節）を ja / en / 3 言語に、`src/content/{es,pt-br,de}/guide/getting-started.mdx`（en の写し）、`tests/helpers/yomiyasu.ts`、`yomiyasuLintGuard.test.ts`、`src/i18n/glossary/terms.ts`、`tests/helpers/glossary.ts`、`localeGuideLinks.test.ts`、`staticOutput.test.ts`、ESLint の import 制限 | 3 言語の 3 ページがビルドされる（中身は英語）。辞書のキー一致テスト、sitemap と hreflang の 6 キーのテスト、yomiyasu の除外テストが通る | M3 | frontend-engineer |
| M5 | 言語切り替えの disclosure | `LanguageSwitcher.tsx`、`Header.module.css`、`Header.tsx`（配置だけ）、切り替えのテスト、`language-switch.spec.ts` の書き直し | 8.2 節の操作のコンポーネントテスト、8.3 節の表の単体テスト、E2E で 5 言語の往復とキーボード操作 | M4 | frontend-engineer（CSS は web-designer） |
| M6 | es の翻訳 | `src/i18n/es.ts`、`src/i18n/glossary/es.ts`、`src/content/es/guide/getting-started.mdx`、`tests/unit/i18n/glossary.es.test.ts` | 用語集テスト、辞書のテスト、es のページの描画テストが通る | M4 | frontend-engineer |
| M7 | pt-br の翻訳 | `src/i18n/ptBr.ts`、`src/i18n/glossary/ptBr.ts`、`src/content/pt-br/guide/getting-started.mdx`、`tests/unit/i18n/glossary.pt-br.test.ts` | 同上（pt-br） | M4 | frontend-engineer |
| M8 | de の翻訳 | `src/i18n/de.ts`、`src/i18n/glossary/de.ts`、`src/content/de/guide/getting-started.mdx`、`tests/unit/i18n/glossary.de.test.ts` | 同上（de） | M4 | frontend-engineer |
| M9 | 結合 E2E とレイアウトの調整 | `tests/e2e/multi-locale-*.spec.ts`、`not-found-locales.spec.ts`、はみ出し対策の CSS（`Header.module.css` ほか）、下書き検出テスト | 11.3 節の E2E がすべて通る。390px で de を含む 3 言語にはみ出しが無い。2.3 節の完了条件をすべて満たす | M5、M6、M7、M8 | frontend-engineer（CSS は web-designer） |
