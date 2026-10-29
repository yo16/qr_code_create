import React from "react";
import { render } from "@testing-library/react";
import GuidePage from "@/app/(ja)/(marketing)/guide/[slug]/page";
import UseCasePage from "@/app/(ja)/(marketing)/use-cases/[slug]/page";
import BlogPage from "@/app/(ja)/(marketing)/blog/[slug]/page";
import LocaleGuidePage from "@/app/[locale]/(marketing)/guide/[slug]/page";
import { buildBlogPostingSchema } from "@/lib/schema/buildJsonLd";
import { DEFAULT_OG_IMAGE_PATH } from "@/lib/seo/ogImage";
import { getUseCase, getUseCaseSlugList } from "@/lib/content/getUseCase";
import { getBlog, getBlogSlugList } from "@/lib/content/getBlog";

jest.mock("next-mdx-remote/rsc", () => ({ MDXRemote: () => null }));
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("notFound called");
  }),
}));
jest.mock("next/link", () => {
  const MockLink = ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>;
  MockLink.displayName = "MockLink";
  return MockLink;
});
jest.mock("@/lib/analytics/events", () => ({ trackCtaClicked: jest.fn() }));
jest.mock("@/components/seo/JsonLd", () => ({
  JsonLd: ({ data }: { data: unknown }) => <script type="application/ld+json" data-testid="jsonld">{JSON.stringify(data)}</script>,
}));

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

interface BlogPosting {
  "@type": string;
  image?: string;
  dateModified?: string;
  datePublished?: string;
  author?: { "@id"?: string; url?: string; "@type"?: string };
}

function blogPostingOf(container: HTMLElement): BlogPosting {
  const nodes = Array.from(container.querySelectorAll('script[type="application/ld+json"]')).map(
    (s) => JSON.parse(s.textContent ?? "") as BlogPosting
  );
  const posting = nodes.find((n) => n["@type"] === "BlogPosting");
  if (!posting) throw new Error("BlogPosting が見つかりません");
  return posting;
}

describe("buildBlogPostingSchema", () => {
  const post = { title: "t", description: "d", slug: "s", datePublished: "2026-04-17" };

  it("image が既定 OG 画像の絶対 URL であること", () => {
    expect(buildBlogPostingSchema(post).image).toBe(`${SITE_URL}${DEFAULT_OG_IMAGE_PATH}`);
  });

  it("author の @id が組織の @id で、url が SITE_URL であること", () => {
    expect(buildBlogPostingSchema(post).author).toMatchObject({
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      url: SITE_URL,
    });
  });

  it("dateModified があればそれを、無ければ datePublished を使うこと", () => {
    expect(buildBlogPostingSchema({ ...post, dateModified: "2026-10-28" }).dateModified).toBe("2026-10-28");
    expect(buildBlogPostingSchema(post).dateModified).toBe("2026-04-17");
  });
});

describe("記事ページの BlogPosting", () => {
  it("ja の getting-started は dateModified が date（2026-04-17）で、image と author が付くこと", async () => {
    const { container } = render((await GuidePage({ params: Promise.resolve({ slug: "getting-started" }) })) as React.ReactElement);
    const p = blogPostingOf(container);
    expect(p.dateModified).toBe("2026-04-17");
    expect(p.image).toBe(`${SITE_URL}${DEFAULT_OG_IMAGE_PATH}`);
    expect(p.author?.["@id"]).toBe(`${SITE_URL}/#organization`);
    expect(p.author?.url).toBe(SITE_URL);
  });

  it.each(["en", "es", "pt-br", "de"])("%s の getting-started は dateModified が updated（2026-10-28）で datePublished と異なること", async (locale) => {
    const { container } = render(
      (await LocaleGuidePage({ params: Promise.resolve({ locale, slug: "getting-started" }) })) as React.ReactElement
    );
    const p = blogPostingOf(container);
    expect(p.dateModified).toBe("2026-10-28");
    expect(p.datePublished).toBe("2026-04-17");
    expect(p.image).toBe(`${SITE_URL}${DEFAULT_OG_IMAGE_PATH}`);
  });

  it("use-cases のページで dateModified が updated ?? date で渡ること", async () => {
    const slug = getUseCaseSlugList()[0];
    const u = getUseCase(slug);
    const { container } = render((await UseCasePage({ params: Promise.resolve({ slug }) })) as React.ReactElement);
    const p = blogPostingOf(container);
    expect(p.dateModified).toBe(u?.updated ?? u?.date);
    expect(p.image).toBe(`${SITE_URL}${DEFAULT_OG_IMAGE_PATH}`);
  });

  it("blog のページで dateModified が updated ?? date で渡ること", async () => {
    const slug = getBlogSlugList()[0];
    const b = getBlog(slug);
    const { container } = render((await BlogPage({ params: Promise.resolve({ slug }) })) as React.ReactElement);
    const p = blogPostingOf(container);
    expect(p.dateModified).toBe(b?.updated ?? b?.date);
    expect(p.image).toBe(`${SITE_URL}${DEFAULT_OG_IMAGE_PATH}`);
  });

  it("存在しない slug は notFound になること（異常系）", async () => {
    await expect(BlogPage({ params: Promise.resolve({ slug: "no-such" }) })).rejects.toThrow("notFound called");
  });
});
