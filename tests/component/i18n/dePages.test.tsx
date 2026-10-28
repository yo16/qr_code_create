import React from "react";
import { render, screen } from "@testing-library/react";
import LocaleHomePage from "@/app/[locale]/page";
import LocaleCreatePage from "@/app/[locale]/(tool)/create/page";
import GuidePage from "@/app/[locale]/(marketing)/guide/[slug]/page";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getClientMessages, getDict } from "@/i18n/getDict";
import { getGuide } from "@/lib/content/getGuide";

/**
 * de のトップ・作成・ガイドの描画（qr_code_create-38x.8）。
 * 辞書の de の値が出て、内部リンクが /de/... で、en の見出しが出ないことを確かめる。
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

jest.mock("@/components/pages/CreatePageView/QrGeneratorLoader", () => ({
  QrGeneratorLoader: () => <div data-testid="qr-generator-loader" />,
}));

const JAPANESE = /[぀-ヿ一-鿿]/;
const de = getDict("de");
const en = getDict("en");

function renderDe(jsx: React.ReactElement) {
  return render(
    <I18nProvider locale="de" messages={getClientMessages("de")}>
      {jsx}
    </I18nProvider>
  );
}

function hrefs(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("a"), (a) => a.getAttribute("href") ?? "");
}

describe("de のトップページ", () => {
  it("h1 が de 辞書の見出しで、en の見出しではない", async () => {
    const jsx = await LocaleHomePage({ params: Promise.resolve({ locale: "de" }) });
    const { container } = renderDe(jsx);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(de.home.hero.headingLine1.trim());
    expect(h1).toHaveTextContent(de.home.hero.headingLine2.trim());
    expect(container.textContent).not.toContain(en.home.hero.headingLine2.trim());
    expect(container.textContent).not.toContain(en.home.hero.description);
  });

  it("主要な文言が de の値で、内部リンクが /de/... になる", async () => {
    const jsx = await LocaleHomePage({ params: Promise.resolve({ locale: "de" }) });
    const { container } = renderDe(jsx);
    expect(container.textContent).not.toMatch(JAPANESE);
    expect(container.textContent).toContain(de.home.hero.description);
    expect(container.textContent).toContain(de.home.features.heading);
    const links = hrefs(container);
    expect(links).toContain("/de/create");
    expect(links).toContain("/de/guide/getting-started");
    const internal = links.filter((h) => h.startsWith("/"));
    expect(internal.length).toBeGreaterThan(0);
    for (const h of internal) expect(h).toMatch(/^\/de(\/|$)/);
  });
});

describe("de の作成ページ", () => {
  it("h1 が de 辞書の pageHeading で、en の見出しではない", async () => {
    const jsx = await LocaleCreatePage({ params: Promise.resolve({ locale: "de" }) });
    renderDe(jsx);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(de.tool.pageHeading);
    expect(h1).not.toHaveTextContent(en.tool.pageHeading);
    expect(screen.getByTestId("qr-generator-loader")).toBeInTheDocument();
  });
});

describe("de のガイド getting-started", () => {
  it("h1 が de ガイドの title で、パンくずが /de を指し、英語の見出しが出ない", async () => {
    const jsx = await GuidePage({ params: Promise.resolve({ locale: "de", slug: "getting-started" }) });
    const { container } = renderDe(jsx);
    const guide = getGuide("getting-started", "de")!;
    const enGuide = getGuide("getting-started", "en")!;
    expect(guide.title).not.toBe(enGuide.title);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(guide.title);
    const homeLink = screen.getAllByRole("link", { name: de.guide.breadcrumb.home })[0];
    expect(homeLink).toHaveAttribute("href", "/de");
    expect(homeLink.closest("nav")).not.toBeNull();
    expect(container.textContent).not.toMatch(JAPANESE);
    expect(container.textContent).not.toContain(enGuide.title);
    for (const h of hrefs(container).filter((x) => x.startsWith("/"))) {
      expect(h).toMatch(/^\/de(\/|$)/);
    }
  });

  it("異常系: de に無い slug は notFound", async () => {
    await expect(
      GuidePage({ params: Promise.resolve({ locale: "de", slug: "nonexistent-slug" }) })
    ).rejects.toThrow("notFound called");
  });
});
