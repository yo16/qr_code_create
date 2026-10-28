import React from "react";
import { render, screen } from "@testing-library/react";
import EnGuidePage, {
  dynamicParams,
  generateStaticParams,
  generateMetadata,
} from "@/app/[locale]/(marketing)/guide/[slug]/page";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getClientMessages } from "@/i18n/getDict";
import { getGuide, getGuideSlugList } from "@/lib/content/getGuide";

/**
 * 英語ガイドのページ（src/app/[locale]/(marketing)/guide/[slug]/page.tsx、qr_code_create-01z.5）。
 * 英語の MDX がある slug だけを静的生成し、それ以外は 404（dynamicParams = false）。
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

const { notFound } = jest.requireMock("next/navigation") as { notFound: jest.Mock };
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

describe("en ガイドページの静的生成", () => {
  // 意図: 英語の無い slug を動的に描画させない
  it("dynamicParams が false", () => {
    expect(dynamicParams).toBe(false);
  });

  // 意図: generateStaticParams は en の slug だけ（ja にしか無い utm-setup などを含まない）
  it("generateStaticParams は getGuideSlugList(\"en\") と同じで ja だけの slug を含まない", async () => {
    const params = await generateStaticParams({ params: { locale: "en" } });
    expect(params).toEqual(getGuideSlugList("en").map((slug) => ({ slug })));
    expect(params).toEqual([{ slug: "getting-started" }]);
    const slugs = params.map((p) => p.slug);
    for (const jaOnly of ["utm-setup", "utm-parameters", "design-tips"]) {
      expect(slugs).not.toContain(jaOnly);
    }
  });
});

describe("en ガイドページの generateMetadata", () => {
  // 意図: canonical / og:url が /en/guide/getting-started、og:locale が en_US、英語のタイトル
  it("getting-started で英語の title、canonical が /en/guide/getting-started、og locale en_US", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: "en", slug: "getting-started" }) });
    const guide = getGuide("getting-started", "en")!;
    expect(metadata.title).toBe(guide.title);
    expect(metadata.description).toBe(guide.description);
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/en/guide/getting-started`);
    const og = metadata.openGraph as { url?: string; locale?: string };
    expect(og.url).toBe(`${SITE_URL}/en/guide/getting-started`);
    expect(og.locale).toBe("en_US");
    expect(metadata.robots).toBeUndefined();
  });

  // 意図: en に無い slug / 存在しない slug では空 metadata
  it.each(["utm-setup", "nonexistent-slug"])("%s では空オブジェクト", async (slug) => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: "en", slug }) });
    expect(metadata).toEqual({});
  });
});

describe("en ガイドページの描画", () => {
  beforeEach(() => {
    notFound.mockClear();
  });

  // 意図: getting-started が英語で描画される（中身は GuideArticlePageView locale=en）
  it("getting-started で英語の h1 と /en のパンくずが出る", async () => {
    const jsx = await EnGuidePage({ params: Promise.resolve({ locale: "en", slug: "getting-started" }) });
    render(
      <I18nProvider locale="en" messages={getClientMessages("en")}>
        {jsx}
      </I18nProvider>
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      getGuide("getting-started", "en")!.title
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/en");
    expect(notFound).not.toHaveBeenCalled();
  });

  // 意図: en に無い slug / 存在しない slug は notFound
  it.each(["utm-setup", "nonexistent-slug"])("%s では notFound が呼ばれる", async (slug) => {
    await expect(EnGuidePage({ params: Promise.resolve({ locale: "en", slug }) })).rejects.toThrow("notFound called");
    expect(notFound).toHaveBeenCalled();
  });

  // 意図: /ja/guide/... は [locale] で受けず 404（ja は (ja) 側のルート）
  it("locale=ja では default が notFound を呼ぶ", async () => {
    await expect(
      EnGuidePage({ params: Promise.resolve({ locale: "ja", slug: "getting-started" }) })
    ).rejects.toThrow("notFound called");
    expect(notFound).toHaveBeenCalled();
  });

  it("locale=ja では generateMetadata が notFound を呼ぶ", async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ locale: "ja", slug: "getting-started" }) })
    ).rejects.toThrow("notFound called");
    expect(notFound).toHaveBeenCalled();
  });
});
