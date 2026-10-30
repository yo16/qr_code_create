import React from "react";
import { render, screen, within } from "@testing-library/react";
import { GuideArticlePageView } from "@/components/pages/GuideArticlePageView/GuideArticlePageView";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getClientMessages } from "@/i18n/getDict";
import { getGuide } from "@/lib/content/getGuide";
import type { Locale } from "@/i18n/types";
import type { GuideContent } from "@/types/content";

/**
 * GuideArticlePageView（ja / en 共通のガイド記事本体、qr_code_create-01z.5）。
 * en: パンくず Home（/en）› 記事の 2 段、URL は /en/guide/...、CTA は /en/create。
 * ja: 抽出前の page.tsx と同じ出力（値は HEAD の page.tsx から直書き）。
 */

// MDXRemote は async RSC なので、source をそのまま出すモックにする（guidePage.test.tsx と同じ）
jest.mock("next-mdx-remote/rsc", () => ({
  MDXRemote: ({ source }: { source: string }) => <div data-testid="mdx-content">{source}</div>,
}));

jest.mock("next/link", () => {
  const MockLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

jest.mock("@/lib/analytics/events", () => ({
  trackCtaClicked: jest.fn(),
}));

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";
const JAPANESE = /[぀-ゟ゠-ヿ一-鿿]/;
const SLUG = "getting-started";

const renderView = (locale: Locale) => {
  const guide = getGuide(SLUG, locale)!;
  const utils = render(
    <I18nProvider locale={locale} messages={getClientMessages(locale)}>
      <GuideArticlePageView locale={locale} slug={SLUG} guide={guide} />
    </I18nProvider>
  );
  return { ...utils, guide };
};

const readJsonLd = (): Record<string, unknown>[] =>
  Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
    (el) => JSON.parse(el.textContent ?? "") as Record<string, unknown>
  );
const byType = (type: string) => readJsonLd().filter((d) => d["@type"] === type);

describe("GuideArticlePageView locale=en", () => {
  // 意図: パンくずは Home（/en）› 記事タイトルの 2 段で、/guide 一覧へのリンクが無い
  it("パンくずが Home（/en）› タイトルの 2 段", () => {
    const { guide } = renderView("en");
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const items = within(nav).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(nav).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/en");
    expect(items[1].textContent).toContain(guide.title);
    expect(within(nav).getAllByRole("link")).toHaveLength(1);
  });

  // 意図: h1 が英語のタイトル
  it("h1 が英語のガイドタイトル", () => {
    const { guide } = renderView("en");
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(guide.title);
    expect(h1.textContent).toContain("Getting started");
  });

  // 意図: BreadcrumbList の JSON-LD もパンくずと同じ 2 段で /en を指す
  it("BreadcrumbList が Home（/en）› 記事（/en/guide/getting-started）の 2 段", () => {
    const { guide } = renderView("en");
    const [crumb] = byType("BreadcrumbList");
    expect(crumb.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en` },
      { "@type": "ListItem", position: 2, name: guide.title, item: `${SITE_URL}/en/guide/${SLUG}` },
    ]);
  });

  // 意図: BlogPosting の URL が /en/guide/... で inLanguage が en
  it("BlogPosting の @id が /en/guide/getting-started、inLanguage が en", () => {
    const { guide } = renderView("en");
    const [blog] = byType("BlogPosting") as Array<{
      headline: string;
      inLanguage: string;
      mainEntityOfPage: { "@id": string };
    }>;
    expect(blog.headline).toBe(guide.title);
    expect(blog.inLanguage).toBe("en");
    expect(blog.mainEntityOfPage["@id"]).toBe(`${SITE_URL}/en/guide/${SLUG}`);
  });

  // 意図: HowTo の各ステップ url が /en/guide/<slug>#step-n で、名前と手順が英語
  it("HowTo の step url が /en/guide/getting-started#step-n", () => {
    const { guide } = renderView("en");
    const howtos = byType("HowTo") as Array<{ name: string; step: Array<{ name: string; url: string }> }>;
    expect(howtos).toHaveLength(1);
    expect(howtos[0].name).toBe(guide.title);
    expect(howtos[0].step).toHaveLength(guide.howto!.length);
    howtos[0].step.forEach((step, i) => {
      expect(step.url).toBe(`${SITE_URL}/en/guide/${SLUG}#step-${i + 1}`);
      expect(step.name).toBe(guide.howto![i].name);
    });
  });

  // 意図: JSON-LD は BlogPosting / BreadcrumbList / HowTo の 3 件で、ja の URL や日本語が入らない
  it("JSON-LD に /guide/（/en なし）の URL と日本語が無い", () => {
    renderView("en");
    const all = readJsonLd();
    expect(all).toHaveLength(3);
    const text = JSON.stringify(all);
    expect(text).not.toMatch(JAPANESE);
    // /en 始まりのほか、言語に依らない組織の @id・サイトのルート URL・OG 画像（BlogPosting の author / image）は許す
    const allowed = /^(\/en(\/|"|#)|\/#organization|\/images\/og\/default\.png|")/;
    expect(text.split(SITE_URL).slice(1).filter((rest) => !allowed.test(rest))).toEqual([]);
  });

  // 意図: 本文の後の CTA が英語版ツール /en/create を指す
  it("ArticleCta が本文の後にあり /en/create を指す", () => {
    renderView("en");
    const content = screen.getByTestId("mdx-content");
    const cta = screen.getByRole("link", { name: "Create a QR code" });
    expect(cta).toHaveAttribute("href", "/en/create");
    expect(content.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // 意図: 画面と属性値に日本語が出ない、ja ページへのリンクが無い
  it("描画結果に日本語が無く、内部リンクはすべて /en 始まり", () => {
    const { container } = renderView("en");
    const html = container.innerHTML.replace(/<script[\s\S]*?<\/script>/g, "");
    expect(html).not.toMatch(JAPANESE);
    const hrefs = Array.from(container.querySelectorAll("a"), (a) => a.getAttribute("href") ?? "");
    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs.filter((h) => h.startsWith("/") && !/^\/en(\/|$)/.test(h))).toEqual([]);
  });
});

describe("GuideArticlePageView locale=ja（抽出前の page.tsx と同じ出力）", () => {
  // 意図: パンくずは従来どおり ホーム（/）› 使い方ガイド（/guide）› 記事の 3 段
  it("パンくずが ホーム › 使い方ガイド › タイトルの 3 段", () => {
    const { guide } = renderView("ja");
    const nav = screen.getByRole("navigation", { name: "パンくずリスト" });
    const items = within(nav).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(within(nav).getByRole("link", { name: "ホーム" })).toHaveAttribute("href", "/");
    expect(within(nav).getByRole("link", { name: "使い方ガイド" })).toHaveAttribute("href", "/guide");
    expect(items[2].textContent).toContain(guide.title);
  });

  it("h1 が日本語のガイドタイトル", () => {
    renderView("ja");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("はじめてのQRコード作成ガイド");
  });

  // 意図: BreadcrumbList の JSON-LD が旧値と同じ
  it("BreadcrumbList が旧値（ホーム / 使い方ガイド / 記事、URL は /, /guide, /guide/slug）と同じ", () => {
    renderView("ja");
    const [crumb] = byType("BreadcrumbList");
    expect(crumb).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "使い方ガイド", item: `${SITE_URL}/guide` },
        {
          "@type": "ListItem",
          position: 3,
          name: "はじめてのQRコード作成ガイド",
          item: `${SITE_URL}/guide/getting-started`,
        },
      ],
    });
  });

  // 意図: BlogPosting が旧値（/guide/slug、inLanguage "ja"）と同じ
  it("BlogPosting の @id が /guide/getting-started、inLanguage が ja", () => {
    const { guide } = renderView("ja");
    const [blog] = byType("BlogPosting");
    expect(blog).toEqual({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: guide.title,
      description: guide.description,
      image: `${SITE_URL}/images/og/default.png`,
      author: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "QR Code Create", url: SITE_URL },
      publisher: { "@type": "Organization", name: "QR Code Create" },
      datePublished: "2026-04-17",
      dateModified: "2026-04-17",
      mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/guide/getting-started` },
      inLanguage: "ja",
    });
  });

  // 意図: HowTo の step url が旧値 /guide/slug#step-n
  it("HowTo の step url が /guide/getting-started#step-n（/en なし）", () => {
    renderView("ja");
    const [howto] = byType("HowTo") as Array<{ step: Array<{ url: string }> }>;
    expect(howto.step.map((s) => s.url)).toEqual([
      `${SITE_URL}/guide/getting-started#step-1`,
      `${SITE_URL}/guide/getting-started#step-2`,
      `${SITE_URL}/guide/getting-started#step-3`,
    ]);
  });

  // 意図: CTA は従来どおり /create、/en 始まりのリンクが無い
  it("ArticleCta が /create を指し、/en 始まりのリンクが無い", () => {
    const { container } = renderView("ja");
    expect(screen.getByRole("link", { name: "QRコードを作成する" })).toHaveAttribute("href", "/create");
    const hrefs = Array.from(container.querySelectorAll("a"), (a) => a.getAttribute("href") ?? "");
    expect(hrefs.filter((h) => h.startsWith("/en"))).toEqual([]);
  });
});

describe("GuideArticlePageView howto なしのガイド", () => {
  // 意図: howto の無い ja ガイドでは HowTo を出さない（BlogPosting と BreadcrumbList の 2 件）
  it("utm-parameters では HowTo が無い", () => {
    const guide = getGuide("utm-parameters")!;
    render(<GuideArticlePageView locale="ja" slug="utm-parameters" guide={guide} />);
    const types = readJsonLd().map((d) => d["@type"]);
    expect(types.sort()).toEqual(["BlogPosting", "BreadcrumbList"]);
  });

  // 意図: 将来 howto の無い英語ガイドが入っても HowTo を出さない。
  // 現状の en ガイドはすべて howto ありなので、getting-started を元に howto を
  // undefined / [] に差し替えた合成 GuideContent で確かめる
  it.each([
    ["undefined", undefined],
    ["[]", []],
  ])("en で howto が %s のとき BlogPosting と BreadcrumbList の 2 件", (_label, howto) => {
    const base = getGuide(SLUG, "en")!;
    const guide: GuideContent = { ...base, howto };
    render(
      <I18nProvider locale="en" messages={getClientMessages("en")}>
        <GuideArticlePageView locale="en" slug={SLUG} guide={guide} />
      </I18nProvider>
    );
    const types = readJsonLd().map((d) => d["@type"]);
    expect(types.sort()).toEqual(["BlogPosting", "BreadcrumbList"]);
  });
});
