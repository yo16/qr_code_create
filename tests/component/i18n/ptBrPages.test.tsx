import React from "react";
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import GuidePage from "@/app/[locale]/(marketing)/guide/[slug]/page";
import LocaleHomePage from "@/app/[locale]/page";
import LocaleCreatePage from "@/app/[locale]/(tool)/create/page";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getClientMessages } from "@/i18n/getDict";
import { en } from "@/i18n/en";
import { ptBr } from "@/i18n/ptBr";
import { getGuide } from "@/lib/content/getGuide";

/**
 * pt-br のトップ・作成・ガイドの描画（qr_code_create-38x.7）。
 * 見出しが pt-br 辞書の値で、内部リンクが /pt-br 始まり、英語の見出しが出ていないことを確かめる。
 */

jest.mock("@/components/pages/CreatePageView/QrGeneratorLoader", () => ({
  QrGeneratorLoader: () => <div data-testid="qr-generator-loader" />,
}));

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

const JAPANESE = /[぀-ゟ゠-ヿ一-鿿]/;

const h1Of = (html: string) => {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  return m ? m[1].replace(/<[^>]+>/g, "") : "";
};
const hrefsOf = (html: string) => Array.from(html.matchAll(/href="([^"]*)"/g), (m) => m[1]);
/** 内部ページへのリンク（/hero-qr.svg のような静的アセットは除く） */
const isInternal = (h: string) => h.startsWith("/") && !/\.\w{2,4}$/.test(h);
const decode = (s: string) => s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

describe("pt-br トップページ", () => {
  let html = "";
  beforeAll(async () => {
    html = renderToStaticMarkup(await LocaleHomePage({ params: Promise.resolve({ locale: "pt-br" }) }));
  });

  it.each([
    ["home.hero.primaryCta", () => ptBr.home.hero.primaryCta, () => en.home.hero.primaryCta],
    ["home.features.heading", () => ptBr.home.features.heading, () => en.home.features.heading],
    ["home.hero.description", () => ptBr.home.hero.description, () => en.home.hero.description],
  ])("%s が pt-br の値で出て、en の値は出ない", (_key, pt, enValue) => {
    const text = decode(html);
    expect(pt().trim()).not.toBe("");
    expect(pt()).not.toBe(enValue());
    expect(text).toContain(pt().trim());
    expect(text).not.toContain(enValue().trim());
  });

  it("/pt-br/guide/getting-started へのリンクがある", () => {
    expect(hrefsOf(html)).toContain("/pt-br/guide/getting-started");
  });

  it("h1 が pt-br 辞書の見出しで、en の見出しではない", () => {
    const h1 = decode(h1Of(html));
    expect(h1).toContain(ptBr.home.hero.headingLine1.trim());
    expect(h1).toContain(ptBr.home.hero.headingLine2.trim());
    expect(h1).not.toContain(en.home.hero.headingLine1.trim());
    expect(h1).not.toContain(en.home.hero.headingLine2.trim());
  });

  it("内部リンクが /pt-br 始まりで、/create や /en を指さない", () => {
    const internal = hrefsOf(html).filter(isInternal);
    expect(internal).toContain("/pt-br/create");
    expect(internal.filter((h) => h !== "/pt-br" && !h.startsWith("/pt-br/"))).toEqual([]);
    expect(internal).not.toContain("/create");
  });

  it("本文（JSON-LD 以外）に日本語が無い", () => {
    expect(html.replace(/<script[\s\S]*?<\/script>/g, "")).not.toMatch(JAPANESE);
  });
});

describe("pt-br 作成ページ", () => {
  it("h1 が pt-br 辞書の tool.pageHeading で、en の値ではない", async () => {
    const html = renderToStaticMarkup(await LocaleCreatePage({ params: Promise.resolve({ locale: "pt-br" }) }));
    expect(decode(h1Of(html))).toBe(ptBr.tool.pageHeading);
    expect(decode(h1Of(html))).not.toBe(en.tool.pageHeading);
    expect(html).toContain('data-testid="qr-generator-loader"');
  });
});

describe("pt-br ガイド getting-started", () => {
  it("h1 が pt-br のガイドの title で、パンくずが /pt-br を指す", async () => {
    const guide = getGuide("getting-started", "pt-br");
    expect(guide).not.toBeNull();
    const jsx = await GuidePage({ params: Promise.resolve({ locale: "pt-br", slug: "getting-started" }) });
    render(
      <I18nProvider locale="pt-br" messages={getClientMessages("pt-br")}>
        {jsx}
      </I18nProvider>
    );
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(guide!.title);
    expect(h1).not.toHaveTextContent(getGuide("getting-started", "en")!.title);
    const internal = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href") ?? "")
      .filter(isInternal);
    expect(screen.getByTestId("mdx-content").textContent ?? "").not.toMatch(JAPANESE);
    expect(document.body.textContent ?? "").not.toMatch(JAPANESE);
    expect(internal).toContain("/pt-br");
    expect(internal.filter((h) => h !== "/pt-br" && !h.startsWith("/pt-br/"))).toEqual([]);
  });

  it("存在しない slug では notFound が呼ばれる", async () => {
    await expect(
      GuidePage({ params: Promise.resolve({ locale: "pt-br", slug: "nonexistent-slug" }) })
    ).rejects.toThrow("notFound called");
  });
});
