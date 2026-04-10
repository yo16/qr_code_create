# ページ・ルーティング設計

## 関連ドキュメント

- [アーキテクチャ設計](./architecture.md)
- [ディレクトリ構造設計](./directory-structure.md)
- [コンポーネント設計](./component-design.md)
- [データモデル設計](./data-model.md)
- [UI/UX仕様](./ui-ux-spec.md)
- [マーケティング戦略 - サイトアーキテクチャ](../marketing-strategy.md)

---

## 1. ルーティング全体図

```
/ .......................... トップページ（SSG）
├── /create ................ QRコード生成ツール（SSG + CSR）
├── /guide ................. 使い方ガイド一覧（SSG）
│   └── /guide/[slug] ...... ガイド個別記事（SSG, generateStaticParams）
├── /use-cases/[slug] ...... 用途別QRコード（SSG, generateStaticParams）
├── /industry/[slug] ....... 業種別QRコード活用（SSG, generateStaticParams）
├── /blog .................. ブログ一覧（SSG）
│   ├── /blog/category/[category] .. カテゴリ別一覧（SSG, generateStaticParams）
│   └── /blog/[slug] ....... ブログ個別記事（SSG, generateStaticParams）
├── /compare/[slug] ........ 比較ページ（SSG, generateStaticParams）
├── /faq ................... よくある質問（SSG）
├── /privacy ............... プライバシーポリシー（SSG）
└── /terms ................. 利用規約（SSG）
```

---

## 2. ページ詳細一覧

### 2.1 トップページ（`/`）

| 項目 | 内容 |
|---|---|
| ファイル | `src/app/page.tsx` |
| レンダリング | SSG |
| レイアウト | ルートレイアウト |
| Server/Client | Server Component |

**コンテンツ構成**:
1. HeroSection: キャッチコピー + CTA（「無料でQRコードを作成」→ `/create`）
2. 特徴紹介セクション（FeatureCard x 3）
   - UTMパラメータガイダンス
   - 装飾フレーム
   - 完全無料・登録不要
3. 使い方ステップ（3ステップ図解）
4. 用途別セクション（UseCaseCard）
5. よくある質問（3〜5件抜粋、`/faq` へリンク）
6. CTAセクション（「今すぐQRコードを作成」）

**メタデータ**:
```typescript
export const metadata: Metadata = {
  title: 'QR Code Create | UTMパラメータ付きQRコード無料作成ツール',
  description: 'UTMパラメータのガイダンス付きでQRコードを無料作成。装飾フレーム、ロゴ埋め込み、色カスタマイズも可能。登録不要でPNG/SVG/PDFダウンロード。',
};
```

**JSON-LD**: Organization, WebApplication（簡易版）

---

### 2.2 QRコード生成ページ（`/create`）

| 項目 | 内容 |
|---|---|
| ファイル | `src/app/(tool)/create/page.tsx` |
| レンダリング | SSG（シェル）+ CSR（QR機能） |
| レイアウト | (tool) レイアウト |
| Server/Client | Server Component + Client Component (QrGenerator) |

**コンテンツ構成**:
1. ページタイトル + 簡易説明
2. QrGenerator（dynamic import, ssr: false）
3. 関連ガイドへのコンテキストリンク

**メタデータ**:
```typescript
export const metadata: Metadata = {
  title: 'QRコード作成 | QR Code Create',
  description: 'URLを入力してUTMパラメータ付きQRコードを無料で作成。装飾フレーム、ロゴ、色のカスタマイズが可能。PNG/SVG/PDFでダウンロード。',
};
```

**JSON-LD**: WebApplication, HowTo, BreadcrumbList

---

### 2.3 ガイド一覧ページ（`/guide`）

| 項目 | 内容 |
|---|---|
| ファイル | `src/app/(marketing)/guide/page.tsx` |
| レンダリング | SSG |
| レイアウト | (marketing) レイアウト |
| Server/Client | Server Component |

**コンテンツ構成**:
1. ページタイトル（「使い方ガイド」）
2. ガイド記事カード一覧（MDXフロントマターから生成）
3. CTA（「ガイドを読んだらQRコードを作成してみましょう」→ `/create`）

**ガイド記事（初期）**:

| slug | タイトル | 優先度 |
|---|---|---|
| utm-parameters | UTMパラメータとは？初心者向け完全ガイド | P0 |
| effective-qr-usage | QRコードの効果的な使い方 | P1 |
| design-tips | QRコードデザインのコツ | P1 |
| analytics-measurement | Google Analyticsでの効果測定 | P1 |

---

### 2.4 ガイド個別記事ページ（`/guide/[slug]`）

| 項目 | 内容 |
|---|---|
| ファイル | `src/app/(marketing)/guide/[slug]/page.tsx` |
| レンダリング | SSG (generateStaticParams) |
| レイアウト | (marketing) レイアウト |
| Server/Client | Server Component |

**実装パターン**:

```typescript
import { getContent, getContentSlugs } from '@/lib/content/getContent';
import { MdxContent } from '@/components/marketing/MdxContent/MdxContent';
import { JsonLd } from '@/components/seo/JsonLd/JsonLd';
import { buildArticleSchema } from '@/lib/schema/buildArticleSchema';
import { buildBreadcrumbSchema } from '@/lib/schema/buildBreadcrumbSchema';
import { generatePageMetadata } from '@/lib/metadata/generateMeta';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getContentSlugs('guide');
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { frontmatter } = await getContent('guide', slug);
  return generatePageMetadata({
    title: frontmatter.title,
    description: frontmatter.description,
    path: `/guide/${slug}`,
  });
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const { frontmatter, content } = await getContent('guide', slug);

  return (
    <>
      <JsonLd data={buildBreadcrumbSchema([
        { name: 'ホーム', url: '/' },
        { name: '使い方ガイド', url: '/guide' },
        { name: frontmatter.title, url: `/guide/${slug}` },
      ])} />
      <JsonLd data={buildArticleSchema(frontmatter, `/guide/${slug}`)} />
      <article>
        <h1>{frontmatter.title}</h1>
        <MdxContent source={content} />
      </article>
    </>
  );
}
```

---

### 2.5 用途別QRコードページ（`/use-cases/[slug]`）

| 項目 | 内容 |
|---|---|
| ファイル | `src/app/(marketing)/use-cases/[slug]/page.tsx` |
| レンダリング | SSG (generateStaticParams) |
| レイアウト | (marketing) レイアウト |
| Server/Client | Server Component |

**ページ一覧**（[マーケティング戦略 セクション5](../marketing-strategy.md) 参照）:

| slug | タイトル | utm_source推奨値 | おすすめ装飾 |
|---|---|---|---|
| business-card | 名刺用QRコード | business_card | ビジネス |
| flyer | チラシ・フライヤー用QRコード | flyer | ポップ |
| poster | ポスター用QRコード | poster | エレガント |
| event | イベント用QRコード | event | ポップ |
| store | 店舗用QRコード | store | ビジネス |
| product-package | 製品パッケージ用QRコード | package | エレガント |
| receipt | レシート用QRコード | receipt | ビジネス |
| menu | メニュー用QRコード | menu | エレガント |
| signage | 看板用QRコード | signage | ポップ |

**各ページの構成**:
1. 用途の説明と課題
2. 推奨UTM設定（具体的な設定例）
3. おすすめ装飾スタイル
4. 印刷サイズガイド
5. CTA: 「この設定でQRコードを作成する」→ `/create` にクエリパラメータ付き

**CTAリンクのクエリパラメータ**:

```
/create?utm_source=flyer&utm_medium=qr&preset=pop
```

`/create` ページはクエリパラメータから初期値を設定する（QrGeneratorコンポーネント内で `useSearchParams` を使用）。

---

### 2.6 業種別QRコード活用ページ（`/industry/[slug]`）

| 項目 | 内容 |
|---|---|
| ファイル | `src/app/(marketing)/industry/[slug]/page.tsx` |
| レンダリング | SSG (generateStaticParams) |
| レイアウト | (marketing) レイアウト |
| Server/Client | Server Component |

**ページ一覧**:

| slug | タイトル |
|---|---|
| restaurant | 飲食店のQRコード活用 |
| beauty-salon | 美容室のQRコード活用 |
| real-estate | 不動産のQRコード活用 |
| event-planning | イベント企画のQRコード活用 |
| retail | 小売店のQRコード活用 |
| medical-clinic | 医療クリニックのQRコード活用 |
| education | 教育機関のQRコード活用 |

**各ページの構成**:
1. 業種におけるQRコードの活用メリット
2. 具体的な活用シーン
3. 業種特有のUTM設定例
4. おすすめ装飾スタイル
5. CTA: 「あなたの業種に合ったQRコードを作成する」→ `/create`

---

### 2.7 ブログ一覧ページ（`/blog`）

| 項目 | 内容 |
|---|---|
| ファイル | `src/app/(marketing)/blog/page.tsx` |
| レンダリング | SSG |
| レイアウト | (marketing) レイアウト |
| Server/Client | Server Component |

**コンテンツ構成**:
1. ページタイトル（「ブログ」）
2. カテゴリフィルターリンク
3. 記事カード一覧（新着順、MDXフロントマターから生成）
4. ページネーション（将来対応）

**ブログカテゴリ**:

| category slug | カテゴリ名 |
|---|---|
| qr-marketing | QRコードマーケティング |
| utm-tips | UTM活用術 |
| case-studies | 事例紹介 |

---

### 2.8 ブログカテゴリ別一覧ページ（`/blog/category/[category]`）

| 項目 | 内容 |
|---|---|
| ファイル | `src/app/(marketing)/blog/category/[category]/page.tsx` |
| レンダリング | SSG (generateStaticParams) |
| レイアウト | (marketing) レイアウト |
| Server/Client | Server Component |

カテゴリに属する記事のみをフィルタリングして一覧表示する。

---

### 2.9 ブログ個別記事ページ（`/blog/[slug]`）

| 項目 | 内容 |
|---|---|
| ファイル | `src/app/(marketing)/blog/[slug]/page.tsx` |
| レンダリング | SSG (generateStaticParams) |
| レイアウト | (marketing) レイアウト |
| Server/Client | Server Component |

**JSON-LD**: BlogPosting, BreadcrumbList

---

### 2.10 比較ページ（`/compare/[slug]`）

| 項目 | 内容 |
|---|---|
| ファイル | `src/app/(marketing)/compare/[slug]/page.tsx` |
| レンダリング | SSG (generateStaticParams) |
| レイアウト | (marketing) レイアウト |
| Server/Client | Server Component |

**ページ一覧**:

| slug | タイトル |
|---|---|
| other-tools | 他のQRコード作成ツールとの比較 |
| qr-no-susume | QRのススメとの違い |

---

### 2.11 FAQページ（`/faq`）

| 項目 | 内容 |
|---|---|
| ファイル | `src/app/(marketing)/faq/page.tsx` |
| レンダリング | SSG |
| レイアウト | (marketing) レイアウト |
| Server/Client | Server Component |

**JSON-LD**: FAQPage, BreadcrumbList

FAQ データは `src/content/` 配下のMDXではなく、ページ内に直接定義する（構造化データと連動させるため）。

```typescript
const FAQ_ITEMS = [
  {
    question: 'QRコードの作成に料金はかかりますか？',
    answer: 'いいえ、QR Code Createは完全無料でご利用いただけます。...',
  },
  {
    question: 'UTMパラメータとは何ですか？',
    answer: 'UTMパラメータは、URLに追加するトラッキング用のパラメータです。...',
  },
  // ...
] as const;
```

---

### 2.12 プライバシーポリシー（`/privacy`）・利用規約（`/terms`）

| 項目 | 内容 |
|---|---|
| ファイル | `src/app/(marketing)/privacy/page.tsx`, `src/app/(marketing)/terms/page.tsx` |
| レンダリング | SSG |
| レイアウト | (marketing) レイアウト |
| Server/Client | Server Component |

静的な法的テキストページ。

---

## 3. レイアウト構造

### 3.1 ルートレイアウト（`src/app/layout.tsx`）

全ページ共通のレイアウト。

```typescript
import { Noto_Sans_JP } from 'next/font/google';
import Script from 'next/script';
import { Header } from '@/components/layout/Header/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { JsonLd } from '@/components/seo/JsonLd/JsonLd';
import { buildOrganizationSchema } from '@/lib/schema/buildOrganizationSchema';
import './globals.css';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={notoSansJP.className}>
      <head>
        <JsonLd data={buildOrganizationSchema()} />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        {/* GA4 */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
```

### 3.2 (marketing) レイアウト（`src/app/(marketing)/layout.tsx`）

マーケティング系ページ共通のレイアウト。

```typescript
import { Container } from '@/components/layout/Container/Container';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container size="narrow">
      {children}
    </Container>
  );
}
```

**特徴**:
- narrowコンテナ（max-width: 800px）で記事の可読性を確保
- パンくずリストは各ページ側で設置（slugに応じた動的生成のため）

### 3.3 (tool) レイアウト（`src/app/(tool)/layout.tsx`）

ツール系ページ共通のレイアウト。

```typescript
import { Container } from '@/components/layout/Container/Container';

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container size="wide">
      {children}
    </Container>
  );
}
```

**特徴**:
- wideコンテナ（max-width: 1440px）でツール画面を広く使う
- 2カラムレイアウト対応

---

## 4. 内部リンク戦略

[マーケティング戦略 セクション3](../marketing-strategy.md) のハブ&スポークモデルに基づく。

### 4.1 リンクルール

| リンク元 | リンク先 | リンク形式 |
|---|---|---|
| 全スポークページ | ハブページ（/guide, /use-cases等） | パンくずリスト + 本文内リンク |
| 全コンテンツページ | /create | CTAボタン（「QRコードを作成する」） |
| ガイドページ | 関連する用途別ページ | 本文内クロスリンク |
| 用途別ページ | 関連するガイドページ | 「関連ガイド」セクション |
| ブログ記事 | 関連ガイド・用途別ページ | 本文内リンク |
| /create | 関連ガイドページ | コンテキストヘルプリンク |

### 4.2 用途別ページから /create へのパラメータ渡し

```typescript
// 用途別ページでのCTAリンク
<CtaButton
  text="この設定でQRコードを作成する"
  href="/create"
  utmParams={{
    utm_source: frontmatter.recommendedSource,
    utm_medium: 'qr',
  }}
/>

// CtaButton コンポーネント内でクエリパラメータを構築
const url = new URL('/create', BASE_URL);
if (utmParams) {
  Object.entries(utmParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
}
```

---

## 5. サイトマップ生成

```typescript
// src/app/sitemap.ts
import type { MetadataRoute } from 'next';
import { getContentSlugs } from '@/lib/content/getSlugs';

const BASE_URL = 'https://qr-code-create.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const guideSlugs = await getContentSlugs('guide');
  const useCaseSlugs = await getContentSlugs('use-cases');
  const industrySlugs = await getContentSlugs('industry');
  const blogSlugs = await getContentSlugs('blog');
  const compareSlugs = await getContentSlugs('compare');

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/create`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/guide`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  const guidePages = guideSlugs.map((slug) => ({
    url: `${BASE_URL}/guide/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const useCasePages = useCaseSlugs.map((slug) => ({
    url: `${BASE_URL}/use-cases/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const industryPages = industrySlugs.map((slug) => ({
    url: `${BASE_URL}/industry/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const blogPages = blogSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const comparePages = compareSlugs.map((slug) => ({
    url: `${BASE_URL}/compare/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...guidePages,
    ...useCasePages,
    ...industryPages,
    ...blogPages,
    ...comparePages,
  ];
}
```

---

## 6. robots.txt 生成

```typescript
// src/app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
      },
    ],
    sitemap: 'https://qr-code-create.vercel.app/sitemap.xml',
  };
}
```

---

## 7. 404ページ

```typescript
// src/app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div>
      <h1>ページが見つかりません</h1>
      <p>お探しのページは存在しないか、移動された可能性があります。</p>
      <Link href="/">トップページへ戻る</Link>
      <Link href="/create">QRコードを作成する</Link>
    </div>
  );
}
```
