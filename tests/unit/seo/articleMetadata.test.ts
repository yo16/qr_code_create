/**
 * @jest-environment node
 */
// 記事の og:type は article、modifiedTime は updated ?? date。記事以外は website のまま
import type { Metadata } from "next";
import { buildMetadata, PAGE_METADATA, getLocalePageMetadata } from "@/lib/metadata/buildMetadata";
import { generateMetadata as jaGuideMeta } from "@/app/(ja)/(marketing)/guide/[slug]/page";
import { generateMetadata as jaUseCaseMeta } from "@/app/(ja)/(marketing)/use-cases/[slug]/page";
import { generateMetadata as jaBlogMeta } from "@/app/(ja)/(marketing)/blog/[slug]/page";
import { generateMetadata as localeGuideMeta } from "@/app/[locale]/(marketing)/guide/[slug]/page";
import { getGuide, getGuideSlugList } from "@/lib/content/getGuide";
import { getUseCase, getUseCaseSlugList } from "@/lib/content/getUseCase";
import { getBlog, getBlogSlugList } from "@/lib/content/getBlog";
import { NON_JA_LOCALES } from "@/i18n/locales";

jest.mock("next-mdx-remote/rsc", () => ({ MDXRemote: () => null }));
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("notFound called");
  }),
}));

type OgArticle = { type?: string; publishedTime?: string; modifiedTime?: string };
const og = (m: Metadata): OgArticle => (m.openGraph ?? {}) as OgArticle;

describe("buildMetadata の article 引数", () => {
  const base = { title: "t", description: "d", path: "/x" };

  it("article を渡すと og:type が article で publishedTime と modifiedTime が付くこと", () => {
    const m = buildMetadata({ ...base, article: { publishedTime: "2026-04-17", modifiedTime: "2026-10-28" } });
    expect(og(m)).toMatchObject({ type: "article", publishedTime: "2026-04-17", modifiedTime: "2026-10-28" });
  });

  it("article を渡さなければ website で、publishedTime と modifiedTime が付かないこと", () => {
    const o = og(buildMetadata(base));
    expect(o.type).toBe("website");
    expect(o).not.toHaveProperty("publishedTime");
    expect(o).not.toHaveProperty("modifiedTime");
  });

  it("article を渡しても og:image は既定の画像のままであること", () => {
    const withArticle = buildMetadata({ ...base, article: { publishedTime: "a", modifiedTime: "b" } });
    expect(withArticle.openGraph?.images).toEqual(buildMetadata(base).openGraph?.images);
  });
});

describe("記事ページの generateMetadata", () => {
  it("ja の getting-started は article で modifiedTime が date（2026-04-17）であること", async () => {
    const m = await jaGuideMeta({ params: Promise.resolve({ slug: "getting-started" }) });
    expect(og(m)).toMatchObject({ type: "article", publishedTime: "2026-04-17", modifiedTime: "2026-04-17" });
  });

  it("ja の全ガイドが article で、modifiedTime が updated ?? date であること", async () => {
    for (const slug of getGuideSlugList()) {
      const g = getGuide(slug);
      const m = await jaGuideMeta({ params: Promise.resolve({ slug }) });
      expect({ slug, ...og(m) }).toMatchObject({ slug, type: "article", modifiedTime: g?.updated ?? g?.date });
    }
  });

  it("ja の use-cases が article で、modifiedTime が updated ?? date であること", async () => {
    const slugs = getUseCaseSlugList();
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      const u = getUseCase(slug);
      const m = await jaUseCaseMeta({ params: Promise.resolve({ slug }) });
      expect({ slug, ...og(m) }).toMatchObject({
        slug,
        type: "article",
        publishedTime: u?.date,
        modifiedTime: u?.updated ?? u?.date,
      });
    }
  });

  it("ja の blog が article で、modifiedTime が updated ?? date であること", async () => {
    const slugs = getBlogSlugList();
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      const b = getBlog(slug);
      const m = await jaBlogMeta({ params: Promise.resolve({ slug }) });
      expect({ slug, ...og(m) }).toMatchObject({
        slug,
        type: "article",
        publishedTime: b?.date,
        modifiedTime: b?.updated ?? b?.date,
      });
    }
  });

  it.each(NON_JA_LOCALES)("%s の getting-started は article で modifiedTime が 2026-10-28 であること", async (locale) => {
    const m = await localeGuideMeta({ params: Promise.resolve({ locale, slug: "getting-started" }) });
    expect(og(m)).toMatchObject({ type: "article", publishedTime: "2026-04-17", modifiedTime: "2026-10-28" });
  });

  it("存在しない slug は空のメタデータであること（異常系）", async () => {
    expect(await jaGuideMeta({ params: Promise.resolve({ slug: "no-such" }) })).toEqual({});
    expect(await jaBlogMeta({ params: Promise.resolve({ slug: "no-such" }) })).toEqual({});
    expect(await jaUseCaseMeta({ params: Promise.resolve({ slug: "no-such" }) })).toEqual({});
  });
});

describe("記事以外は website のまま", () => {
  it.each(["home", "create", "faq", "guide", "useCases", "blog"] as const)("PAGE_METADATA.%s は website で日付が付かないこと", (key) => {
    const o = og(buildMetadata(PAGE_METADATA[key]));
    expect(o.type).toBe("website");
    expect(o).not.toHaveProperty("modifiedTime");
  });

  it.each(NON_JA_LOCALES)("%s のトップと /create は website であること", (locale) => {
    const set = getLocalePageMetadata(locale);
    expect(og(buildMetadata(set.home, locale)).type).toBe("website");
    expect(og(buildMetadata(set.create, locale)).type).toBe("website");
  });
});
