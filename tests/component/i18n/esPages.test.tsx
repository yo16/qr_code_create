import React from "react";
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import LocaleHomePage from "@/app/[locale]/page";
import LocaleCreatePage from "@/app/[locale]/(tool)/create/page";
import GuidePage from "@/app/[locale]/(marketing)/guide/[slug]/page";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getClientMessages } from "@/i18n/getDict";
import { en } from "@/i18n/en";
import { es } from "@/i18n/es";
import { getGuide } from "@/lib/content/getGuide";

/**
 * es のトップ・作成・ガイドの描画（qr_code_create-38x.6）。
 * es 辞書の値が出ること、内部リンクが /es 始まりであること、英語の見出しが出ないことを確認する。
 */

jest.mock("next-mdx-remote/rsc", () => ({
  MDXRemote: ({ source }: { source: string }) => <div data-testid="mdx-content">{source}</div>,
}));

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("notFound called");
  }),
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

// 生成ツール本体は dynamic import と useSearchParams を使うのでモックする
jest.mock("@/components/pages/CreatePageView/QrGeneratorLoader", () => ({
  QrGeneratorLoader: () => <div data-testid="qr-generator-loader" />,
}));

const JAPANESE = /[぀-ゟ゠-ヿ一-鿿]/;
const params = <T extends Record<string, string> = Record<string, never>>(extra?: T) => Promise.resolve({ locale: "es", ...(extra as T) });
const hrefsOf = (html: string) => Array.from(html.matchAll(/href="([^"]*)"/g), (m) => m[1]);
const decode = (s: string) => s.replace(/&#x([0-9a-f]+);/gi, (_m, h: string) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_m, d: string) => String.fromCodePoint(Number(d))).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&amp;/g, "&");
const textOf = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, "");

describe("es のトップページ", () => {
  it("h1 が es 辞書の見出しで、英語の見出しではない", async () => {
    const html = renderToStaticMarkup(await LocaleHomePage({ params: params() }));
    const h1 = decode((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "").replace(/<[^>]+>/g, ""));
    expect(h1).toContain(es.home.hero.headingLine1.trim());
    expect(h1).toContain(es.home.hero.headingLine2.trim());
    expect(h1).not.toContain(en.home.hero.headingLine2.trim());
  });

  it("主要な文言（CTA・特長の見出し）が es 辞書の値で、en の値は出ない", async () => {
    const html = renderToStaticMarkup(await LocaleHomePage({ params: params() }));
    const text = textOf(html);
    expect(text).toContain(es.home.hero.primaryCta);
    expect(text).toContain(es.home.features.heading);
    expect(text).not.toContain(en.home.hero.primaryCta);
    expect(text).not.toContain(en.home.features.heading);
  });

  it("内部リンクが /es 始まりで、/create や /en を指さない", async () => {
    const html = renderToStaticMarkup(await LocaleHomePage({ params: params() }));
    const hrefs = hrefsOf(html);
    expect(hrefs).toContain("/es/create");
    expect(hrefs).toContain("/es/guide/getting-started");
    expect(hrefs).not.toContain("/create");
    expect(hrefs.filter((h) => h.startsWith("/en"))).toEqual([]);
  });

  it("本文に日本語が含まれない", async () => {
    const html = renderToStaticMarkup(await LocaleHomePage({ params: params() }));
    expect(textOf(html)).not.toMatch(JAPANESE);
  });
});

describe("es の作成ページ", () => {
  it("h1 が es 辞書の pageHeading で、en の見出しではない", async () => {
    const html = renderToStaticMarkup(await LocaleCreatePage({ params: params() }));
    const h1Raw = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1];
    const h1 = h1Raw === undefined ? undefined : decode(h1Raw);
    expect(h1).toBe(es.tool.pageHeading);
    expect(h1).not.toBe(en.tool.pageHeading);
    expect(html).toContain('data-testid="qr-generator-loader"');
  });
});

describe("es のガイド getting-started", () => {
  const renderGuide = async () => {
    const jsx = await GuidePage({ params: params({ slug: "getting-started" }) });
    return render(
      <I18nProvider locale="es" messages={getClientMessages("es")}>
        {jsx}
      </I18nProvider>
    );
  };

  it("h1 が es のガイドタイトルで、英語の Getting started ではない", async () => {
    await renderGuide();
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(getGuide("getting-started", "es")!.title);
    expect(h1.textContent).not.toContain("Getting started");
  });

  it("パンくずが es 辞書のラベルで /es を指す", async () => {
    await renderGuide();
    const nav = screen.getByRole("navigation", { name: es.guide.breadcrumb.ariaLabel });
    const home = screen.getAllByRole("link", { name: es.guide.breadcrumb.home })[0];
    expect(nav).toContainElement(home);
    expect(home).toHaveAttribute("href", "/es");
  });

  it("描画された <a> の内部リンク（MDX 本文はモックで素通しなので、主にパンくずと CTA）が /es 始まり", async () => {
    const { container } = await renderGuide();
    const internal = Array.from(container.querySelectorAll("a"))
      .map((a) => a.getAttribute("href") ?? "")
      .filter((h) => h.startsWith("/"));
    expect(internal.length).toBeGreaterThan(0);
    expect(internal.filter((h) => !h.startsWith("/es"))).toEqual([]);
  });

  it("日本語が出ない", async () => {
    const { container } = await renderGuide();
    expect(container.textContent ?? "").not.toMatch(JAPANESE);
  });

  it("存在しない slug では notFound になる（異常系）", async () => {
    await expect(GuidePage({ params: params({ slug: "nonexistent-slug" }) })).rejects.toThrow("notFound called");
  });
});
